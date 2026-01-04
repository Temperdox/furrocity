/**
 * LocationBarringSystem.js - Handles location access restrictions and redemption
 *
 * Locations can bar players for various reasons:
 * - NSFW behavior at churches/temples
 * - Criminal activity
 * - Faction standing
 *
 * Players can regain access through:
 * - Completing quests
 * - Paying gold
 * - Charity work
 * - Waiting a period of time
 */

class LocationBarringSystem {
  constructor() {
    // Nothing to initialize
  }

  /**
   * Check if player is barred from a location
   */
  isBarred(locationId, playerState) {
    const ban = playerState.locationBans?.[locationId];
    if (!ban || !ban.banned) return false;

    // Check if redemption is complete
    if (this.isRedemptionComplete(locationId, playerState)) {
      // Auto-unbar if redemption is done
      this.unbarPlayer(locationId, playerState);
      return false;
    }

    return true;
  }

  /**
   * Get barring details for a location
   */
  getBarringDetails(locationId, playerState) {
    const ban = playerState.locationBans?.[locationId];
    if (!ban) return null;

    return {
      banned: ban.banned,
      reason: ban.reason,
      bannedAt: ban.bannedAt,
      offenseCount: ban.offenseCount,
      redemptionTasks: ban.redemptionTasks,
      redemptionProgress: this.getRedemptionProgress(locationId, playerState)
    };
  }

  /**
   * Bar a player from a location
   */
  barPlayer(locationId, playerState, reason, redemptionTasks = []) {
    if (!playerState.locationBans) {
      playerState.locationBans = {};
    }

    const existingBan = playerState.locationBans[locationId];
    const offenseCount = (existingBan?.offenseCount || 0) + 1;

    playerState.locationBans[locationId] = {
      banned: true,
      reason,
      bannedAt: Date.now(),
      offenseCount,
      offenseHistory: [
        ...(existingBan?.offenseHistory || []),
        { reason, timestamp: Date.now() }
      ],
      redemptionTasks: redemptionTasks.length > 0
        ? redemptionTasks
        : this._generateDefaultRedemptionTasks(reason, offenseCount)
    };

    return {
      success: true,
      locationId,
      reason,
      offenseCount,
      redemptionTasks: playerState.locationBans[locationId].redemptionTasks
    };
  }

  /**
   * Unbar a player from a location
   */
  unbarPlayer(locationId, playerState) {
    if (!playerState.locationBans?.[locationId]) {
      return { success: false, reason: 'not_banned' };
    }

    playerState.locationBans[locationId].banned = false;
    playerState.locationBans[locationId].unbannedAt = Date.now();

    return { success: true, locationId };
  }

  /**
   * Check if all redemption tasks are complete
   */
  isRedemptionComplete(locationId, playerState) {
    const ban = playerState.locationBans?.[locationId];
    if (!ban || !ban.redemptionTasks) return false;

    return ban.redemptionTasks.every(task => this._isTaskComplete(task, playerState));
  }

  /**
   * Get redemption progress
   */
  getRedemptionProgress(locationId, playerState) {
    const ban = playerState.locationBans?.[locationId];
    if (!ban || !ban.redemptionTasks) return null;

    return ban.redemptionTasks.map(task => ({
      ...task,
      complete: this._isTaskComplete(task, playerState),
      progress: this._getTaskProgress(task, playerState)
    }));
  }

  /**
   * Complete a redemption task
   */
  completeRedemptionTask(locationId, taskIndex, playerState, amount = null) {
    const ban = playerState.locationBans?.[locationId];
    if (!ban || !ban.redemptionTasks?.[taskIndex]) {
      return { success: false, reason: 'task_not_found' };
    }

    const task = ban.redemptionTasks[taskIndex];
    const result = { success: false };

    switch (task.type) {
      case 'gold':
        const payAmount = amount || task.amount;
        if (playerState.gold >= payAmount) {
          playerState.gold -= payAmount;
          task.paid = true;
          result.success = true;
          result.goldPaid = payAmount;
        } else {
          result.reason = 'insufficient_gold';
          result.required = task.amount;
          result.current = playerState.gold;
        }
        break;

      case 'charity':
        // Hours are added through service interaction
        if (amount) {
          task.completed = (task.completed || 0) + amount;
          result.success = true;
          result.hoursCompleted = task.completed;
          result.hoursRequired = task.hours;
        }
        break;

      case 'quest':
        // Quest completion is checked dynamically
        if (playerState.completedQuests?.includes(task.questId)) {
          task.completed = true;
          result.success = true;
        } else {
          result.reason = 'quest_not_complete';
          result.questRequired = task.questId;
        }
        break;

      case 'time':
        // Start the timer
        if (!task.startedAt) {
          task.startedAt = Date.now();
          result.success = true;
          result.message = `Timer started. Wait ${task.hours} hours.`;
        } else {
          // Check if enough time has passed
          const hoursPassed = (Date.now() - task.startedAt) / (1000 * 60 * 60);
          if (hoursPassed >= task.hours) {
            result.success = true;
            result.timeComplete = true;
          } else {
            result.reason = 'time_remaining';
            result.hoursRemaining = Math.ceil(task.hours - hoursPassed);
          }
        }
        break;

      default:
        result.reason = 'unknown_task_type';
    }

    // Check if all tasks are now complete
    if (result.success && this.isRedemptionComplete(locationId, playerState)) {
      result.allTasksComplete = true;
      result.message = 'All redemption tasks complete! You may now enter this location.';
    }

    return result;
  }

  /**
   * Add charity hours toward redemption
   */
  addCharityHours(locationId, hours, playerState) {
    const ban = playerState.locationBans?.[locationId];
    if (!ban || !ban.redemptionTasks) {
      return { success: false, reason: 'no_redemption_tasks' };
    }

    const charityTask = ban.redemptionTasks.find(t => t.type === 'charity');
    if (!charityTask) {
      return { success: false, reason: 'no_charity_task' };
    }

    charityTask.completed = (charityTask.completed || 0) + hours;

    return {
      success: true,
      hoursAdded: hours,
      totalCompleted: charityTask.completed,
      hoursRequired: charityTask.hours,
      complete: charityTask.completed >= charityTask.hours
    };
  }

  /**
   * Check if a specific task is complete
   */
  _isTaskComplete(task, playerState) {
    switch (task.type) {
      case 'gold':
        return task.paid === true;

      case 'charity':
        return (task.completed || 0) >= task.hours;

      case 'quest':
        return task.completed === true ||
               playerState.completedQuests?.includes(task.questId);

      case 'time':
        if (!task.startedAt) return false;
        const hoursPassed = (Date.now() - task.startedAt) / (1000 * 60 * 60);
        return hoursPassed >= task.hours;

      default:
        return false;
    }
  }

  /**
   * Get progress for a task
   */
  _getTaskProgress(task, playerState) {
    switch (task.type) {
      case 'gold':
        return {
          type: 'gold',
          required: task.amount,
          paid: task.paid || false,
          playerGold: playerState.gold
        };

      case 'charity':
        return {
          type: 'charity',
          required: task.hours,
          completed: task.completed || 0,
          remaining: Math.max(0, task.hours - (task.completed || 0))
        };

      case 'quest':
        return {
          type: 'quest',
          questId: task.questId,
          completed: playerState.completedQuests?.includes(task.questId) || task.completed
        };

      case 'time':
        if (!task.startedAt) {
          return {
            type: 'time',
            required: task.hours,
            started: false,
            remaining: task.hours
          };
        }
        const hoursPassed = (Date.now() - task.startedAt) / (1000 * 60 * 60);
        return {
          type: 'time',
          required: task.hours,
          started: true,
          passed: Math.floor(hoursPassed),
          remaining: Math.max(0, Math.ceil(task.hours - hoursPassed))
        };

      default:
        return { type: 'unknown' };
    }
  }

  /**
   * Generate default redemption tasks based on reason and severity
   */
  _generateDefaultRedemptionTasks(reason, offenseCount) {
    const tasks = [];

    switch (reason) {
      case 'public_indecency':
      case 'public_nsfw':
        // Gold donation
        tasks.push({
          type: 'gold',
          amount: 50 * offenseCount,
          paid: false,
          description: `Pay ${50 * offenseCount} gold as penance`
        });

        // Charity work for repeat offenders
        if (offenseCount >= 2) {
          tasks.push({
            type: 'charity',
            hours: 2 * offenseCount,
            completed: 0,
            description: `Complete ${2 * offenseCount} hours of community service`
          });
        }

        // Time wait for severe cases
        if (offenseCount >= 4) {
          tasks.push({
            type: 'time',
            hours: 24 * offenseCount,
            startedAt: null,
            description: `Wait ${offenseCount} days before returning`
          });
        }
        break;

      case 'criminal_activity':
        tasks.push({
          type: 'gold',
          amount: 200 * offenseCount,
          paid: false,
          description: `Pay ${200 * offenseCount} gold in fines`
        });
        tasks.push({
          type: 'time',
          hours: 48 * offenseCount,
          startedAt: null,
          description: `Serve ${offenseCount * 2} days of exile`
        });
        break;

      case 'faction_hostility':
        tasks.push({
          type: 'quest',
          questId: 'faction_redemption',
          completed: false,
          description: 'Complete a quest to restore your standing'
        });
        break;

      default:
        tasks.push({
          type: 'gold',
          amount: 100,
          paid: false,
          description: 'Pay 100 gold to regain access'
        });
    }

    return tasks;
  }

  /**
   * Get all locations player is barred from
   */
  getAllBarredLocations(playerState) {
    const barred = [];

    for (const [locationId, ban] of Object.entries(playerState.locationBans || {})) {
      if (ban.banned && !this.isRedemptionComplete(locationId, playerState)) {
        barred.push({
          locationId,
          ...ban,
          redemptionProgress: this.getRedemptionProgress(locationId, playerState)
        });
      }
    }

    return barred;
  }

  /**
   * Format task description for display
   */
  formatTaskDescription(task, playerState) {
    const progress = this._getTaskProgress(task, playerState);

    switch (task.type) {
      case 'gold':
        return progress.paid
          ? `✓ Paid ${task.amount} gold`
          : `Pay ${task.amount} gold (You have: ${playerState.gold})`;

      case 'charity':
        return progress.completed >= progress.required
          ? `✓ Completed ${task.hours} hours of charity`
          : `Complete ${progress.remaining} more hours of charity (${progress.completed}/${task.hours})`;

      case 'quest':
        return progress.completed
          ? `✓ Quest completed`
          : `Complete quest: ${task.questId}`;

      case 'time':
        if (!progress.started) {
          return `Wait ${task.hours} hours (not started)`;
        }
        return progress.remaining <= 0
          ? `✓ Wait time complete`
          : `Wait ${progress.remaining} more hours`;

      default:
        return task.description || 'Unknown task';
    }
  }
}

export default LocationBarringSystem;
