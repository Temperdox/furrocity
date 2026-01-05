/**
 * @fileoverview LodgingSystem - Manages inn room rentals and property rentals
 *
 * Features:
 * - Inn room rentals (per-night or multi-day)
 * - Rental properties with periodic payments
 * - Expiration tracking and day-advance processing
 * - Sleep eligibility checking
 * - Lodging history and statistics
 *
 * @module engine/LodgingSystem
 */

/**
 * LodgingSystem - Handles all lodging mechanics
 */
export class LodgingSystem {
  /**
   * @param {Object} timeSystem - Reference to TimeSystem for day tracking
   */
  constructor(timeSystem) {
    this.timeSystem = timeSystem;
    this.innRooms = new Map();
    this.rentedProperties = new Map();
    this.locationRoomMap = new Map(); // locationId -> [roomIds]
    this.locationPropertyMap = new Map(); // locationId -> [propertyIds]
  }

  /**
   * Initialize with lodging configuration data
   * @param {Object} lodgingData - Lodging configuration from JSON
   */
  initialize(lodgingData) {
    if (!lodgingData) return;

    // Load inn rooms
    if (lodgingData.innRooms) {
      for (const [roomId, room] of Object.entries(lodgingData.innRooms)) {
        this.innRooms.set(roomId, { ...room, id: roomId });

        // Index by location
        if (room.locationId) {
          if (!this.locationRoomMap.has(room.locationId)) {
            this.locationRoomMap.set(room.locationId, []);
          }
          this.locationRoomMap.get(room.locationId).push(roomId);
        }
      }
    }

    // Load rental properties
    if (lodgingData.rentedProperties) {
      for (const [propertyId, property] of Object.entries(lodgingData.rentedProperties)) {
        this.rentedProperties.set(propertyId, { ...property, id: propertyId });

        // Index by location
        if (property.locationId) {
          if (!this.locationPropertyMap.has(property.locationId)) {
            this.locationPropertyMap.set(property.locationId, []);
          }
          this.locationPropertyMap.get(property.locationId).push(propertyId);
        }
      }
    }
  }

  // ============================================================================
  // INN ROOM OPERATIONS
  // ============================================================================

  /**
   * Get all rooms available at a location
   * @param {string} locationId - Location ID
   * @returns {Array} Array of room definitions
   */
  getRoomsAtLocation(locationId) {
    const roomIds = this.locationRoomMap.get(locationId) || [];
    return roomIds.map(id => this.innRooms.get(id)).filter(Boolean);
  }

  /**
   * Get a specific room definition
   * @param {string} roomId - Room ID
   * @returns {Object|null} Room definition
   */
  getRoom(roomId) {
    return this.innRooms.get(roomId) || null;
  }

  /**
   * Rent a room at an inn
   * @param {Object} player - Player state
   * @param {string} roomId - Room ID to rent
   * @param {number} days - Number of days to rent (default 1)
   * @returns {Object} { success, room?, expirationDay?, cost?, error?, updatedLodging? }
   */
  rentRoom(player, roomId, days = 1) {
    const room = this.innRooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Validate days
    const numDays = Math.max(1, Math.floor(days));
    if (room.maxDays && numDays > room.maxDays) {
      return { success: false, error: `Maximum rental is ${room.maxDays} days` };
    }

    // Calculate cost
    const cost = room.pricePerNight * numDays;
    if (player.gold < cost) {
      return { success: false, error: `Not enough gold (need ${cost}, have ${player.gold})` };
    }

    // Get current day
    const currentDay = player.currentTime?.day || 1;
    const expirationDay = currentDay + numDays;

    // Create rental record
    const rental = {
      roomId,
      locationId: room.locationId,
      roomName: room.name,
      checkInDay: currentDay,
      expirationDay,
      daysRented: numDays,
      pricePerNight: room.pricePerNight,
      totalPaid: cost,
      quality: room.quality || 'standard',
      bonuses: room.bonuses || {},
      isActive: true
    };

    // Update player lodging state
    const updatedLodging = this.updatePlayerLodging(player, 'innRoom', roomId, rental);

    return {
      success: true,
      room,
      rental,
      expirationDay,
      cost,
      updatedLodging
    };
  }

  /**
   * Extend an existing room rental
   * @param {Object} player - Player state
   * @param {string} roomId - Room ID
   * @param {number} additionalDays - Days to add
   * @returns {Object} { success, newExpirationDay?, cost?, error?, updatedLodging? }
   */
  extendStay(player, roomId, additionalDays) {
    const existingRental = player.lodging?.innRooms?.[roomId];
    if (!existingRental || !existingRental.isActive) {
      return { success: false, error: 'No active rental for this room' };
    }

    const room = this.innRooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const numDays = Math.max(1, Math.floor(additionalDays));
    const newTotalDays = existingRental.daysRented + numDays;

    if (room.maxDays && newTotalDays > room.maxDays) {
      return { success: false, error: `Maximum rental is ${room.maxDays} days` };
    }

    const cost = room.pricePerNight * numDays;
    if (player.gold < cost) {
      return { success: false, error: `Not enough gold (need ${cost}, have ${player.gold})` };
    }

    // Update rental
    const updatedRental = {
      ...existingRental,
      expirationDay: existingRental.expirationDay + numDays,
      daysRented: newTotalDays,
      totalPaid: existingRental.totalPaid + cost
    };

    const updatedLodging = this.updatePlayerLodging(player, 'innRoom', roomId, updatedRental);

    return {
      success: true,
      newExpirationDay: updatedRental.expirationDay,
      cost,
      updatedLodging
    };
  }

  /**
   * Check out of a room (early checkout)
   * @param {Object} player - Player state
   * @param {string} roomId - Room ID
   * @returns {Object} { success, error?, updatedLodging? }
   */
  checkOut(player, roomId) {
    const existingRental = player.lodging?.innRooms?.[roomId];
    if (!existingRental) {
      return { success: false, error: 'No rental found for this room' };
    }

    // Mark as inactive
    const updatedRental = {
      ...existingRental,
      isActive: false,
      checkOutDay: player.currentTime?.day || 1
    };

    const updatedLodging = this.updatePlayerLodging(player, 'innRoom', roomId, updatedRental);

    // Add to history
    updatedLodging.history = updatedLodging.history || [];
    updatedLodging.history.push({
      type: 'inn',
      roomId,
      locationId: existingRental.locationId,
      checkIn: existingRental.checkInDay,
      checkOut: updatedRental.checkOutDay,
      totalSpent: existingRental.totalPaid
    });

    return { success: true, updatedLodging };
  }

  /**
   * Check if player has a valid room at a location
   * @param {Object} player - Player state
   * @param {string} locationId - Location ID
   * @param {number} currentDay - Current game day
   * @returns {Object|null} Active room rental or null
   */
  hasValidRoomAt(player, locationId, currentDay) {
    if (!player.lodging?.innRooms) return null;

    for (const [roomId, rental] of Object.entries(player.lodging.innRooms)) {
      if (
        rental.locationId === locationId &&
        rental.isActive &&
        rental.expirationDay > currentDay
      ) {
        return rental;
      }
    }

    return null;
  }

  // ============================================================================
  // RENTAL PROPERTY OPERATIONS
  // ============================================================================

  /**
   * Get all rental properties available
   * @returns {Array} Array of property definitions
   */
  getPropertiesAvailable() {
    return Array.from(this.rentedProperties.values());
  }

  /**
   * Get properties at a specific location
   * @param {string} locationId - Location ID
   * @returns {Array} Array of property definitions
   */
  getPropertiesAtLocation(locationId) {
    const propertyIds = this.locationPropertyMap.get(locationId) || [];
    return propertyIds.map(id => this.rentedProperties.get(id)).filter(Boolean);
  }

  /**
   * Get a specific property definition
   * @param {string} propertyId - Property ID
   * @returns {Object|null} Property definition
   */
  getProperty(propertyId) {
    return this.rentedProperties.get(propertyId) || null;
  }

  /**
   * Rent a property (start a lease)
   * @param {Object} player - Player state
   * @param {string} propertyId - Property ID
   * @returns {Object} { success, property?, totalCost?, nextPaymentDay?, error?, updatedLodging? }
   */
  rentProperty(player, propertyId) {
    const property = this.rentedProperties.get(propertyId);
    if (!property) {
      return { success: false, error: 'Property not found' };
    }

    // Check if already renting this property
    const existing = player.lodging?.rentedProperties?.[propertyId];
    if (existing?.isActive) {
      return { success: false, error: 'Already renting this property' };
    }

    // Calculate initial cost (deposit + first period)
    const deposit = property.deposit || 0;
    const firstRent = property.rentPerPeriod;
    const totalCost = deposit + firstRent;

    if (player.gold < totalCost) {
      return { success: false, error: `Not enough gold (need ${totalCost}, have ${player.gold})` };
    }

    const currentDay = player.currentTime?.day || 1;
    const rentPeriodDays = property.rentPeriodDays || 7;
    const nextPaymentDay = currentDay + rentPeriodDays;

    const rental = {
      propertyId,
      locationId: property.locationId,
      propertyName: property.name,
      startDay: currentDay,
      lastPaymentDay: currentDay,
      nextPaymentDay,
      rentPeriodDays,
      rentPerPeriod: property.rentPerPeriod,
      depositPaid: deposit,
      totalPaid: totalCost,
      missedPayments: 0,
      bonuses: property.bonuses || {},
      amenities: property.amenities || [],
      isActive: true,
      accessGranted: true
    };

    const updatedLodging = this.updatePlayerLodging(player, 'rentedProperty', propertyId, rental);

    return {
      success: true,
      property,
      rental,
      totalCost,
      nextPaymentDay,
      updatedLodging
    };
  }

  /**
   * Make a rent payment for a property
   * @param {Object} player - Player state
   * @param {string} propertyId - Property ID
   * @returns {Object} { success, cost?, nextPaymentDay?, error?, updatedLodging? }
   */
  makeRentPayment(player, propertyId) {
    const existing = player.lodging?.rentedProperties?.[propertyId];
    if (!existing || !existing.isActive) {
      return { success: false, error: 'No active rental for this property' };
    }

    const property = this.rentedProperties.get(propertyId);
    if (!property) {
      return { success: false, error: 'Property not found' };
    }

    const cost = property.rentPerPeriod;
    if (player.gold < cost) {
      return { success: false, error: `Not enough gold (need ${cost}, have ${player.gold})` };
    }

    const currentDay = player.currentTime?.day || 1;
    const nextPaymentDay = currentDay + existing.rentPeriodDays;

    const updatedRental = {
      ...existing,
      lastPaymentDay: currentDay,
      nextPaymentDay,
      totalPaid: existing.totalPaid + cost,
      missedPayments: 0,
      accessGranted: true
    };

    const updatedLodging = this.updatePlayerLodging(player, 'rentedProperty', propertyId, updatedRental);

    return {
      success: true,
      cost,
      nextPaymentDay,
      updatedLodging
    };
  }

  /**
   * Terminate a property lease
   * @param {Object} player - Player state
   * @param {string} propertyId - Property ID
   * @param {boolean} refundDeposit - Whether to refund the deposit
   * @returns {Object} { success, refund?, error?, updatedLodging? }
   */
  terminateLease(player, propertyId, refundDeposit = true) {
    const existing = player.lodging?.rentedProperties?.[propertyId];
    if (!existing) {
      return { success: false, error: 'No rental found for this property' };
    }

    const currentDay = player.currentTime?.day || 1;
    const refund = refundDeposit && existing.missedPayments === 0 ? existing.depositPaid : 0;

    const updatedRental = {
      ...existing,
      isActive: false,
      accessGranted: false,
      endDay: currentDay
    };

    const updatedLodging = this.updatePlayerLodging(player, 'rentedProperty', propertyId, updatedRental);

    // Add to history
    updatedLodging.history = updatedLodging.history || [];
    updatedLodging.history.push({
      type: 'rental',
      propertyId,
      locationId: existing.locationId,
      checkIn: existing.startDay,
      checkOut: currentDay,
      totalSpent: existing.totalPaid - (refundDeposit ? existing.depositPaid : 0)
    });

    return {
      success: true,
      refund,
      updatedLodging
    };
  }

  /**
   * Check if player has access to a property
   * @param {Object} player - Player state
   * @param {string} propertyId - Property ID
   * @param {number} currentDay - Current game day
   * @returns {boolean} Whether player has access
   */
  hasAccessToProperty(player, propertyId, currentDay) {
    const rental = player.lodging?.rentedProperties?.[propertyId];
    if (!rental || !rental.isActive) return false;

    // Check if payment is overdue
    if (currentDay > rental.nextPaymentDay) {
      return false; // Access denied due to missed payment
    }

    return rental.accessGranted;
  }

  // ============================================================================
  // DAY PROCESSING
  // ============================================================================

  /**
   * Process a new day - check expirations and missed payments
   * @param {Object} player - Player state
   * @param {number} currentDay - Current game day
   * @returns {Object} { expiredRooms, missedPayments, evictions, updatedLodging }
   */
  processNewDay(player, currentDay) {
    const expiredRooms = [];
    const missedPayments = [];
    const evictions = [];
    let updatedLodging = { ...player.lodging };

    // Check inn rooms for expiration
    if (updatedLodging.innRooms) {
      for (const [roomId, rental] of Object.entries(updatedLodging.innRooms)) {
        if (rental.isActive && rental.expirationDay <= currentDay) {
          // Room has expired
          expiredRooms.push({
            roomId,
            locationId: rental.locationId,
            roomName: rental.roomName
          });

          // Mark as inactive
          updatedLodging.innRooms[roomId] = {
            ...rental,
            isActive: false,
            checkOutDay: currentDay
          };

          // Update stats
          updatedLodging.stats = updatedLodging.stats || {};
          updatedLodging.stats.totalNightsAtInns =
            (updatedLodging.stats.totalNightsAtInns || 0) + rental.daysRented;

          // Add to history
          updatedLodging.history = updatedLodging.history || [];
          updatedLodging.history.push({
            type: 'inn',
            roomId,
            locationId: rental.locationId,
            checkIn: rental.checkInDay,
            checkOut: currentDay,
            totalSpent: rental.totalPaid
          });
        }
      }
    }

    // Check rental properties for missed payments
    if (updatedLodging.rentedProperties) {
      for (const [propertyId, rental] of Object.entries(updatedLodging.rentedProperties)) {
        if (rental.isActive && currentDay > rental.nextPaymentDay) {
          // Payment is overdue
          const missedCount = rental.missedPayments + 1;

          missedPayments.push({
            propertyId,
            locationId: rental.locationId,
            propertyName: rental.propertyName,
            missedCount
          });

          // Update rental - revoke access
          updatedLodging.rentedProperties[propertyId] = {
            ...rental,
            missedPayments: missedCount,
            accessGranted: false
          };

          // Eviction after 2 missed payments
          if (missedCount >= 2) {
            evictions.push({
              propertyId,
              locationId: rental.locationId,
              propertyName: rental.propertyName
            });

            // Terminate lease, no deposit refund
            updatedLodging.rentedProperties[propertyId] = {
              ...rental,
              isActive: false,
              accessGranted: false,
              endDay: currentDay,
              evicted: true
            };

            // Add to history
            updatedLodging.history = updatedLodging.history || [];
            updatedLodging.history.push({
              type: 'rental',
              propertyId,
              locationId: rental.locationId,
              checkIn: rental.startDay,
              checkOut: currentDay,
              totalSpent: rental.totalPaid,
              evicted: true
            });
          }
        }
      }
    }

    return {
      expiredRooms,
      missedPayments,
      evictions,
      updatedLodging
    };
  }

  // ============================================================================
  // SLEEP ELIGIBILITY
  // ============================================================================

  /**
   * Check if player can sleep at a location
   * @param {Object} player - Player state
   * @param {string} locationId - Location ID
   * @param {number} currentDay - Current game day
   * @returns {Object} { canSleep, reason, lodgingType?, rental? }
   */
  canSleepAt(player, locationId, currentDay) {
    // Check for valid inn room at this location
    const innRoom = this.hasValidRoomAt(player, locationId, currentDay);
    if (innRoom) {
      return {
        canSleep: true,
        lodgingType: 'inn_room',
        rental: innRoom,
        reason: `Room at ${innRoom.roomName}`
      };
    }

    // Check for rental property at this location
    if (player.lodging?.rentedProperties) {
      for (const [propertyId, rental] of Object.entries(player.lodging.rentedProperties)) {
        if (
          rental.locationId === locationId &&
          rental.isActive &&
          rental.accessGranted &&
          currentDay <= rental.nextPaymentDay
        ) {
          return {
            canSleep: true,
            lodgingType: 'rented_property',
            rental,
            reason: `Rented at ${rental.propertyName}`
          };
        }
      }
    }

    // No lodging at this location
    return {
      canSleep: false,
      reason: 'No lodging at this location'
    };
  }

  /**
   * Get all player's current lodging
   * @param {Object} player - Player state
   * @param {number} currentDay - Current game day
   * @returns {Object} { innRooms: [], rentedProperties: [] }
   */
  getPlayerLodging(player, currentDay) {
    const result = {
      innRooms: [],
      rentedProperties: []
    };

    if (player.lodging?.innRooms) {
      for (const [roomId, rental] of Object.entries(player.lodging.innRooms)) {
        if (rental.isActive && rental.expirationDay > currentDay) {
          result.innRooms.push({
            ...rental,
            room: this.innRooms.get(roomId),
            daysRemaining: rental.expirationDay - currentDay
          });
        }
      }
    }

    if (player.lodging?.rentedProperties) {
      for (const [propertyId, rental] of Object.entries(player.lodging.rentedProperties)) {
        if (rental.isActive) {
          result.rentedProperties.push({
            ...rental,
            property: this.rentedProperties.get(propertyId),
            daysUntilPayment: rental.nextPaymentDay - currentDay,
            paymentOverdue: currentDay > rental.nextPaymentDay
          });
        }
      }
    }

    return result;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Update player lodging state immutably
   * @param {Object} player - Player state
   * @param {string} type - 'innRoom' or 'rentedProperty'
   * @param {string} id - Room or property ID
   * @param {Object} data - Rental data
   * @returns {Object} Updated lodging object
   */
  updatePlayerLodging(player, type, id, data) {
    const lodging = player.lodging || {
      innRooms: {},
      rentedProperties: {},
      history: [],
      stats: {
        totalNightsAtInns: 0,
        totalGoldOnLodging: 0,
        currentHomeProperty: null
      }
    };

    if (type === 'innRoom') {
      return {
        ...lodging,
        innRooms: {
          ...lodging.innRooms,
          [id]: data
        },
        stats: {
          ...lodging.stats,
          totalGoldOnLodging: (lodging.stats?.totalGoldOnLodging || 0) + (data.totalPaid - (lodging.innRooms?.[id]?.totalPaid || 0))
        }
      };
    }

    if (type === 'rentedProperty') {
      return {
        ...lodging,
        rentedProperties: {
          ...lodging.rentedProperties,
          [id]: data
        },
        stats: {
          ...lodging.stats,
          totalGoldOnLodging: (lodging.stats?.totalGoldOnLodging || 0) + (data.totalPaid - (lodging.rentedProperties?.[id]?.totalPaid || 0)),
          currentHomeProperty: data.isActive ? id : lodging.stats?.currentHomeProperty
        }
      };
    }

    return lodging;
  }

  /**
   * Get lodging bonuses for sleeping at a location
   * @param {Object} player - Player state
   * @param {string} locationId - Location ID
   * @param {number} currentDay - Current game day
   * @returns {Object} Bonus modifiers { restQuality, staminaRecovery, ... }
   */
  getLodgingBonuses(player, locationId, currentDay) {
    const sleepCheck = this.canSleepAt(player, locationId, currentDay);
    if (!sleepCheck.canSleep || !sleepCheck.rental) {
      return {};
    }

    return sleepCheck.rental.bonuses || {};
  }
}

export default LodgingSystem;
