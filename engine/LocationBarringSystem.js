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
 * - Charity work (in-game days)
 * - Waiting a period of time (in-game days)
 */

export class LocationBarringSystem {
  /**
   * @param {Object} options - Configuration options
   * @param {Function} options.gameTimeProvider - Function that returns { currentDay, currentAction }
   */
  constructor(options = {}) {
    // Game time provider for turn-based timing
    this.gameTimeProvider = options.gameTimeProvider || (() => ({
      currentDay: 0,
      currentAction: 0
    }));
  }

  /**
   * Get current game day
   */
  getCurrentDay() {
    const time = this.gameTimeProvider();
    return time.currentDay ?? 0;
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
    const currentDay = this.getCurrentDay();

    playerState.locationBans[locationId] = {
      banned: true,
      reason,
      bannedOnDay: currentDay,
      offenseCount,
      offenseHistory: [
        ...(existingBan?.offenseHistory || []),
        { reason, day: currentDay }
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
    playerState.locationBans[locationId].unbannedOnDay = this.getCurrentDay();

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
        // Start the timer (day-based)
        if (task.startedOnDay === undefined) {
          task.startedOnDay = this.getCurrentDay();
          result.success = true;
          result.message = `Timer started. Wait ${task.days} day(s).`;
        } else {
          // Check if enough days have passed
          const daysPassed = this.getCurrentDay() - task.startedOnDay;
          if (daysPassed >= task.days) {
            result.success = true;
            result.timeComplete = true;
          } else {
            result.reason = 'time_remaining';
            result.daysRemaining = task.days - daysPassed;
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
        return (task.completed || 0) >= (task.days || task.hours || 1);

      case 'quest':
        return task.completed === true ||
               playerState.completedQuests?.includes(task.questId);

      case 'time':
        if (task.startedOnDay === undefined) return false;
        const daysPassed = this.getCurrentDay() - task.startedOnDay;
        return daysPassed >= task.days;

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
        const charityRequired = task.days || task.hours || 1;
        return {
          type: 'charity',
          required: charityRequired,
          completed: task.completed || 0,
          remaining: Math.max(0, charityRequired - (task.completed || 0))
        };

      case 'quest':
        return {
          type: 'quest',
          questId: task.questId,
          completed: playerState.completedQuests?.includes(task.questId) || task.completed
        };

      case 'time':
        if (task.startedOnDay === undefined) {
          return {
            type: 'time',
            required: task.days,
            started: false,
            remaining: task.days
          };
        }
        const daysPassed = this.getCurrentDay() - task.startedOnDay;
        return {
          type: 'time',
          required: task.days,
          started: true,
          passed: daysPassed,
          remaining: Math.max(0, task.days - daysPassed)
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

        // Charity work for repeat offenders (in days of service)
        if (offenseCount >= 2) {
          tasks.push({
            type: 'charity',
            days: offenseCount,
            completed: 0,
            description: `Complete ${offenseCount} day(s) of community service`
          });
        }

        // Time wait for severe cases
        if (offenseCount >= 4) {
          tasks.push({
            type: 'time',
            days: offenseCount,
            startedOnDay: undefined,
            description: `Wait ${offenseCount} day(s) before returning`
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
          days: offenseCount * 2,
          startedOnDay: undefined,
          description: `Serve ${offenseCount * 2} day(s) of exile`
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
          ? `Paid ${task.amount} gold`
          : `Pay ${task.amount} gold (You have: ${playerState.gold})`;

      case 'charity':
        return progress.completed >= progress.required
          ? `Completed ${progress.required} day(s) of charity`
          : `Complete ${progress.remaining} more day(s) of charity (${progress.completed}/${progress.required})`;

      case 'quest':
        return progress.completed
          ? `Quest completed`
          : `Complete quest: ${task.questId}`;

      case 'time':
        if (!progress.started) {
          return `Wait ${task.days} day(s) (not started)`;
        }
        return progress.remaining <= 0
          ? `Wait time complete`
          : `Wait ${progress.remaining} more day(s)`;

      default:
        return task.description || 'Unknown task';
    }
  }
}

export default LocationBarringSystem;
