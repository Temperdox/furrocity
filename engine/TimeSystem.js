/**
 * @fileoverview TimeSystem - Manages the in-game day/night cycle
 *
 * Features:
 * - Action-based time progression (no real-time)
 * - Configurable time costs per action type
 * - Scene-level time overrides
 * - Day/night tracking
 * - Sleep mechanics
 * - Encounter modifiers based on time
 *
 * @module engine/TimeSystem
 */

/**
 * Default time costs in minutes for different action types
 */
export const DEFAULT_TIME_COSTS = {
  // Social interactions
  npc_interaction: 30,
  dialogue: 15,
  merchant_browse: 20,
  merchant_transaction: 10,

  // Travel
  local_travel: 60,
  region_travel: 120,  // Per progress action in expedition

  // Combat
  combat: 120,
  combat_victory: 30,  // Additional time after combat
  combat_defeat: 60,   // Additional time after defeat

  // NSFW activities
  sex: 240,
  sex_quick: 60,
  sex_extended: 480,

  // Rest and recovery
  rest: 60,
  sleep_short: 240,    // 4 hours
  sleep_full: 480,     // 8 hours

  // Exploration
  search: 30,
  explore: 45,
  scavenge: 60,
  investigate: 30,

  // Services
  service_church: 60,
  service_clinic: 120,
  service_nursery: 180,

  // Misc
  use_item: 5,
  equip_item: 2,
  read_book: 30,
  craft: 60,

  // Scene defaults by type
  scene_dialogue: 15,
  scene_combat: 120,
  scene_nsfw: 240,
  scene_exploration: 45,
  scene_event: 30
};

/**
 * Time periods of the day
 */
export const TIME_PERIODS = {
  DAWN: { start: 5, end: 7, name: 'Dawn', icon: '🌅', isNight: false },
  MORNING: { start: 7, end: 12, name: 'Morning', icon: '☀️', isNight: false },
  AFTERNOON: { start: 12, end: 17, name: 'Afternoon', icon: '🌤️', isNight: false },
  EVENING: { start: 17, end: 20, name: 'Evening', icon: '🌆', isNight: false },
  DUSK: { start: 20, end: 21, name: 'Dusk', icon: '🌇', isNight: false },
  NIGHT: { start: 21, end: 5, name: 'Night', icon: '🌙', isNight: true }
};

/**
 * Night encounter modifiers based on location tags
 */
export const NIGHT_ENCOUNTER_MODIFIERS = {
  // Safe locations - minimal increase
  safe: 0.05,
  town: 0.05,
  inn: 0.03,
  village: 0.05,
  temple: 0.02,
  church: 0.02,

  // Neutral locations
  road: 0.10,
  outdoor: 0.10,
  plains: 0.10,

  // Dangerous locations
  dangerous: 0.20,
  hostile: 0.25,
  forest: 0.15,
  wilderness: 0.15,

  // Very dangerous locations
  dungeon: 0.25,
  corrupted: 0.30,
  demon: 0.35,
  cave: 0.20,

  // Default for untagged
  default: 0.10
};

export class TimeSystem {
  /**
   * @param {Object} options - Configuration options
   * @param {Object} options.customTimeCosts - Override default time costs
   * @param {Object} options.customNightModifiers - Override night encounter modifiers
   */
  constructor(options = {}) {
    this.timeCosts = { ...DEFAULT_TIME_COSTS, ...options.customTimeCosts };
    this.nightModifiers = { ...NIGHT_ENCOUNTER_MODIFIERS, ...options.customNightModifiers };

    // Hours in a day
    this.hoursPerDay = 24;
    this.minutesPerHour = 60;
  }

  /**
   * Get the current time period based on hour
   * @param {number} hour - Current hour (0-23)
   * @returns {Object} Time period information
   */
  getTimePeriod(hour) {
    // Handle wrap-around for night (21-5)
    if (hour >= 21 || hour < 5) {
      return TIME_PERIODS.NIGHT;
    }

    for (const [key, period] of Object.entries(TIME_PERIODS)) {
      if (hour >= period.start && hour < period.end) {
        return period;
      }
    }

    return TIME_PERIODS.NIGHT;
  }

  /**
   * Check if it's currently night
   * @param {number} hour - Current hour (0-23)
   * @returns {boolean} True if night time
   */
  isNight(hour) {
    return this.getTimePeriod(hour).isNight;
  }

  /**
   * Get time cost for an action
   * @param {string} actionType - Type of action
   * @param {Object} sceneOverride - Optional scene with time override
   * @returns {number} Time cost in minutes
   */
  getTimeCost(actionType, sceneOverride = null) {
    // Check for scene-level override first
    if (sceneOverride?.timeCost !== undefined) {
      return sceneOverride.timeCost;
    }

    if (sceneOverride?.timeMinutes !== undefined) {
      return sceneOverride.timeMinutes;
    }

    // Check for scene type default
    if (sceneOverride?.type) {
      const sceneTypeKey = `scene_${sceneOverride.type}`;
      if (this.timeCosts[sceneTypeKey] !== undefined) {
        return this.timeCosts[sceneTypeKey];
      }
    }

    return this.timeCosts[actionType] || this.timeCosts.scene_event || 30;
  }

  /**
   * Advance time by a specified number of minutes
   * @param {Object} currentTime - Current time object { day, hour, minute }
   * @param {number} minutes - Minutes to advance
   * @returns {Object} New time object and day change info
   */
  advanceTime(currentTime, minutes) {
    let { day = 1, hour = 8, minute = 0 } = currentTime;

    // Add minutes
    minute += minutes;

    // Handle hour overflow
    while (minute >= this.minutesPerHour) {
      minute -= this.minutesPerHour;
      hour++;
    }

    // Handle day overflow
    let daysAdvanced = 0;
    while (hour >= this.hoursPerDay) {
      hour -= this.hoursPerDay;
      day++;
      daysAdvanced++;
    }

    const newTime = { day, hour, minute };
    const wasNight = this.isNight(currentTime.hour || 8);
    const isNowNight = this.isNight(hour);

    return {
      newTime,
      daysAdvanced,
      dayChanged: daysAdvanced > 0,
      periodChanged: wasNight !== isNowNight,
      becameNight: !wasNight && isNowNight,
      becameDay: wasNight && !isNowNight,
      period: this.getTimePeriod(hour)
    };
  }

  /**
   * Process an action and advance time accordingly
   * @param {Object} currentTime - Current time object
   * @param {string} actionType - Type of action performed
   * @param {Object} sceneOverride - Optional scene with time override
   * @returns {Object} Time advancement result
   */
  processAction(currentTime, actionType, sceneOverride = null) {
    const timeCost = this.getTimeCost(actionType, sceneOverride);
    return {
      ...this.advanceTime(currentTime, timeCost),
      actionType,
      timeCost
    };
  }

  /**
   * Sleep until a target time
   * @param {Object} currentTime - Current time object
   * @param {string} sleepType - 'night' or 'morning'
   * @returns {Object} Time advancement result
   */
  sleep(currentTime, sleepType = 'morning') {
    let { day = 1, hour = 8, minute = 0 } = currentTime;
    const wasNight = this.isNight(hour);
    let hoursSlept = 0;

    if (sleepType === 'night' && !wasNight) {
      // Sleep until night (21:00)
      const targetHour = 21;
      if (hour < targetHour) {
        hoursSlept = targetHour - hour;
        hour = targetHour;
        minute = 0;
      }
    } else if (sleepType === 'morning') {
      // Sleep until next morning (7:00)
      // Always advances to next day
      if (hour >= 7) {
        // Need to go to next day
        hoursSlept = (24 - hour) + 7;
        day++;
        hour = 7;
        minute = 0;
      } else {
        // Same day, sleep until 7
        hoursSlept = 7 - hour;
        hour = 7;
        minute = 0;
      }
    }

    const newTime = { day, hour, minute };

    return {
      newTime,
      hoursSlept,
      daysAdvanced: sleepType === 'morning' && (currentTime.hour || 8) >= 7 ? 1 : 0,
      dayChanged: day !== (currentTime.day || 1),
      restoreStamina: true,
      restoreHealth: true,
      period: this.getTimePeriod(hour)
    };
  }

  /**
   * Set time to a specific time of day (day or night)
   * Day increments only when going backwards in time (night->day)
   * @param {Object} currentTime - Current time object
   * @param {string} target - 'day' (7:00) or 'night' (21:00)
   * @returns {Object} Time change result
   */
  setTimeOfDay(currentTime, target) {
    let { day = 1, hour = 8, minute = 0 } = currentTime;
    const wasNight = this.isNight(hour);
    const oldPeriod = this.getTimePeriod(hour);
    let daysAdvanced = 0;

    if (target === 'day') {
      // Set to 7:00 (start of day)
      const targetHour = 7;

      // If currently night (21-4) or later in the day (after 7), we're going backwards
      // Need to increment day
      if (hour >= targetHour) {
        // Going backwards in time OR it's already past 7 - go to next day
        day++;
        daysAdvanced = 1;
      }
      // If currently in early morning (0-6), we're moving forward to 7 - no day increment

      hour = targetHour;
      minute = 0;
    } else if (target === 'night') {
      // Set to 21:00 (start of night)
      const targetHour = 21;

      // Only increment day if we're going backwards (currently past 21 means we'd wrap)
      if (hour >= targetHour) {
        // Currently at or past 21:00 - going to 21:00 tomorrow
        day++;
        daysAdvanced = 1;
      }
      // If current hour < 21, we're moving forward in time - no day increment

      hour = targetHour;
      minute = 0;
    }

    const newTime = { day, hour, minute };
    const newPeriod = this.getTimePeriod(hour);

    return {
      newTime,
      daysAdvanced,
      dayChanged: daysAdvanced > 0,
      periodChanged: oldPeriod.name !== newPeriod.name,
      becameNight: !wasNight && this.isNight(hour),
      becameDay: wasNight && !this.isNight(hour),
      period: newPeriod,
      target
    };
  }

  /**
   * Calculate night encounter modifier for a location
   * @param {Array|Object} locationTags - Location tags or location object
   * @param {number} hour - Current hour
   * @returns {number} Encounter chance modifier (0.0 to 1.0+)
   */
  getNightEncounterModifier(locationTags, hour) {
    if (!this.isNight(hour)) {
      return 0;
    }

    // Extract tags array
    let tags = [];
    if (Array.isArray(locationTags)) {
      tags = locationTags;
    } else if (locationTags?.tags) {
      tags = locationTags.tags;
    }

    // Find highest applicable modifier
    let highestModifier = this.nightModifiers.default;

    for (const tag of tags) {
      const modifier = this.nightModifiers[tag];
      if (modifier !== undefined && modifier > highestModifier) {
        highestModifier = modifier;
      }
    }

    return highestModifier;
  }

  /**
   * Get time display string
   * @param {Object} time - Time object { day, hour, minute }
   * @returns {string} Formatted time string
   */
  formatTime(time) {
    const { hour = 8, minute = 0 } = time;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  }

  /**
   * Get 24-hour format time string
   * @param {Object} time - Time object { day, hour, minute }
   * @returns {string} Formatted 24h time string
   */
  formatTime24(time) {
    const { hour = 8, minute = 0 } = time;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  /**
   * Get day display string
   * @param {Object} time - Time object { day, hour, minute }
   * @returns {string} Day display
   */
  formatDay(time) {
    return `Day ${time.day || 1}`;
  }

  /**
   * Get background color values based on time
   * @param {number} hour - Current hour (0-23)
   * @returns {Object} Color values for UI theming
   */
  getTimeColors(hour) {
    // Define color schemes for different times
    const colorSchemes = {
      night: {
        primary: '#0a0a1a',
        secondary: '#12122a',
        accent: '#1a1a3a',
        overlay: 'rgba(10, 10, 40, 0.4)',
        text: '#b0b0d0',
        gradient: 'linear-gradient(180deg, #0a0a1a 0%, #12122a 50%, #1a1a3a 100%)'
      },
      dawn: {
        primary: '#1a1520',
        secondary: '#2a2030',
        accent: '#4a3050',
        overlay: 'rgba(80, 50, 80, 0.2)',
        text: '#d0c0d0',
        gradient: 'linear-gradient(180deg, #1a1520 0%, #3a2040 50%, #5a3060 100%)'
      },
      morning: {
        primary: '#1a1a2e',
        secondary: '#1f1f3a',
        accent: '#2a2a4a',
        overlay: 'rgba(255, 200, 100, 0.05)',
        text: '#e0e0e0',
        gradient: 'linear-gradient(180deg, #1a1a2e 0%, #1f1f3a 50%, #2a2a4a 100%)'
      },
      afternoon: {
        primary: '#1e1e30',
        secondary: '#242440',
        accent: '#2e2e50',
        overlay: 'rgba(255, 220, 150, 0.08)',
        text: '#e5e5e5',
        gradient: 'linear-gradient(180deg, #1e1e30 0%, #242440 50%, #2e2e50 100%)'
      },
      evening: {
        primary: '#1a1525',
        secondary: '#201a30',
        accent: '#2a2040',
        overlay: 'rgba(255, 150, 80, 0.1)',
        text: '#d8d0d8',
        gradient: 'linear-gradient(180deg, #1a1525 0%, #251a35 50%, #301a40 100%)'
      },
      dusk: {
        primary: '#151020',
        secondary: '#1a1530',
        accent: '#251a40',
        overlay: 'rgba(150, 80, 120, 0.15)',
        text: '#c8c0d0',
        gradient: 'linear-gradient(180deg, #151020 0%, #201530 50%, #2a1a45 100%)'
      }
    };

    const period = this.getTimePeriod(hour);
    const periodKey = period.name.toLowerCase();

    return colorSchemes[periodKey] || colorSchemes.night;
  }

  /**
   * Get CSS custom properties for time-based theming
   * @param {number} hour - Current hour
   * @returns {Object} CSS custom properties
   */
  getTimeCSSProperties(hour) {
    const colors = this.getTimeColors(hour);
    const period = this.getTimePeriod(hour);

    return {
      '--time-primary': colors.primary,
      '--time-secondary': colors.secondary,
      '--time-accent': colors.accent,
      '--time-overlay': colors.overlay,
      '--time-text': colors.text,
      '--time-gradient': colors.gradient,
      '--time-period': period.name.toLowerCase(),
      '--time-is-night': period.isNight ? '1' : '0'
    };
  }

  /**
   * Get clock hand angles for display
   * @param {Object} time - Time object { hour, minute }
   * @returns {Object} Angles in degrees for clock hands
   */
  getClockAngles(time) {
    const { hour = 8, minute = 0 } = time;

    // Hour hand: 360 degrees / 12 hours = 30 degrees per hour
    // Plus 0.5 degrees per minute for smooth movement
    const hourAngle = ((hour % 12) * 30) + (minute * 0.5);

    // Minute hand: 360 degrees / 60 minutes = 6 degrees per minute
    const minuteAngle = minute * 6;

    return {
      hourAngle,
      minuteAngle
    };
  }

  /**
   * Get time summary for display
   * @param {Object} time - Time object
   * @returns {Object} Complete time summary
   */
  getTimeSummary(time) {
    const period = this.getTimePeriod(time.hour || 8);
    const colors = this.getTimeColors(time.hour || 8);
    const clockAngles = this.getClockAngles(time);

    return {
      day: time.day || 1,
      hour: time.hour || 8,
      minute: time.minute || 0,
      formatted: this.formatTime(time),
      formatted24: this.formatTime24(time),
      dayFormatted: this.formatDay(time),
      period: period.name,
      periodIcon: period.icon,
      isNight: period.isNight,
      colors,
      clockAngles,
      cssProperties: this.getTimeCSSProperties(time.hour || 8)
    };
  }
}

export default TimeSystem;
