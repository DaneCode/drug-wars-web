/**
 * Drug Wars Game Engine
 * Core game state management and utilities
 */

/**
 * Game Configuration - Items
 * Defines all tradeable items with their properties
 */
const ITEMS = {
    'Acid': {
        basePrice: [1000, 4000],
        volatility: 'high',
        rarity: 'medium'
    },
    'Cocaine': {
        basePrice: [15000, 30000],
        volatility: 'medium',
        rarity: 'rare'
    },
    'Hashish': {
        basePrice: [300, 600],
        volatility: 'medium',
        rarity: 'common'
    },
    'Heroin': {
        basePrice: [5000, 14000],
        volatility: 'medium',
        rarity: 'rare'
    },
    'Ludes': {
        basePrice: [10, 60],
        volatility: 'high',
        rarity: 'common'
    },
    'Weed': {
        basePrice: [300, 900],
        volatility: 'medium',
        rarity: 'common'
    }
};

/**
 * Game Configuration - Locations1
 * Defines all game locations with their properties
 */
const LOCATIONS = {
    'Bronx': {
        startingLocation: true,
        marketModifier: 1.0,
        specialEvents: ['gang_territory']
    },
    'Ghetto': {
        startingLocation: false,
        marketModifier: 0.8,
        specialEvents: ['cheap_deals']
    },
    'Central Park': {
        startingLocation: false,
        marketModifier: 1.2,
        specialEvents: ['police_patrol']
    },
    'Manhattan': {
        startingLocation: false,
        marketModifier: 1.5,
        specialEvents: ['high_roller']
    },
    'Coney Island': {
        startingLocation: false,
        marketModifier: 0.9,
        specialEvents: ['tourist_trade']
    },
    'Brooklyn': {
        startingLocation: false,
        marketModifier: 1.0,
        specialEvents: ['local_network']
    }
};

/**
 * Game Configuration - Vehicles
 * Defines all vehicle types with their properties
 */
const VEHICLES = {
    'On Foot': {
        cost: 0,
        eventReduction: 0,
        description: 'Walking - free but risky'
    },
    'Skateboard': {
        cost: 50,
        eventReduction: 0.15,
        description: 'Skateboard - cheap and slightly safer'
    },
    'Bicycle': {
        cost: 200,
        eventReduction: 0.30,
        description: 'Bicycle - faster and safer'
    },
    'Car': {
        cost: 5000,
        eventReduction: 0.50,
        description: 'Car - fastest and safest'
    }
};

class GameEngine {
    constructor() {
        this.gameState = this.getDefaultGameState();
        this.saveSystem = new SaveSystem();
        this.marketSystem = new MarketSystem();
        this.eventSystem = new EventSystem(this);
        this.storyManager = new StoryManager(this);
        this.uiManager = new UIManager(this);
        
        // Initialize the game
        this.init();
    }

    /**
     * Initialize the game engine
     */
    init() {
        // Try to load existing game state
        const savedState = this.saveSystem.loadGame();
        if (savedState) {
            console.log('Loading saved state with cash:', savedState.player.cash);
            this.gameState = savedState;
        } else {
            console.log('No saved state found, using default state with cash:', this.gameState.player.cash);
        }
        
        // Initialize UI
        this.uiManager.init();
        this.updateDisplay();
    }

    /**
     * Get default game state structure
     * Ensures all required fields are properly initialized
     */
    getDefaultGameState() {
        return {
            player: {
                cash: 0, // Will be set based on difficulty
                inventory: {}, // Empty starting inventory
                inventoryCapacity: 100, // Requirement 1.5 - always starts at 100
                currentLocation: 'Bronx', // Requirement 1.6 - always starts in Bronx
                vehicle: 'On Foot', // Starting vehicle - free transportation
                ownedVehicles: ['On Foot'], // List of owned vehicles - starts with On Foot
                day: 1, // Always start on day 1
                maxDays: 30, // Will be set based on difficulty
                difficulty: 'medium' // Will be set based on selection
            },
            market: {}, // Market data for each location
            story: {
                currentPhase: 0,
                eventsTriggered: [],
                playerPerformance: 'average'
            },
            gameStarted: false, // Tracks if game has been initialized
            gameEnded: false // Tracks if game has ended
        };
    }

    /**
     * Start a new game with selected difficulty
     * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
     */
    startNewGame(difficulty) {
        // Clear any existing saved state to ensure fresh start
        this.saveSystem.clearSave();
        
        // Reset to default game state
        this.gameState = this.getDefaultGameState();
        
        console.log('Starting new game - initial cash:', this.gameState.player.cash);
        
        // Set difficulty-based starting conditions (Requirements 1.2, 1.3, 1.4)
        console.log('Setting cash for difficulty:', difficulty);
        switch (difficulty) {
            case 'easy':
                this.gameState.player.cash = 5000;
                this.gameState.player.maxDays = 45;
                console.log('Set easy mode cash to:', this.gameState.player.cash);
                break;
            case 'medium':
                this.gameState.player.cash = 2000;
                this.gameState.player.maxDays = 30;
                console.log('Set medium mode cash to:', this.gameState.player.cash);
                break;
            case 'hard':
                this.gameState.player.cash = 1000;
                this.gameState.player.maxDays = 20;
                console.log('Set hard mode cash to:', this.gameState.player.cash);
                break;
            default:
                // Default to medium if invalid difficulty
                this.gameState.player.cash = 2000;
                this.gameState.player.maxDays = 30;
                difficulty = 'medium';
                console.log('Set default cash to:', this.gameState.player.cash);
        }
        
        // Set required starting conditions (Requirements 1.5, 1.6)
        this.gameState.player.difficulty = difficulty;
        this.gameState.player.inventoryCapacity = 100; // Requirement 1.5
        this.gameState.player.currentLocation = 'Bronx'; // Requirement 1.6
        this.gameState.player.vehicle = 'On Foot'; // Starting vehicle
        this.gameState.player.ownedVehicles = ['On Foot']; // Initialize owned vehicles
        this.gameState.player.day = 1;
        this.gameState.player.inventory = {}; // Empty starting inventory
        this.gameState.gameStarted = true;
        
        console.log('Set gameStarted to true, cash is now:', this.gameState.player.cash);
        
        // Reset and initialize story progression for new game
        this.storyManager.resetStoryProgression();
        
        // Generate initial market prices for starting location (Bronx)
        this.generateMarketForLocation(this.gameState.player.currentLocation);
        
        // Trigger opening story event
        const openingStory = this.storyManager.triggerStoryEvent('opening');
        
        console.log('Before saving - cash is:', this.gameState.player.cash);
        
        // Save the initial state
        this.saveGame();
        
        console.log('After saving - cash is:', this.gameState.player.cash);
        
        // Update display to show game state (Requirement 1.7)
        this.updateDisplay();
        
        // Show opening story if available
        if (openingStory) {
            setTimeout(() => {
                this.uiManager.showStoryEvent(openingStory);
            }, 500); // Small delay to ensure UI is ready
        }
        
        console.log(`New ${difficulty} game started:`, {
            cash: this.gameState.player.cash,
            days: this.gameState.player.maxDays,
            location: this.gameState.player.currentLocation,
            capacity: this.gameState.player.inventoryCapacity,
            vehicle: this.gameState.player.vehicle,
            ownedVehicles: this.gameState.player.ownedVehicles
        });
    }

    /**
     * Generate market prices for a specific location
     */
    generateMarketForLocation(location) {
        if (!this.gameState.market) {
            this.gameState.market = {};
        }
        this.gameState.market[location] = this.marketSystem.generateMarketPrices(location);
    }

    /**
     * Travel to a new location
     */
    travelToLocation(newLocation) {
        // Validate location exists and is different from current
        if (!LOCATIONS[newLocation]) {
            return { success: false, message: 'Invalid location' };
        }
        
        if (newLocation === this.gameState.player.currentLocation) {
            return { success: false, message: 'You are already at this location' };
        }
        
        // Check for random events during travel using the event system
        const randomEvent = this.eventSystem.triggerRandomEvent();
        let eventMessage = '';
        let eventOccurred = false;
        
        if (randomEvent) {
            eventOccurred = true;
            eventMessage = `${randomEvent.title}\n${randomEvent.description}`;
            
            // For now, auto-execute events during travel
            // In future UI improvements, this could show event choices
            const eventResult = this.eventSystem.executeCurrentEvent();
            if (eventResult.message) {
                eventMessage += `\n${eventResult.message}`;
            }
        }
        
        // Update player location
        this.gameState.player.currentLocation = newLocation;
        
        // Advance day (Requirement 2.4)
        this.gameState.player.day++;
        
        // Check for story milestone events after day advancement
        const storyEvent = this.storyManager.checkForStoryMilestone();
        if (storyEvent) {
            eventMessage += eventMessage ? `\n\n${storyEvent.title}\n${storyEvent.description}` : `${storyEvent.title}\n${storyEvent.description}`;
            eventOccurred = true;
        }
        
        // Refresh market prices for new location (Requirement 2.6)
        this.generateMarketForLocation(newLocation);
        
        // Save game state
        this.saveGame();
        
        // Update display
        this.updateDisplay();
        
        // Check if game should end
        this.checkGameEnd();
        
        // Prepare success message
        let successMessage = `Traveled to ${newLocation}`;
        if (eventMessage) {
            successMessage += `\n\nDuring travel: ${eventMessage}`;
        }
        
        return { 
            success: true, 
            message: successMessage,
            eventOccurred: eventOccurred,
            eventMessage: eventMessage
        };
    }

    /**
     * Get current market data for player's location
     */
    getCurrentMarket() {
        return this.marketSystem.getMarketData(
            this.gameState.player.currentLocation, 
            this.gameState.market
        );
    }

    /**
     * Get available items at current location
     */
    getAvailableItems() {
        return this.marketSystem.getAvailableItems(
            this.gameState.player.currentLocation,
            this.gameState.market
        );
    }

    /**
     * Calculate total inventory usage
     */
    getTotalInventoryUsage() {
        return Object.values(this.gameState.player.inventory)
            .reduce((total, quantity) => total + quantity, 0);
    }

    /**
     * Get available inventory space
     */
    getAvailableInventorySpace() {
        return this.gameState.player.inventoryCapacity - this.getTotalInventoryUsage();
    }

    /**
     * Expand inventory capacity through events or purchases
     * Requirements: 5.6, 5.7, 5.8
     */
    expandInventory(expansionAmount) {
        // Validate expansion amount (20-50 units as per requirement 5.7)
        if (expansionAmount < 20 || expansionAmount > 50) {
            return { success: false, message: 'Invalid expansion amount' };
        }

        const currentCapacity = this.gameState.player.inventoryCapacity;
        const newCapacity = currentCapacity + expansionAmount;

        // Enforce maximum capacity limit (300 units max as per requirement 5.8)
        if (newCapacity > 300) {
            const maxPossibleExpansion = 300 - currentCapacity;
            if (maxPossibleExpansion <= 0) {
                return { success: false, message: 'Inventory already at maximum capacity (300 units)' };
            }
            
            // Expand to maximum possible
            this.gameState.player.inventoryCapacity = 300;
            this.saveGame();
            this.updateDisplay();
            
            return { 
                success: true, 
                message: `Inventory expanded by ${maxPossibleExpansion} units to maximum capacity (300 units)`,
                actualExpansion: maxPossibleExpansion
            };
        }

        // Apply the expansion
        this.gameState.player.inventoryCapacity = newCapacity;
        this.saveGame();
        this.updateDisplay();

        return { 
            success: true, 
            message: `Inventory expanded by ${expansionAmount} units (${currentCapacity} → ${newCapacity})`,
            actualExpansion: expansionAmount
        };
    }

    /**
     * Get detailed inventory information
     * Requirements: 5.3, 5.4, 5.5
     */
    getDetailedInventory() {
        const market = this.getCurrentMarket();
        const totalUsage = this.getTotalInventoryUsage();
        const availableSpace = this.getAvailableInventorySpace();
        
        const inventoryItems = Object.entries(this.gameState.player.inventory).map(([itemName, quantity]) => {
            const currentPrice = market && market[itemName] ? market[itemName].price : 0;
            const totalValue = currentPrice * quantity;
            
            return {
                name: itemName,
                quantity: quantity,
                currentPrice: currentPrice,
                totalValue: totalValue
            };
        });

        // Calculate total inventory value
        const totalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0);

        return {
            items: inventoryItems,
            totalItems: totalUsage,
            capacity: this.gameState.player.inventoryCapacity,
            availableSpace: availableSpace,
            totalValue: totalValue,
            capacityPercentage: Math.round((totalUsage / this.gameState.player.inventoryCapacity) * 100)
        };
    }

    /**
     * Check if inventory has space for additional items
     */
    hasInventorySpace(requiredSpace = 1) {
        return this.getAvailableInventorySpace() >= requiredSpace;
    }

    /**
     * Get inventory capacity status
     */
    getInventoryStatus() {
        const totalUsage = this.getTotalInventoryUsage();
        const capacity = this.gameState.player.inventoryCapacity;
        const percentage = (totalUsage / capacity) * 100;
        
        let status = 'normal';
        if (percentage >= 90) {
            status = 'critical';
        } else if (percentage >= 75) {
            status = 'warning';
        }
        
        return {
            usage: totalUsage,
            capacity: capacity,
            available: capacity - totalUsage,
            percentage: Math.round(percentage),
            status: status
        };
    }

    /**
     * Purchase a vehicle
     * Requirements: 10.2, 10.4
     */
    purchaseVehicle(vehicleName) {
        // Validate vehicle exists
        if (!VEHICLES[vehicleName]) {
            return { success: false, message: 'Invalid vehicle type' };
        }

        const vehicleData = VEHICLES[vehicleName];
        
        // Initialize ownedVehicles if it doesn't exist (for backward compatibility)
        if (!this.gameState.player.ownedVehicles) {
            this.gameState.player.ownedVehicles = [this.gameState.player.vehicle || 'On Foot'];
        }
        
        // Check if player already owns this vehicle
        if (this.gameState.player.ownedVehicles.includes(vehicleName)) {
            return { success: false, message: `You already own a ${vehicleName}` };
        }

        // Check if player has enough cash
        if (this.gameState.player.cash < vehicleData.cost) {
            return { 
                success: false, 
                message: `Not enough cash. Need $${vehicleData.cost.toLocaleString()}, have $${this.gameState.player.cash.toLocaleString()}` 
            };
        }

        // Execute purchase
        this.gameState.player.cash -= vehicleData.cost;
        
        // Add to owned vehicles list
        this.gameState.player.ownedVehicles.push(vehicleName);
        
        // Set as current vehicle
        this.gameState.player.vehicle = vehicleName;

        // Save game state
        this.saveGame();
        this.updateDisplay();

        return { 
            success: true, 
            message: `Purchased ${vehicleName} for $${vehicleData.cost.toLocaleString()}. You can switch between your vehicles anytime.`,
            cost: vehicleData.cost
        };
    }

    /**
     * Select a vehicle from owned vehicles
     */
    selectVehicle(vehicleName) {
        // Initialize ownedVehicles if it doesn't exist (for backward compatibility)
        if (!this.gameState.player.ownedVehicles) {
            this.gameState.player.ownedVehicles = [this.gameState.player.vehicle || 'On Foot'];
        }
        
        // Validate vehicle exists
        if (!VEHICLES[vehicleName]) {
            return { success: false, message: 'Invalid vehicle type' };
        }
        
        // Check if player owns this vehicle
        if (!this.gameState.player.ownedVehicles.includes(vehicleName)) {
            return { success: false, message: `You don't own a ${vehicleName}` };
        }
        
        // Check if already current vehicle
        if (this.gameState.player.vehicle === vehicleName) {
            return { success: false, message: `You are already using the ${vehicleName}` };
        }
        
        // Switch to the selected vehicle
        this.gameState.player.vehicle = vehicleName;
        
        // Save game state
        this.saveGame();
        this.updateDisplay();
        
        return { 
            success: true, 
            message: `Switched to ${vehicleName}`
        };
    }

    /**
     * Get current vehicle information
     * Requirements: 10.4
     */
    getCurrentVehicleInfo() {
        const vehicleName = this.gameState.player.vehicle;
        const vehicleData = VEHICLES[vehicleName];
        
        if (!vehicleData) {
            return null;
        }

        return {
            name: vehicleName,
            cost: vehicleData.cost,
            eventReduction: vehicleData.eventReduction,
            description: vehicleData.description,
            eventReductionPercentage: Math.round(vehicleData.eventReduction * 100)
        };
    }

    /**
     * Get available vehicles for purchase
     */
    getAvailableVehicles() {
        const currentVehicle = this.gameState.player.vehicle;
        const playerCash = this.gameState.player.cash;
        
        // Initialize ownedVehicles if it doesn't exist (for backward compatibility)
        if (!this.gameState.player.ownedVehicles) {
            this.gameState.player.ownedVehicles = [currentVehicle || 'On Foot'];
        }
        
        const ownedVehicles = this.gameState.player.ownedVehicles;
        
        // Debug logging to track cash amount
        console.log('getAvailableVehicles - Player cash:', playerCash, 'Current vehicle:', currentVehicle, 'Owned vehicles:', ownedVehicles);
        
        const vehicles = Object.entries(VEHICLES).map(([name, data]) => ({
            name: name,
            cost: data.cost,
            eventReduction: data.eventReduction,
            description: data.description,
            eventReductionPercentage: Math.round(data.eventReduction * 100),
            owned: ownedVehicles.includes(name),
            current: name === currentVehicle,
            affordable: playerCash >= data.cost,
            canPurchase: !ownedVehicles.includes(name) && playerCash >= data.cost
        }));
        
        // Debug log each vehicle's affordability
        vehicles.forEach(v => {
            console.log(`Vehicle ${v.name}: cost=${v.cost}, owned=${v.owned}, current=${v.current}, affordable=${v.affordable}, canPurchase=${v.canPurchase}`);
        });
        
        return vehicles;
    }

    /**
     * Handle vehicle theft (for random events)
     * Requirements: 10.5
     */
    stealVehicle() {
        const currentVehicle = this.gameState.player.vehicle;
        
        // Can't steal "On Foot" since it's not a physical vehicle
        if (currentVehicle === 'On Foot') {
            return { success: false, message: 'No vehicle to steal' };
        }

        // Revert to "On Foot"
        this.gameState.player.vehicle = 'On Foot';
        
        // Save game state
        this.saveGame();
        this.updateDisplay();

        return { 
            success: true, 
            message: `Your ${currentVehicle} was stolen! You're back to traveling on foot.`,
            stolenVehicle: currentVehicle
        };
    }

    /**
     * Offer discounted vehicle purchase (for random events)
     */
    offerDiscountedVehicle(vehicleName, discountPercentage) {
        if (!VEHICLES[vehicleName]) {
            return { success: false, message: 'Invalid vehicle type' };
        }

        const vehicleData = VEHICLES[vehicleName];
        const discountedPrice = Math.floor(vehicleData.cost * (1 - discountPercentage / 100));
        
        return {
            vehicleName: vehicleName,
            originalPrice: vehicleData.cost,
            discountedPrice: discountedPrice,
            savings: vehicleData.cost - discountedPrice,
            discountPercentage: discountPercentage,
            description: vehicleData.description,
            affordable: this.gameState.player.cash >= discountedPrice
        };
    }

    /**
     * Purchase vehicle at discounted price
     */
    purchaseDiscountedVehicle(vehicleName, discountedPrice) {
        // Validate vehicle exists
        if (!VEHICLES[vehicleName]) {
            return { success: false, message: 'Invalid vehicle type' };
        }

        // Check if player already owns this vehicle
        if (this.gameState.player.vehicle === vehicleName) {
            return { success: false, message: `You already own a ${vehicleName}` };
        }

        // Check if player has enough cash
        if (this.gameState.player.cash < discountedPrice) {
            return { 
                success: false, 
                message: `Not enough cash. Need $${discountedPrice.toLocaleString()}, have $${this.gameState.player.cash.toLocaleString()}` 
            };
        }

        // Execute purchase
        this.gameState.player.cash -= discountedPrice;
        this.gameState.player.vehicle = vehicleName;

        // Save game state
        this.saveGame();
        this.updateDisplay();

        return { 
            success: true, 
            message: `Purchased ${vehicleName} for $${discountedPrice.toLocaleString()}`,
            cost: discountedPrice
        };
    }

    /**
     * Trigger random event on player actions
     * Requirements: 4.1 - 15% event probability on player actions
     */
    checkForRandomEvent() {
        const event = this.eventSystem.triggerRandomEvent();
        if (event) {
            // Return event for UI to handle
            return event;
        }
        return null;
    }

    /**
     * Buy an item from the market
     */
    buyItem(itemName, quantity) {
        // Validate inputs
        if (!itemName || quantity <= 0) {
            return { success: false, message: 'Invalid item or quantity' };
        }

        // Check if item exists
        if (!ITEMS[itemName]) {
            return { success: false, message: 'Item does not exist' };
        }

        // Get current market data
        const market = this.getCurrentMarket();
        if (!market || !market[itemName]) {
            return { success: false, message: 'Item not available at this location' };
        }

        const itemData = market[itemName];

        // Check if item is available
        if (!itemData.available) {
            return { success: false, message: `${itemName} is not available here` };
        }

        // Check if enough quantity is available
        if (quantity > itemData.quantity) {
            return { success: false, message: `Only ${itemData.quantity} ${itemName} available` };
        }

        // Check if player has enough cash
        const totalCost = itemData.price * quantity;
        if (totalCost > this.gameState.player.cash) {
            return { success: false, message: `Not enough cash. Need $${totalCost.toLocaleString()}, have $${this.gameState.player.cash.toLocaleString()}` };
        }

        // Check inventory space (Requirement 5.1, 5.2)
        const availableSpace = this.getAvailableInventorySpace();
        if (quantity > availableSpace) {
            const inventoryStatus = this.getInventoryStatus();
            let message = `Not enough inventory space. Need ${quantity} units, have ${availableSpace} available.`;
            
            if (inventoryStatus.capacity < 300) {
                message += ' Look for opportunities to expand your inventory capacity!';
            }
            
            return { success: false, message: message };
        }

        // Execute transaction
        this.gameState.player.cash -= totalCost;
        
        // Add to inventory
        if (!this.gameState.player.inventory[itemName]) {
            this.gameState.player.inventory[itemName] = 0;
        }
        this.gameState.player.inventory[itemName] += quantity;

        // Update market quantity
        this.gameState.market[this.gameState.player.currentLocation][itemName].quantity -= quantity;
        
        // If quantity reaches 0, mark as unavailable
        if (this.gameState.market[this.gameState.player.currentLocation][itemName].quantity <= 0) {
            this.gameState.market[this.gameState.player.currentLocation][itemName].available = false;
        }

        // Save game state
        this.saveGame();
        this.updateDisplay();

        // Check for random event after transaction
        const randomEvent = this.checkForRandomEvent();

        return { 
            success: true, 
            message: `Bought ${quantity} ${itemName} for $${totalCost.toLocaleString()}`,
            totalCost: totalCost,
            event: randomEvent
        };
    }

    /**
     * Sell an item to the market
     */
    sellItem(itemName, quantity) {
        // Validate inputs
        if (!itemName || quantity <= 0) {
            return { success: false, message: 'Invalid item or quantity' };
        }

        // Check if player owns the item
        if (!this.gameState.player.inventory[itemName] || this.gameState.player.inventory[itemName] <= 0) {
            return { success: false, message: `You don't have any ${itemName}` };
        }

        // Check if player has enough quantity
        if (quantity > this.gameState.player.inventory[itemName]) {
            return { success: false, message: `You only have ${this.gameState.player.inventory[itemName]} ${itemName}` };
        }

        // Get current market data
        const market = this.getCurrentMarket();
        if (!market || !market[itemName]) {
            return { success: false, message: 'Cannot sell this item at this location' };
        }

        const itemData = market[itemName];
        const totalEarnings = itemData.price * quantity;

        // Execute transaction
        this.gameState.player.cash += totalEarnings;
        this.gameState.player.inventory[itemName] -= quantity;

        // Remove item from inventory if quantity reaches 0 (Requirement 5.4)
        if (this.gameState.player.inventory[itemName] <= 0) {
            delete this.gameState.player.inventory[itemName];
        }

        // Update market quantity (selling increases available quantity)
        this.gameState.market[this.gameState.player.currentLocation][itemName].quantity += quantity;
        this.gameState.market[this.gameState.player.currentLocation][itemName].available = true;

        // Save game state
        this.saveGame();
        this.updateDisplay();

        // Check for random event after transaction
        const randomEvent = this.checkForRandomEvent();

        return { 
            success: true, 
            message: `Sold ${quantity} ${itemName} for $${totalEarnings.toLocaleString()}`,
            totalEarnings: totalEarnings,
            event: randomEvent
        };
    }

    /**
     * Get player's inventory with current market values
     */
    getInventoryWithValues() {
        const market = this.getCurrentMarket();
        const inventoryWithValues = [];

        for (const [itemName, quantity] of Object.entries(this.gameState.player.inventory)) {
            const marketPrice = market && market[itemName] ? market[itemName].price : 0;
            const totalValue = marketPrice * quantity;

            inventoryWithValues.push({
                name: itemName,
                quantity: quantity,
                currentPrice: marketPrice,
                totalValue: totalValue
            });
        }

        return inventoryWithValues;
    }

    /**
     * Update all UI displays with current game state
     */
    updateDisplay() {
        // Check if game should end before updating display
        if (!this.gameState.gameEnded) {
            this.checkGameEnd();
        }
        
        console.log('updateDisplay called - current cash:', this.gameState.player.cash);
        this.uiManager.updateHeader(this.gameState.player);
        this.uiManager.updateInventory(this.gameState.player);
        this.uiManager.updateMainPanel(this.gameState);
        this.uiManager.updateGameStateDisplay(this.gameState);
    }

    /**
     * Save current game state
     */
    saveGame() {
        this.saveSystem.saveGame(this.gameState);
    }

    /**
     * Get current game state (read-only)
     */
    getGameState() {
        return { ...this.gameState };
    }

    /**
     * Check for overdue loans and apply penalties
     */
    checkLoans() {
        if (!this.gameState.loans || this.gameState.loans.length === 0) {
            return null;
        }
        
        const currentDay = this.gameState.player.day;
        let overdueLoans = [];
        
        for (let i = this.gameState.loans.length - 1; i >= 0; i--) {
            const loan = this.gameState.loans[i];
            
            if (currentDay > loan.dueDay) {
                // Loan is overdue - apply penalty
                const penalty = Math.floor(loan.repaymentAmount * 0.5); // 50% penalty
                this.gameState.player.cash -= penalty;
                
                // Ensure cash doesn't go negative
                if (this.gameState.player.cash < 0) {
                    this.gameState.player.cash = 0;
                }
                
                overdueLoans.push({
                    ...loan,
                    penalty: penalty
                });
                
                // Remove the loan
                this.gameState.loans.splice(i, 1);
            }
        }
        
        if (overdueLoans.length > 0) {
            this.saveGame();
            this.updateDisplay();
            
            const totalPenalty = overdueLoans.reduce((sum, loan) => sum + loan.penalty, 0);
            return {
                success: false,
                message: `Loan shark penalty! You failed to repay ${overdueLoans.length} loan(s). Penalty: $${totalPenalty.toLocaleString()}`
            };
        }
        
        return null;
    }

    /**
     * Check if game should end
     * Requirements: 7.1 - Automatic game ending based on selected difficulty duration
     */
    checkGameEnd() {
        // Check for overdue loans first
        const loanPenalty = this.checkLoans();
        if (loanPenalty) {
            // Could show loan penalty message here
            console.log(loanPenalty.message);
        }
        
        // Game ends when the selected duration has elapsed (day > maxDays)
        // This means if maxDays is 30, the game ends after day 30 is completed
        if (this.gameState.player.day > this.gameState.player.maxDays) {
            this.endGame();
            return true;
        }
        return false;
    }

    /**
     * End the current game
     */
    endGame() {
        this.gameState.gameEnded = true;
        this.calculateFinalScore();
        
        // Generate story conclusion based on performance
        this.gameState.storyConclusion = this.storyManager.generateStoryConclusion();
        
        this.uiManager.showGameEnd(this.gameState);
    }

    /**
     * Restart game with same difficulty
     * Requirements: 7.4 - Provide option to start a new game
     */
    restartGame() {
        const currentDifficulty = this.gameState.player.difficulty;
        this.startNewGame(currentDifficulty);
    }

    /**
     * Calculate final score based on cash and difficulty multiplier
     * Requirements: 7.2 - Calculate and display final score based on cash and difficulty multiplier
     */
    calculateFinalScore() {
        const { cash, difficulty } = this.gameState.player;
        let multiplier = 1;
        
        // Set difficulty multipliers (Requirement 7.2)
        switch (difficulty) {
            case 'easy':
                multiplier = 1;
                break;
            case 'medium':
                multiplier = 1.5;
                break;
            case 'hard':
                multiplier = 2;
                break;
        }
        
        // Calculate final score
        this.gameState.finalScore = Math.floor(cash * multiplier);
        
        // Calculate profit percentage (Requirement 7.3)
        const startingCash = this.getStartingCashForDifficulty(difficulty);
        const profit = cash - startingCash;
        this.gameState.profitPercentage = Math.round((profit / startingCash) * 100);
        this.gameState.startingCash = startingCash;
        
        // Calculate additional performance metrics
        this.gameState.totalProfit = profit;
        this.gameState.daysPlayed = this.gameState.player.day - 1; // Subtract 1 since we start on day 1
        this.gameState.profitPerDay = this.gameState.daysPlayed > 0 ? Math.floor(profit / this.gameState.daysPlayed) : 0;
    }

    /**
     * Get starting cash amount for difficulty level
     */
    getStartingCashForDifficulty(difficulty) {
        switch (difficulty) {
            case 'easy': return 5000;
            case 'medium': return 2000;
            case 'hard': return 1000;
            default: return 2000;
        }
    }
}

/**
 * Event System for random event generation and management
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12
 */
class EventSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.baseEventProbability = 0.15; // 15% base probability (Requirement 4.1)
        this.currentEvent = null;
        this.eventQueue = [];
        
        // Initialize event definitions
        this.initializeEvents();
    }

    /**
     * Initialize all event definitions
     */
    initializeEvents() {
        this.events = {
            // Economic Events (Requirements 4.4, 4.5, 4.6, 4.7)
            market_surge: {
                type: 'economic',
                weight: 15,
                title: 'Market Surge!',
                description: 'Word on the street is that {item} prices are going through the roof!',
                execute: (gameEngine, params) => this.executeMarketSurge(gameEngine, params)
            },
            theft: {
                type: 'economic',
                weight: 20,
                title: 'Robbery!',
                description: 'You got mugged! They took some of your cash.',
                execute: (gameEngine, params) => this.executeTheft(gameEngine, params)
            },
            cheap_deal: {
                type: 'economic',
                weight: 25,
                title: 'Great Deal!',
                description: 'Someone is selling {item} way below market price!',
                execute: (gameEngine, params) => this.executeCheapDeal(gameEngine, params)
            },
            loan_shark: {
                type: 'economic',
                weight: 10,
                title: 'Loan Shark',
                description: 'A loan shark approaches you with an offer...',
                execute: (gameEngine, params) => this.executeLoanShark(gameEngine, params)
            },

            // Safety Events (Requirements 4.3, 4.8, 4.9)
            police_encounter: {
                type: 'safety',
                weight: 20,
                title: 'Police Encounter!',
                description: 'The cops are onto you!',
                execute: (gameEngine, params) => this.executePoliceEncounter(gameEngine, params)
            },
            gang_fight: {
                type: 'safety',
                weight: 15,
                title: 'Gang Fight!',
                description: 'You got caught in the middle of a gang war!',
                execute: (gameEngine, params) => this.executeGangFight(gameEngine, params)
            },

            // Opportunity Events (Requirements 4.9, 4.11, 4.12)
            tip: {
                type: 'opportunity',
                weight: 20,
                title: 'Hot Tip!',
                description: 'Someone gives you information about profitable opportunities...',
                execute: (gameEngine, params) => this.executeTip(gameEngine, params)
            },
            vehicle_theft: {
                type: 'opportunity',
                weight: 8,
                title: 'Vehicle Theft!',
                description: 'Your vehicle was stolen while you weren\'t looking!',
                execute: (gameEngine, params) => this.executeVehicleTheft(gameEngine, params)
            },
            vehicle_deal: {
                type: 'opportunity',
                weight: 12,
                title: 'Vehicle Deal!',
                description: 'Someone is offering to sell you a vehicle at a discount!',
                execute: (gameEngine, params) => this.executeVehicleDeal(gameEngine, params)
            },
            inventory_expansion: {
                type: 'opportunity',
                weight: 10,
                title: 'Storage Opportunity!',
                description: 'You found a way to expand your carrying capacity!',
                execute: (gameEngine, params) => this.executeInventoryExpansion(gameEngine, params)
            }
        };
    }

    /**
     * Check if an event should occur based on probability and vehicle effects
     * Requirements: 4.1, 4.2
     */
    shouldEventOccur() {
        const vehicleInfo = this.gameEngine.getCurrentVehicleInfo();
        const vehicleRiskReduction = vehicleInfo ? vehicleInfo.eventReduction : 0;
        
        // Apply vehicle-based risk modification (Requirement 4.2)
        const adjustedProbability = this.baseEventProbability * (1 - vehicleRiskReduction);
        
        return Math.random() < adjustedProbability;
    }

    /**
     * Generate and trigger a random event with story integration
     * Requirements: 4.1, 4.2, 4.10, 9.7
     */
    triggerRandomEvent() {
        if (!this.shouldEventOccur()) {
            return null;
        }

        // Select event based on weights and story context
        const selectedEvent = this.selectWeightedEvent();
        if (!selectedEvent) {
            return null;
        }

        // Generate event parameters with story integration
        const eventParams = this.generateEventParameters(selectedEvent);
        
        // Get story-enhanced description
        const storyEnhancedDescription = this.getStoryEnhancedDescription(selectedEvent, eventParams);
        
        // Create event instance
        const eventInstance = {
            id: Date.now() + Math.random(),
            type: selectedEvent.type,
            title: selectedEvent.title,
            description: storyEnhancedDescription,
            event: selectedEvent,
            params: eventParams,
            timestamp: Date.now(),
            storyContext: this.getEventStoryContext(selectedEvent)
        };

        this.currentEvent = eventInstance;
        return eventInstance;
    }

    /**
     * Select an event based on weighted probability
     */
    selectWeightedEvent() {
        const events = Object.values(this.events);
        const totalWeight = events.reduce((sum, event) => sum + event.weight, 0);
        
        let random = Math.random() * totalWeight;
        
        for (const event of events) {
            random -= event.weight;
            if (random <= 0) {
                return event;
            }
        }
        
        return events[0]; // Fallback
    }

    /**
     * Generate parameters for specific event types
     */
    generateEventParameters(event) {
        const params = {};
        
        switch (event.type) {
            case 'economic':
                if (event === this.events.market_surge || event === this.events.cheap_deal) {
                    // Select random item for market events
                    const items = Object.keys(ITEMS);
                    params.item = items[Math.floor(Math.random() * items.length)];
                    
                    if (event === this.events.market_surge) {
                        // 200-500% price increase (Requirement 4.4)
                        params.priceMultiplier = 2 + Math.random() * 3; // 2.0 to 5.0
                    } else if (event === this.events.cheap_deal) {
                        // 50% below market price (Requirement 4.6)
                        params.discountPercentage = 50;
                        params.quantity = Math.floor(Math.random() * 20) + 5; // 5-25 units
                    }
                }
                
                if (event === this.events.theft) {
                    // 10-50% cash loss (Requirement 4.5)
                    params.lossPercentage = 10 + Math.random() * 40;
                }
                
                if (event === this.events.loan_shark) {
                    // High interest loan (Requirement 4.7)
                    params.loanAmount = Math.floor(this.gameEngine.gameState.player.cash * (0.5 + Math.random() * 1.5));
                    params.interestRate = 25 + Math.random() * 50; // 25-75% interest
                    params.daysToRepay = 3 + Math.floor(Math.random() * 5); // 3-7 days
                }
                break;
                
            case 'safety':
                if (event === this.events.police_encounter) {
                    // Check if player has items in inventory
                    const hasItems = Object.keys(this.gameEngine.gameState.player.inventory).length > 0;
                    
                    if (hasItems) {
                        // Player has items - can be confiscated, fined, or roughed up
                        params.encounterType = Math.random() < 0.4 ? 'confiscation' : 
                                             Math.random() < 0.7 ? 'fine' : 'health_damage';
                    } else {
                        // Player has no items - only health damage (police harassment)
                        params.encounterType = 'health_damage';
                    }
                    
                    params.fineAmount = Math.floor(this.gameEngine.gameState.player.cash * (0.1 + Math.random() * 0.3));
                    params.healthDamage = Math.floor(Math.random() * 30) + 10; // 10-40 health damage
                }
                
                if (event === this.events.gang_fight) {
                    params.damageType = Math.random() < 0.5 ? 'inventory' : 'medical';
                    params.inventoryLoss = Math.floor(Math.random() * 30) + 10; // 10-40% inventory loss
                    params.medicalCost = Math.floor(Math.random() * 1000) + 500; // $500-1500 medical costs
                }
                break;
                
            case 'opportunity':
                if (event === this.events.tip) {
                    const locations = Object.keys(LOCATIONS).filter(loc => 
                        loc !== this.gameEngine.gameState.player.currentLocation
                    );
                    params.location = locations[Math.floor(Math.random() * locations.length)];
                    
                    const items = Object.keys(ITEMS);
                    params.item = items[Math.floor(Math.random() * items.length)];
                    params.tipType = Math.random() < 0.5 ? 'high_price' : 'low_price';
                }
                
                if (event === this.events.vehicle_deal) {
                    const vehicles = Object.keys(VEHICLES).filter(v => 
                        v !== this.gameEngine.gameState.player.vehicle && v !== 'On Foot'
                    );
                    if (vehicles.length > 0) {
                        params.vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
                        params.discountPercentage = 30 + Math.random() * 20; // 30-50% discount
                    }
                }
                
                if (event === this.events.inventory_expansion) {
                    params.expansionAmount = 20 + Math.floor(Math.random() * 31); // 20-50 units
                }
                break;
        }
        
        return params;
    }

    /**
     * Format event description with parameters
     */
    formatEventDescription(description, params) {
        let formatted = description;
        
        // Replace placeholders
        if (params.item) {
            formatted = formatted.replace('{item}', params.item);
        }
        if (params.location) {
            formatted = formatted.replace('{location}', params.location);
        }
        if (params.vehicle) {
            formatted = formatted.replace('{vehicle}', params.vehicle);
        }
        
        return formatted;
    }

    /**
     * Get story-enhanced event description
     * Requirements: 4.10, 9.7
     */
    getStoryEnhancedDescription(event, params) {
        const baseDescription = this.formatEventDescription(event.description, params);
        const storyManager = this.gameEngine.storyManager;
        const currentPhase = this.gameEngine.gameState.story.currentPhase;
        const performance = this.gameEngine.gameState.story.playerPerformance;
        
        // Add story context based on event type and current story phase
        let storyContext = '';
        
        switch (event.type) {
            case 'economic':
                if (event === this.events.loan_shark) {
                    storyContext = storyManager.getGameplayMechanicIntroduction('loan_shark');
                } else if (event === this.events.theft) {
                    storyContext = this.getTheftStoryContext(performance, currentPhase);
                } else if (event === this.events.market_surge) {
                    storyContext = this.getMarketSurgeStoryContext(performance, params.item);
                }
                break;
                
            case 'safety':
                if (event === this.events.police_encounter) {
                    storyContext = storyManager.getGameplayMechanicIntroduction('police_encounter');
                } else if (event === this.events.gang_fight) {
                    storyContext = this.getGangFightStoryContext(performance, currentPhase);
                }
                break;
                
            case 'opportunity':
                if (event === this.events.vehicle_deal) {
                    storyContext = storyManager.getGameplayMechanicIntroduction('vehicle_upgrade');
                } else if (event === this.events.inventory_expansion) {
                    storyContext = storyManager.getGameplayMechanicIntroduction('inventory_expansion');
                } else if (event === this.events.tip) {
                    storyContext = this.getTipStoryContext(performance, currentPhase);
                }
                break;
        }
        
        // Combine base description with story context
        return storyContext ? `${storyContext}\n\n${baseDescription}` : baseDescription;
    }

    /**
     * Get story context for theft events
     */
    getTheftStoryContext(performance, currentPhase) {
        const contexts = {
            'excellent': [
                "Your success has made you a target for desperate criminals.",
                "High-profile dealers like yourself attract unwanted attention.",
                "Your reputation for carrying large amounts of cash precedes you."
            ],
            'good': [
                "Word of your growing wealth has spread through the streets.",
                "Success brings visibility, and visibility brings risks.",
                "Your improving fortunes haven't gone unnoticed by predators."
            ],
            'average': [
                "The streets are dangerous for anyone carrying cash.",
                "Random crime is an occupational hazard in this business.",
                "Even modest success can attract the wrong kind of attention."
            ],
            'poor': [
                "Desperation breeds desperation - even struggling dealers are targets.",
                "The streets show no mercy, even to those barely getting by.",
                "In this neighborhood, anyone with anything is a potential victim."
            ]
        };
        
        const contextArray = contexts[performance] || contexts['average'];
        return contextArray[Math.min(currentPhase, contextArray.length - 1)];
    }

    /**
     * Get story context for market surge events
     */
    getMarketSurgeStoryContext(performance, item) {
        const contexts = {
            'excellent': `Your network of contacts alerts you to the ${item} shortage before most dealers catch on.`,
            'good': `Your growing reputation gives you early access to information about the ${item} market surge.`,
            'average': `Street rumors about ${item} shortages are starting to circulate.`,
            'poor': `Even struggling dealers hear about the ${item} price spike eventually.`
        };
        
        return contexts[performance] || contexts['average'];
    }

    /**
     * Get story context for gang fight events
     */
    getGangFightStoryContext(performance, currentPhase) {
        const contexts = {
            'excellent': [
                "Your success has put you in the middle of territorial disputes between major players.",
                "High-level operations inevitably involve conflicts with established gangs.",
                "Your growing influence threatens existing power structures."
            ],
            'good': [
                "Your expanding territory brings you into conflict with local gangs.",
                "Success in this business means stepping on toes and making enemies.",
                "Your growing reputation attracts challenges from rival operations."
            ],
            'average': [
                "Gang violence is a constant threat in the drug trade.",
                "Territorial disputes can involve anyone operating in contested areas.",
                "The streets are controlled by gangs, and conflicts are inevitable."
            ],
            'poor': [
                "Even small-time dealers get caught in gang crossfire.",
                "Desperation forces you into dangerous territories controlled by gangs.",
                "When you're struggling, you can't afford to avoid gang-controlled areas."
            ]
        };
        
        const contextArray = contexts[performance] || contexts['average'];
        return contextArray[Math.min(currentPhase, contextArray.length - 1)];
    }

    /**
     * Get story context for tip events
     */
    getTipStoryContext(performance, currentPhase) {
        const contexts = {
            'excellent': [
                "Your network of high-level contacts shares valuable market intelligence.",
                "Successful dealers like yourself have access to premium information sources.",
                "Your reputation opens doors to exclusive insider information."
            ],
            'good': [
                "Your growing connections in the business provide useful tips.",
                "Building relationships pays off with valuable market information.",
                "Your improving reputation earns you access to better intelligence."
            ],
            'average': [
                "Street-level information networks occasionally provide useful tips.",
                "Casual contacts in the business sometimes share market insights.",
                "Word-of-mouth intelligence is a valuable resource in this trade."
            ],
            'poor': [
                "Even struggling dealers occasionally overhear useful information.",
                "Desperation makes you more attentive to any potential opportunities.",
                "When you're barely surviving, every tip could be a lifeline."
            ]
        };
        
        const contextArray = contexts[performance] || contexts['average'];
        return contextArray[Math.min(currentPhase, contextArray.length - 1)];
    }

    /**
     * Get event story context for narrative consistency
     * Requirements: 9.7
     */
    getEventStoryContext(event) {
        const currentPhase = this.gameEngine.gameState.story.currentPhase;
        const performance = this.gameEngine.gameState.story.playerPerformance;
        
        return {
            phase: currentPhase,
            performance: performance,
            eventType: event.type,
            narrativeWeight: this.calculateNarrativeWeight(event, currentPhase, performance)
        };
    }

    /**
     * Calculate narrative weight for story consistency
     */
    calculateNarrativeWeight(event, currentPhase, performance) {
        let weight = 1.0;
        
        // Adjust weight based on story phase
        if (currentPhase >= 4) { // Late game (day 20+)
            if (event.type === 'safety') weight *= 1.3; // More danger late game
            if (event.type === 'opportunity') weight *= 1.2; // More opportunities for established players
        } else if (currentPhase <= 1) { // Early game (day 1-5)
            if (event.type === 'economic') weight *= 1.2; // More basic economic events early
            if (event.type === 'safety') weight *= 0.8; // Less danger early game
        }
        
        // Adjust weight based on performance
        if (performance === 'excellent') {
            if (event === this.events.police_encounter) weight *= 1.4; // Success attracts police attention
            if (event === this.events.vehicle_deal) weight *= 1.3; // Success brings better opportunities
        } else if (performance === 'poor') {
            if (event === this.events.theft) weight *= 1.2; // Desperation attracts predators
            if (event === this.events.loan_shark) weight *= 1.4; // Desperate people need loans
        }
        
        return weight;
    }

    /**
     * Select an event based on weighted probability with story integration
     * Enhanced version that considers story context
     */
    selectWeightedEvent() {
        const events = Object.values(this.events);
        const storyContext = this.gameEngine.storyManager.getStoryStatus();
        
        // Calculate adjusted weights based on story context
        const adjustedEvents = events.map(event => ({
            event: event,
            weight: event.weight * this.calculateNarrativeWeight(event, storyContext.currentPhase, storyContext.playerPerformance)
        }));
        
        const totalWeight = adjustedEvents.reduce((sum, item) => sum + item.weight, 0);
        
        let random = Math.random() * totalWeight;
        
        for (const item of adjustedEvents) {
            random -= item.weight;
            if (random <= 0) {
                return item.event;
            }
        }
        
        return adjustedEvents[0].event; // Fallback
    }

    /**
     * Execute the current event and return results with story integration
     * Requirements: 4.10, 9.7
     */
    executeCurrentEvent(playerChoice = null) {
        if (!this.currentEvent) {
            return { success: false, message: 'No active event' };
        }

        const result = this.currentEvent.event.execute(this.gameEngine, {
            ...this.currentEvent.params,
            playerChoice: playerChoice
        });

        // Maintain narrative consistency by updating story context
        if (result.success && this.currentEvent.storyContext) {
            this.updateStoryContextAfterEvent(this.currentEvent, result, playerChoice);
        }

        // Clear current event after execution
        this.currentEvent = null;

        return result;
    }

    /**
     * Update story context after event execution to maintain narrative consistency
     * Requirements: 9.7
     */
    updateStoryContextAfterEvent(eventInstance, result, playerChoice) {
        const storyManager = this.gameEngine.storyManager;
        const eventType = eventInstance.event.type;
        
        // Track player choices for story adaptation
        if (!this.gameEngine.gameState.story.playerChoices) {
            this.gameEngine.gameState.story.playerChoices = {};
        }
        
        const choiceKey = `${eventInstance.event.title.toLowerCase().replace(/\s+/g, '_')}_${this.gameEngine.gameState.player.day}`;
        this.gameEngine.gameState.story.playerChoices[choiceKey] = {
            choice: playerChoice,
            result: result.success,
            eventType: eventType,
            day: this.gameEngine.gameState.player.day
        };
        
        // Update performance assessment based on event outcome
        if (eventType === 'economic' && result.success) {
            if (playerChoice === 'accept' && eventInstance.event === this.events.loan_shark) {
                // Taking loans might indicate financial pressure
                this.adjustPerformanceForRiskTaking('high_risk_financial');
            } else if (playerChoice === 'buy' && eventInstance.event === this.events.cheap_deal) {
                // Taking advantage of deals indicates good business sense
                this.adjustPerformanceForRiskTaking('smart_opportunity');
            }
        }
        
        // Update narrative consistency tracking
        this.updateNarrativeConsistency(eventInstance, playerChoice);
    }

    /**
     * Adjust performance assessment based on risk-taking behavior
     */
    adjustPerformanceForRiskTaking(riskType) {
        const currentPerformance = this.gameEngine.gameState.story.playerPerformance;
        
        // Track risk-taking patterns for story adaptation
        if (!this.gameEngine.gameState.story.riskProfile) {
            this.gameEngine.gameState.story.riskProfile = {
                high_risk_financial: 0,
                smart_opportunity: 0,
                conservative_choices: 0
            };
        }
        
        this.gameEngine.gameState.story.riskProfile[riskType]++;
        
        // Recalculate performance with risk factors
        this.gameEngine.storyManager.updatePlayerPerformance();
    }

    /**
     * Update narrative consistency tracking
     * Requirements: 9.7
     */
    updateNarrativeConsistency(eventInstance, playerChoice) {
        if (!this.gameEngine.gameState.story.narrativeConsistency) {
            this.gameEngine.gameState.story.narrativeConsistency = {
                characterTraits: {},
                decisionPatterns: {},
                storyThemes: []
            };
        }
        
        const consistency = this.gameEngine.gameState.story.narrativeConsistency;
        
        // Track character traits based on choices
        if (playerChoice === 'decline' && eventInstance.event === this.events.loan_shark) {
            consistency.characterTraits.cautious = (consistency.characterTraits.cautious || 0) + 1;
        } else if (playerChoice === 'accept' && eventInstance.event === this.events.loan_shark) {
            consistency.characterTraits.risk_taking = (consistency.characterTraits.risk_taking || 0) + 1;
        }
        
        if (playerChoice === 'buy' && eventInstance.event === this.events.cheap_deal) {
            consistency.characterTraits.opportunistic = (consistency.characterTraits.opportunistic || 0) + 1;
        }
        
        // Track decision patterns
        const patternKey = `${eventInstance.event.type}_${playerChoice}`;
        consistency.decisionPatterns[patternKey] = (consistency.decisionPatterns[patternKey] || 0) + 1;
        
        // Update story themes based on accumulated choices
        this.updateStoryThemes(consistency);
    }

    /**
     * Update story themes based on player behavior patterns
     */
    updateStoryThemes(consistency) {
        const themes = [];
        
        // Analyze character traits to determine themes
        const traits = consistency.characterTraits;
        
        if ((traits.cautious || 0) > (traits.risk_taking || 0)) {
            themes.push('survival_over_success');
        } else if ((traits.risk_taking || 0) > (traits.cautious || 0) * 2) {
            themes.push('high_stakes_gambler');
        }
        
        if ((traits.opportunistic || 0) >= 3) {
            themes.push('street_smart_entrepreneur');
        }
        
        // Update themes in story state
        consistency.storyThemes = themes;
    }

    /**
     * Get current active event
     */
    getCurrentEvent() {
        return this.currentEvent;
    }

    /**
     * Clear current event without executing
     */
    clearCurrentEvent() {
        this.currentEvent = null;
    }

    /**
     * Execute market surge event - 200-500% price increases
     * Requirement 4.4
     */
    executeMarketSurge(gameEngine, params) {
        const { item, priceMultiplier } = params;
        const currentLocation = gameEngine.gameState.player.currentLocation;
        
        // Apply price surge to the specific item at current location
        if (gameEngine.gameState.market[currentLocation] && 
            gameEngine.gameState.market[currentLocation][item]) {
            
            const originalPrice = gameEngine.gameState.market[currentLocation][item].price;
            const newPrice = Math.floor(originalPrice * priceMultiplier);
            
            gameEngine.gameState.market[currentLocation][item].price = newPrice;
            gameEngine.saveGame();
            gameEngine.updateDisplay();
            
            const increasePercentage = Math.round((priceMultiplier - 1) * 100);
            
            return {
                success: true,
                message: `${item} prices surged ${increasePercentage}%! New price: $${newPrice.toLocaleString()} (was $${originalPrice.toLocaleString()})`
            };
        }
        
        return {
            success: false,
            message: `${item} is not available at this location for the price surge.`
        };
    }

    /**
     * Execute theft event - 10-50% cash loss
     * Requirement 4.5
     */
    executeTheft(gameEngine, params) {
        const { lossPercentage } = params;
        const currentCash = gameEngine.gameState.player.cash;
        const lossAmount = Math.floor(currentCash * (lossPercentage / 100));
        
        // Ensure player doesn't go below $0
        const actualLoss = Math.min(lossAmount, currentCash);
        
        gameEngine.gameState.player.cash -= actualLoss;
        gameEngine.saveGame();
        gameEngine.updateDisplay();
        
        return {
            success: true,
            message: `You lost $${actualLoss.toLocaleString()} (${Math.round((actualLoss / currentCash) * 100)}% of your cash)!`
        };
    }

    /**
     * Execute cheap deal event - 50% below market price
     * Requirement 4.6
     */
    executeCheapDeal(gameEngine, params) {
        const { item, quantity, discountPercentage, playerChoice } = params;
        
        if (playerChoice === 'decline') {
            return {
                success: true,
                message: 'You decided to pass on the deal.'
            };
        }
        
        if (playerChoice === 'buy') {
            const market = gameEngine.getCurrentMarket();
            if (!market || !market[item]) {
                return {
                    success: false,
                    message: `${item} is not available at this location.`
                };
            }
            
            const marketPrice = market[item].price;
            const discountedPrice = Math.floor(marketPrice * (discountPercentage / 100));
            const totalCost = discountedPrice * quantity;
            
            // Validate transaction
            if (totalCost > gameEngine.gameState.player.cash) {
                return {
                    success: false,
                    message: `Not enough cash. Need $${totalCost.toLocaleString()}, have $${gameEngine.gameState.player.cash.toLocaleString()}.`
                };
            }
            
            if (!gameEngine.hasInventorySpace(quantity)) {
                return {
                    success: false,
                    message: `Not enough inventory space. Need ${quantity} units, have ${gameEngine.getAvailableInventorySpace()} available.`
                };
            }
            
            // Execute purchase
            gameEngine.gameState.player.cash -= totalCost;
            
            if (!gameEngine.gameState.player.inventory[item]) {
                gameEngine.gameState.player.inventory[item] = 0;
            }
            gameEngine.gameState.player.inventory[item] += quantity;
            
            gameEngine.saveGame();
            gameEngine.updateDisplay();
            
            const savings = (marketPrice - discountedPrice) * quantity;
            
            return {
                success: true,
                message: `Bought ${quantity} ${item} for $${totalCost.toLocaleString()} (saved $${savings.toLocaleString()})!`
            };
        }
        
        // Default case - just show the opportunity
        return {
            success: true,
            message: `A great deal on ${item} is available! Use the event interface to make your choice.`
        };
    }

    /**
     * Execute loan shark event - high interest rates
     * Requirement 4.7
     */
    executeLoanShark(gameEngine, params) {
        const { loanAmount, interestRate, daysToRepay, playerChoice } = params;
        
        if (playerChoice === 'decline') {
            return {
                success: true,
                message: 'You wisely declined the loan shark\'s offer.'
            };
        }
        
        if (playerChoice === 'accept') {
            // Add loan to player's cash
            gameEngine.gameState.player.cash += loanAmount;
            
            // Update story progression based on loan acceptance
            const storyManager = gameEngine.storyManager;
            const actionResult = { cost: loanAmount, risk: 'high' };
            
            // Track the loan (this could be expanded to include repayment mechanics)
            if (!gameEngine.gameState.loans) {
                gameEngine.gameState.loans = [];
            }
            
            const repaymentAmount = Math.floor(loanAmount * (1 + interestRate / 100));
            const dueDay = gameEngine.gameState.player.day + daysToRepay;
            
            gameEngine.gameState.loans.push({
                principal: loanAmount,
                interestRate: interestRate,
                repaymentAmount: repaymentAmount,
                dueDay: dueDay,
                daysToRepay: daysToRepay
            });
            
            gameEngine.saveGame();
            gameEngine.updateDisplay();
            
            return {
                success: true,
                message: `Loan accepted! You received $${loanAmount.toLocaleString()}. You must repay $${repaymentAmount.toLocaleString()} by day ${dueDay}.`
            };
        }
        
        // Default case - just show the opportunity
        return {
            success: true,
            message: `A loan shark offers you money at high interest. Use the event interface to make your choice.`
        };
    }

    /**
     * Execute police encounter event - confiscation, fines, health damage
     * Requirement 4.3
     */
    executePoliceEncounter(gameEngine, params) {
        const { encounterType, fineAmount, healthDamage } = params;
        let message = '';
        
        switch (encounterType) {
            case 'confiscation':
                // Confiscate random items from inventory
                const inventoryItems = Object.keys(gameEngine.gameState.player.inventory);
                if (inventoryItems.length > 0) {
                    const randomItem = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
                    const confiscatedAmount = Math.floor(gameEngine.gameState.player.inventory[randomItem] * (0.3 + Math.random() * 0.4)); // 30-70%
                    
                    gameEngine.gameState.player.inventory[randomItem] -= confiscatedAmount;
                    if (gameEngine.gameState.player.inventory[randomItem] <= 0) {
                        delete gameEngine.gameState.player.inventory[randomItem];
                    }
                    
                    message = `Police confiscated ${confiscatedAmount} units of ${randomItem}!`;
                } else {
                    message = 'Police searched you but found nothing to confiscate.';
                }
                break;
                
            case 'fine':
                const actualFine = Math.min(fineAmount, gameEngine.gameState.player.cash);
                gameEngine.gameState.player.cash -= actualFine;
                message = `Police found your stash and fined you $${actualFine.toLocaleString()}!`;
                break;
                
            case 'health_damage':
                // Initialize health if not exists (could be expanded to full health system)
                if (!gameEngine.gameState.player.health) {
                    gameEngine.gameState.player.health = 100;
                }
                
                gameEngine.gameState.player.health -= healthDamage;
                if (gameEngine.gameState.player.health < 0) {
                    gameEngine.gameState.player.health = 0;
                }
                
                // Check if player has items to determine message context
                const hasItems = Object.keys(gameEngine.gameState.player.inventory).length > 0;
                if (hasItems) {
                    message = `Police roughed you up during the search! Lost ${healthDamage} health (now ${gameEngine.gameState.player.health}/100).`;
                } else {
                    message = `Police harassed you for being in the wrong place! Lost ${healthDamage} health (now ${gameEngine.gameState.player.health}/100).`;
                }
                break;
        }
        
        gameEngine.saveGame();
        gameEngine.updateDisplay();
        
        return {
            success: true,
            message: message
        };
    }

    /**
     * Execute gang fight event - inventory damage, medical costs
     * Requirement 4.8
     */
    executeGangFight(gameEngine, params) {
        const { damageType, inventoryLoss, medicalCost } = params;
        let message = '';
        
        if (damageType === 'inventory') {
            // Damage random inventory items
            const inventoryItems = Object.keys(gameEngine.gameState.player.inventory);
            if (inventoryItems.length > 0) {
                const randomItem = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
                const lossAmount = Math.floor(gameEngine.gameState.player.inventory[randomItem] * (inventoryLoss / 100));
                
                gameEngine.gameState.player.inventory[randomItem] -= lossAmount;
                if (gameEngine.gameState.player.inventory[randomItem] <= 0) {
                    delete gameEngine.gameState.player.inventory[randomItem];
                }
                
                message = `Gang fight damaged your stash! Lost ${lossAmount} units of ${randomItem}.`;
            } else {
                message = 'Gang fight occurred but you had no inventory to damage.';
            }
        } else {
            // Medical costs
            const actualCost = Math.min(medicalCost, gameEngine.gameState.player.cash);
            gameEngine.gameState.player.cash -= actualCost;
            
            // Initialize health if not exists
            if (!gameEngine.gameState.player.health) {
                gameEngine.gameState.player.health = 100;
            }
            
            // Reduce health
            const healthLoss = Math.floor(Math.random() * 20) + 10; // 10-30 health loss
            gameEngine.gameState.player.health -= healthLoss;
            if (gameEngine.gameState.player.health < 0) {
                gameEngine.gameState.player.health = 0;
            }
            
            message = `Gang fight left you injured! Medical costs: $${actualCost.toLocaleString()}, health lost: ${healthLoss}.`;
        }
        
        gameEngine.saveGame();
        gameEngine.updateDisplay();
        
        return {
            success: true,
            message: message
        };
    }

    /**
     * Execute tip event - information about profitable locations
     * Requirement 4.9
     */
    executeTip(gameEngine, params) {
        const { location, item, tipType } = params;
        let message = '';
        
        if (tipType === 'high_price') {
            message = `Hot tip: ${item} is selling for premium prices in ${location}! Might be worth a trip.`;
        } else {
            message = `Insider info: ${item} is dirt cheap in ${location} right now. Good buying opportunity!`;
        }
        
        // Could enhance this by actually modifying prices in the target location
        // For now, it's just informational
        
        return {
            success: true,
            message: message
        };
    }

    /**
     * Execute vehicle theft event
     * Requirement 4.11
     */
    executeVehicleTheft(gameEngine, params) {
        const currentVehicle = gameEngine.gameState.player.vehicle;
        
        // Can't steal "On Foot" since it's not a physical vehicle
        if (currentVehicle === 'On Foot') {
            return {
                success: true,
                message: 'Some thieves tried to steal your vehicle, but you\'re on foot!'
            };
        }
        
        // Use the existing vehicle theft method
        const result = gameEngine.stealVehicle();
        
        return {
            success: true,
            message: result.message
        };
    }

    /**
     * Execute vehicle deal event - discount purchase opportunities
     * Requirement 4.12
     */
    executeVehicleDeal(gameEngine, params) {
        const { vehicle, discountPercentage, playerChoice } = params;
        
        if (!vehicle) {
            return {
                success: false,
                message: 'No vehicles available for discount deals.'
            };
        }
        
        if (playerChoice === 'decline') {
            return {
                success: true,
                message: 'You decided to pass on the vehicle deal.'
            };
        }
        
        if (playerChoice === 'buy') {
            const originalPrice = VEHICLES[vehicle].cost;
            const discountedPrice = Math.floor(originalPrice * (1 - discountPercentage / 100));
            
            // Use the existing discounted vehicle purchase method
            const result = gameEngine.purchaseDiscountedVehicle(vehicle, discountedPrice);
            
            if (result.success) {
                const savings = originalPrice - discountedPrice;
                return {
                    success: true,
                    message: `${result.message} (saved $${savings.toLocaleString()})!`
                };
            } else {
                return result;
            }
        }
        
        // Default case - just show the opportunity
        return {
            success: true,
            message: `A vehicle dealer offers you a ${vehicle} at a discount! Use the event interface to make your choice.`
        };
    }

    /**
     * Execute inventory expansion event
     * Requirement 5.6, 5.7, 5.8
     */
    executeInventoryExpansion(gameEngine, params) {
        const { expansionAmount } = params;
        
        // Use the existing inventory expansion method
        const result = gameEngine.expandInventory(expansionAmount);
        
        return {
            success: result.success,
            message: result.success ? 
                `Lucky break! ${result.message}` : 
                `Expansion opportunity failed: ${result.message}`
        };
    }
}

/**
 * Story Manager for narrative progression and milestone events
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */
class StoryManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.initializeStoryEvents();
    }

    /**
     * Initialize all story event definitions
     * Requirements: 9.1, 9.2, 9.3
     */
    initializeStoryEvents() {
        this.storyEvents = {
            // Opening story (game start)
            opening: {
                day: 1,
                title: 'Welcome to the Streets',
                description: `You're broke, desperate, and running out of options. The rent's due in a few weeks, and your landlord isn't the patient type. 
                
Word on the street is that there's money to be made in the pharmaceutical redistribution business - if you're smart about it and don't get caught.

You've got some starting cash and a basic understanding of the market. Time to see if you can turn this into something bigger before your time runs out.

The clock is ticking. Make every day count.`,
                triggered: false,
                type: 'milestone'
            },

            // Day 5 milestone
            day5: {
                day: 5,
                title: 'First Week Survival',
                description: `You've made it through your first week on the streets. The initial shock is wearing off, and you're starting to understand how this business works.

The other dealers are taking notice - some with respect, others with suspicion. You're no longer just another desperate newcomer.

Keep your head down and your eyes open. The real challenges are just beginning.`,
                triggered: false,
                type: 'milestone'
            },

            // Day 10 milestone
            day10: {
                day: 10,
                title: 'Building Your Reputation',
                description: `Two weeks in, and you're starting to build a reputation. People know your name now, and that comes with both opportunities and risks.

You've learned the rhythms of the street - when to buy, when to sell, when to lay low. The money is starting to add up, but so are the dangers.

Some of the established players are watching you closely. Success breeds enemies as much as it breeds opportunities.`,
                triggered: false,
                type: 'milestone'
            },

            // Day 15 milestone
            day15: {
                day: 15,
                title: 'Expanding Territory',
                description: `Halfway through your journey, and you've expanded beyond your starting territory. You know the ins and outs of multiple neighborhoods now.

The police are more aware of your activities, but you've also learned how to avoid their attention. Your network is growing, and with it, your influence.

But with greater territory comes greater responsibility - and greater risks. Every move you make now has consequences that ripple through the entire operation.`,
                triggered: false,
                type: 'milestone'
            },

            // Day 20 milestone
            day20: {
                day: 20,
                title: 'Major Opportunity',
                description: `You've caught the attention of some serious players. Word is that there's a major opportunity coming up - the kind that could set you up for life, or end everything you've built.

The streets are buzzing with rumors of a big score, but also increased police activity. Every dealer in the city is on edge.

You've come too far to back down now, but the next few days will determine whether you rise to the top or fall hard.`,
                triggered: false,
                type: 'milestone'
            },

            // Day 25 milestone
            day25: {
                day: 25,
                title: 'The Final Push',
                description: `Time is running short, and the pressure is mounting. You're in the final stretch now, and every decision matters more than ever.

The competition is fierce, the risks are higher, and the rewards are greater. You've learned everything you need to know - now it's time to put it all together.

This is your moment. Everything you've worked for comes down to these final days.`,
                triggered: false,
                type: 'milestone'
            }
        };
    }

    /**
     * Check if a story milestone should trigger based on current day
     * Requirements: 9.1, 9.2, 9.3
     */
    checkForStoryMilestone() {
        const currentDay = this.gameEngine.gameState.player.day;
        
        // Check each story event to see if it should trigger
        for (const [eventKey, storyEvent] of Object.entries(this.storyEvents)) {
            if (storyEvent.day === currentDay && !storyEvent.triggered) {
                // Mark as triggered
                storyEvent.triggered = true;
                
                // Add to triggered events list in game state
                if (!this.gameEngine.gameState.story.eventsTriggered.includes(eventKey)) {
                    this.gameEngine.gameState.story.eventsTriggered.push(eventKey);
                }
                
                // Update story progression tracking
                this.updateStoryProgression(eventKey);
                
                return {
                    id: eventKey,
                    title: storyEvent.title,
                    description: storyEvent.description,
                    day: storyEvent.day,
                    type: storyEvent.type
                };
            }
        }
        
        return null;
    }

    /**
     * Update story progression tracking
     * Requirements: 9.3
     */
    updateStoryProgression(eventKey) {
        // Update current phase based on milestone
        const phaseMap = {
            'opening': 0,
            'day5': 1,
            'day10': 2,
            'day15': 3,
            'day20': 4,
            'day25': 5
        };
        
        if (phaseMap[eventKey] !== undefined) {
            this.gameEngine.gameState.story.currentPhase = phaseMap[eventKey];
        }
        
        // Update player performance assessment for story adaptation
        this.updatePlayerPerformance();
    }

    /**
     * Update player performance assessment for story adaptation
     * Requirements: 9.4, 9.5
     */
    updatePlayerPerformance() {
        const player = this.gameEngine.gameState.player;
        const currentDay = player.day;
        const startingCash = this.getStartingCashForDifficulty(player.difficulty);
        const currentCash = player.cash;
        const profitRatio = currentCash / startingCash;
        
        // Calculate performance based on profit ratio and day progression
        let performance = 'average';
        
        if (profitRatio >= 5.0) {
            performance = 'excellent';
        } else if (profitRatio >= 2.0) {
            performance = 'good';
        } else if (profitRatio < 0.5) {
            performance = 'poor';
        }
        
        // Adjust for time factor - better performance expected later in game
        const timeProgress = currentDay / player.maxDays;
        if (timeProgress > 0.5 && profitRatio < 1.5) {
            performance = 'poor';
        } else if (timeProgress > 0.8 && profitRatio < 2.0) {
            performance = 'average';
        }
        
        this.gameEngine.gameState.story.playerPerformance = performance;
    }

    /**
     * Get starting cash amount for difficulty level
     */
    getStartingCashForDifficulty(difficulty) {
        switch (difficulty) {
            case 'easy': return 5000;
            case 'medium': return 2000;
            case 'hard': return 1000;
            default: return 2000;
        }
    }

    /**
     * Get performance-based narrative elements
     * Requirements: 9.4, 9.5
     */
    getPerformanceBasedNarrative(baseNarrative) {
        const performance = this.gameEngine.gameState.story.playerPerformance;
        const player = this.gameEngine.gameState.player;
        
        let performanceText = '';
        
        switch (performance) {
            case 'excellent':
                performanceText = `\n\nYour success has been remarkable - you've turned ${this.getStartingCashForDifficulty(player.difficulty).toLocaleString()} into ${player.cash.toLocaleString()}. The other dealers speak your name with a mixture of respect and envy.`;
                break;
            case 'good':
                performanceText = `\n\nYou've done well for yourself, building your cash from ${this.getStartingCashForDifficulty(player.difficulty).toLocaleString()} to ${player.cash.toLocaleString()}. You're earning respect on the streets.`;
                break;
            case 'poor':
                performanceText = `\n\nThe streets have been tough on you. With only ${player.cash.toLocaleString()} to show for your efforts, you're struggling to make ends meet. Time is running out to turn things around.`;
                break;
            default:
                performanceText = `\n\nYou're holding your own with ${player.cash.toLocaleString()} in hand. Not spectacular, but you're surviving in a dangerous business.`;
        }
        
        return baseNarrative + performanceText;
    }

    /**
     * Generate story conclusion based on final performance
     * Requirements: 9.5, 9.6
     */
    generateStoryConclusion() {
        const player = this.gameEngine.gameState.player;
        const finalCash = player.cash;
        const startingCash = this.getStartingCashForDifficulty(player.difficulty);
        const profitRatio = finalCash / startingCash;
        
        let conclusion = {
            title: '',
            description: '',
            performance: this.gameEngine.gameState.story.playerPerformance
        };
        
        if (profitRatio >= 10.0) {
            conclusion.title = 'Legendary Success';
            conclusion.description = `You've achieved the impossible. Starting with ${startingCash.toLocaleString()}, you've built an empire worth ${finalCash.toLocaleString()}.

The streets will remember your name for years to come. You've gone from desperate newcomer to legendary dealer in record time.

You've proven that with skill, determination, and a little luck, anyone can rise to the top of this dangerous game.

Your legend begins here.`;
        } else if (profitRatio >= 5.0) {
            conclusion.title = 'Outstanding Achievement';
            conclusion.description = `From ${startingCash.toLocaleString()} to ${finalCash.toLocaleString()} - you've exceeded all expectations.

You've mastered the art of the deal and navigated the dangers of the street with skill and cunning. The other dealers look up to you now.

You've secured your future and earned your place among the most successful operators in the city.

Well done.`;
        } else if (profitRatio >= 2.0) {
            conclusion.title = 'Solid Success';
            conclusion.description = `You turned ${startingCash.toLocaleString()} into ${finalCash.toLocaleString()} - a respectable achievement in this dangerous business.

You've learned the ropes, built connections, and proven you can survive on the streets. While not spectacular, your success is real and hard-earned.

You've got a future in this business if you want it.`;
        } else if (profitRatio >= 1.0) {
            conclusion.title = 'Modest Progress';
            conclusion.description = `Starting with ${startingCash.toLocaleString()}, you managed to reach ${finalCash.toLocaleString()}.

It wasn't easy, and there were setbacks along the way, but you survived. In this business, sometimes survival is victory enough.

You've learned valuable lessons that will serve you well if you choose to continue.`;
        } else {
            conclusion.title = 'Hard Lessons Learned';
            conclusion.description = `The streets were harsh. You started with ${startingCash.toLocaleString()} and ended with ${finalCash.toLocaleString()}.

Not every story has a happy ending, but every failure teaches valuable lessons. You've learned what it takes to survive in this world, even if success eluded you this time.

Sometimes the most important victories are the ones that teach us how to fight another day.`;
        }
        
        return conclusion;
    }

    /**
     * Get current story status for display
     */
    getStoryStatus() {
        return {
            currentPhase: this.gameEngine.gameState.story.currentPhase,
            eventsTriggered: this.gameEngine.gameState.story.eventsTriggered,
            playerPerformance: this.gameEngine.gameState.story.playerPerformance,
            availableEvents: Object.keys(this.storyEvents).filter(key => 
                !this.storyEvents[key].triggered && 
                this.storyEvents[key].day <= this.gameEngine.gameState.player.day
            )
        };
    }

    /**
     * Manually trigger a story event (for testing or special circumstances)
     */
    triggerStoryEvent(eventKey) {
        const storyEvent = this.storyEvents[eventKey];
        if (storyEvent && !storyEvent.triggered) {
            storyEvent.triggered = true;
            
            if (!this.gameEngine.gameState.story.eventsTriggered.includes(eventKey)) {
                this.gameEngine.gameState.story.eventsTriggered.push(eventKey);
            }
            
            this.updateStoryProgression(eventKey);
            
            return {
                id: eventKey,
                title: storyEvent.title,
                description: this.getPerformanceBasedNarrative(storyEvent.description),
                day: storyEvent.day,
                type: storyEvent.type
            };
        }
        
        return null;
    }

    /**
     * Get story integration with gameplay mechanics introduction
     * Requirements: 9.5, 9.6
     */
    getGameplayMechanicIntroduction(mechanicType) {
        const performance = this.gameEngine.gameState.story.playerPerformance;
        const currentPhase = this.gameEngine.gameState.story.currentPhase;
        
        const introductions = {
            'loan_shark': {
                'excellent': "Your success has attracted attention from loan sharks who see you as a reliable investment.",
                'good': "Word of your growing business has reached the loan sharks - they're offering deals.",
                'average': "A loan shark approaches, sensing an opportunity with someone who needs capital.",
                'poor': "Desperate times call for desperate measures - a loan shark offers high-risk money."
            },
            'inventory_expansion': {
                'excellent': "Your reputation opens doors to premium storage solutions and expansion opportunities.",
                'good': "Success brings opportunities - someone offers to help expand your operation.",
                'average': "You've found a way to increase your carrying capacity through street connections.",
                'poor': "Even in tough times, opportunities arise to expand your limited resources."
            },
            'vehicle_upgrade': {
                'excellent': "Your wealth attracts dealers offering premium transportation with maximum safety.",
                'good': "Your growing success allows you to consider better, safer transportation options.",
                'average': "You've earned enough respect to access better vehicles for safer travel.",
                'poor': "Even with limited funds, you've found a way to upgrade from walking the dangerous streets."
            },
            'police_encounter': {
                'excellent': "Your high profile has attracted unwanted attention from law enforcement.",
                'good': "Success comes with risks - the police are starting to notice your activities.",
                'average': "The streets are dangerous, and law enforcement is always a threat.",
                'poor': "Desperation makes you careless, increasing your risk of police encounters."
            }
        };
        
        return introductions[mechanicType] ? introductions[mechanicType][performance] : '';
    }

    /**
     * Adapt story content based on player actions and choices
     * Requirements: 9.4, 9.5
     */
    adaptStoryToPlayerActions(actionType, actionResult) {
        const performance = this.gameEngine.gameState.story.playerPerformance;
        const player = this.gameEngine.gameState.player;
        
        let adaptedContent = '';
        
        switch (actionType) {
            case 'major_purchase':
                if (actionResult.cost > player.cash * 0.5) {
                    adaptedContent = performance === 'excellent' ? 
                        "Another bold investment - your confidence in high-stakes decisions continues to pay off." :
                        "A risky purchase that could make or break your operation.";
                }
                break;
                
            case 'vehicle_purchase':
                adaptedContent = performance === 'excellent' ? 
                    "Upgrading your transportation shows your commitment to professional operations." :
                    performance === 'poor' ?
                    "Every safety improvement matters when you're struggling to survive." :
                    "Better transportation means safer operations and reduced risks.";
                break;
                
            case 'large_trade':
                if (actionResult.profit > 10000) {
                    adaptedContent = performance === 'excellent' ? 
                        "Another successful major deal solidifies your reputation as a top-tier operator." :
                        "This significant profit could be the turning point in your operation.";
                }
                break;
                
            case 'police_escape':
                adaptedContent = performance === 'excellent' ? 
                    "Your experience and resources help you navigate law enforcement encounters." :
                    performance === 'poor' ?
                    "Barely escaping the police - your luck won't hold forever." :
                    "Quick thinking and street smarts help you avoid serious trouble.";
                break;
        }
        
        return adaptedContent;
    }

    /**
     * Generate contextual story hints based on player performance
     * Requirements: 9.4, 9.5
     */
    generatePerformanceHints() {
        const performance = this.gameEngine.gameState.story.playerPerformance;
        const player = this.gameEngine.gameState.player;
        const timeProgress = player.day / player.maxDays;
        
        let hints = [];
        
        if (performance === 'poor' && timeProgress > 0.5) {
            hints.push("Time is running short - consider taking bigger risks for bigger rewards.");
            hints.push("Look for opportunities to expand your inventory or upgrade your transportation.");
            hints.push("High-value items like Cocaine and Heroin offer the best profit margins.");
        } else if (performance === 'excellent' && timeProgress < 0.8) {
            hints.push("Your success attracts both opportunities and dangers - stay vigilant.");
            hints.push("Consider diversifying your operations across multiple locations.");
            hints.push("Your reputation opens doors to exclusive deals and partnerships.");
        } else if (performance === 'average') {
            hints.push("Steady progress - look for opportunities to accelerate your growth.");
            hints.push("Building relationships in different neighborhoods can pay off.");
            hints.push("Balance risk and reward - bigger deals mean bigger profits but more danger.");
        }
        
        return hints;
    }

    /**
     * Create different story conclusions based on final performance
     * Enhanced version with more detailed performance analysis
     * Requirements: 9.5, 9.6
     */
    generateDetailedStoryConclusion() {
        const player = this.gameEngine.gameState.player;
        const finalCash = player.cash;
        const startingCash = this.getStartingCashForDifficulty(player.difficulty);
        const profitRatio = finalCash / startingCash;
        const eventsTriggered = this.gameEngine.gameState.story.eventsTriggered.length;
        const daysSurvived = player.day;
        
        // Calculate detailed performance metrics
        const metrics = {
            profitMultiplier: profitRatio,
            survivalRate: daysSurvived / player.maxDays,
            storyEngagement: eventsTriggered / 6, // 6 total story milestones
            riskTolerance: this.calculateRiskTolerance(),
            efficiency: finalCash / daysSurvived
        };
        
        let conclusion = this.generateStoryConclusion();
        
        // Add detailed analysis
        conclusion.metrics = metrics;
        conclusion.analysis = this.generatePerformanceAnalysis(metrics);
        conclusion.recommendations = this.generateRecommendations(metrics);
        
        return conclusion;
    }

    /**
     * Calculate player's risk tolerance based on actions
     */
    calculateRiskTolerance() {
        // This could be enhanced to track actual player decisions
        // For now, base it on performance and vehicle choices
        const player = this.gameEngine.gameState.player;
        const vehicleInfo = this.gameEngine.getCurrentVehicleInfo();
        
        let riskScore = 0.5; // Base neutral risk tolerance
        
        // Adjust based on vehicle choice
        if (vehicleInfo.name === 'On Foot') riskScore += 0.3;
        else if (vehicleInfo.name === 'Car') riskScore -= 0.2;
        
        // Adjust based on cash management
        const cashRatio = player.cash / this.getStartingCashForDifficulty(player.difficulty);
        if (cashRatio > 5) riskScore += 0.2; // High cash suggests risk-taking paid off
        else if (cashRatio < 1) riskScore += 0.3; // Low cash might indicate poor risk management
        
        return Math.max(0, Math.min(1, riskScore));
    }

    /**
     * Generate performance analysis text
     */
    generatePerformanceAnalysis(metrics) {
        let analysis = [];
        
        if (metrics.profitMultiplier > 5) {
            analysis.push("Exceptional profit generation demonstrates mastery of market dynamics.");
        } else if (metrics.profitMultiplier > 2) {
            analysis.push("Strong profit performance shows solid understanding of the business.");
        } else {
            analysis.push("Profit margins suggest room for improvement in trading strategies.");
        }
        
        if (metrics.riskTolerance > 0.7) {
            analysis.push("High risk tolerance led to bold decisions and significant opportunities.");
        } else if (metrics.riskTolerance < 0.3) {
            analysis.push("Conservative approach prioritized safety over maximum profit potential.");
        }
        
        if (metrics.efficiency > 1000) {
            analysis.push("Highly efficient operations maximized daily profit potential.");
        }
        
        return analysis;
    }

    /**
     * Generate recommendations for future gameplay
     */
    generateRecommendations(metrics) {
        let recommendations = [];
        
        if (metrics.profitMultiplier < 2) {
            recommendations.push("Focus on high-value items and market timing for better profits.");
            recommendations.push("Consider taking calculated risks for larger rewards.");
        }
        
        if (metrics.riskTolerance > 0.8) {
            recommendations.push("Balance risk-taking with safety measures like better vehicles.");
        } else if (metrics.riskTolerance < 0.3) {
            recommendations.push("Consider taking more calculated risks for higher rewards.");
        }
        
        if (metrics.storyEngagement < 0.5) {
            recommendations.push("Engage more with story events and milestone opportunities.");
        }
        
        return recommendations;
    }

    /**
     * Reset story progression (for new games)
     */
    resetStoryProgression() {
        // Reset all story events to not triggered
        for (const storyEvent of Object.values(this.storyEvents)) {
            storyEvent.triggered = false;
        }
        
        // Reset game state story tracking
        this.gameEngine.gameState.story = {
            currentPhase: 0,
            eventsTriggered: [],
            playerPerformance: 'average'
        };
    }
}

/**
 * Market System for price generation and trading mechanics
 */
class MarketSystem {
    constructor() {
        this.volatilityMultipliers = {
            'high': 1.5,
            'medium': 1.0,
            'low': 0.5
        };
        
        this.rarityMultipliers = {
            'rare': 0.3,
            'medium': 0.6,
            'common': 0.9
        };
    }

    /**
     * Generate market prices for a specific location
     * Implements ±50% variance with item-specific volatility and location modifiers
     */
    generateMarketPrices(location) {
        const market = {};
        const locationData = LOCATIONS[location];
        const locationModifier = locationData ? locationData.marketModifier : 1.0;

        for (const [itemName, itemData] of Object.entries(ITEMS)) {
            const [minPrice, maxPrice] = itemData.basePrice;
            
            // Calculate base price within range
            const basePrice = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
            
            // Apply ±50% variance
            const varianceMultiplier = 0.5 + Math.random(); // 0.5 to 1.5 (±50%)
            
            // Apply volatility effects
            const volatilityMultiplier = this.volatilityMultipliers[itemData.volatility] || 1.0;
            const volatilityEffect = 1 + (Math.random() - 0.5) * 0.3 * volatilityMultiplier;
            
            // Apply location modifier
            let finalPrice = basePrice * varianceMultiplier * volatilityEffect * locationModifier;
            
            // Round to nearest dollar and ensure minimum price of $1
            finalPrice = Math.max(1, Math.floor(finalPrice));
            
            // Determine availability based on rarity (expensive items less frequent)
            const availabilityChance = this.getRarityAvailability(itemData.rarity);
            const isAvailable = Math.random() < availabilityChance;
            
            // Generate quantity available (varies by rarity)
            let quantity = 0;
            if (isAvailable) {
                const baseQuantity = itemData.rarity === 'rare' ? 20 : 
                                   itemData.rarity === 'medium' ? 50 : 100;
                quantity = Math.floor(baseQuantity * (0.5 + Math.random() * 0.5)); // 50-100% of base
            }
            
            market[itemName] = {
                price: finalPrice,
                available: isAvailable,
                quantity: quantity
            };
        }

        return market;
    }

    /**
     * Apply volatility-specific price adjustments
     * High volatility items have more dramatic price swings
     */
    applyVolatilityEffects(basePrice, volatility) {
        const multiplier = this.volatilityMultipliers[volatility] || 1.0;
        const volatilityRange = 0.3 * multiplier; // 30% base range, modified by volatility
        const effect = 1 + (Math.random() - 0.5) * volatilityRange;
        return basePrice * effect;
    }

    /**
     * Get rarity-based availability probability
     */
    getRarityAvailability(rarity) {
        return this.rarityMultipliers[rarity] || 0.6;
    }

    /**
     * Calculate price with all modifiers applied
     */
    calculateFinalPrice(itemName, location) {
        const itemData = ITEMS[itemName];
        const locationData = LOCATIONS[location];
        
        if (!itemData || !locationData) {
            return 0;
        }

        const [minPrice, maxPrice] = itemData.basePrice;
        const basePrice = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
        
        // Apply all modifiers
        const varianceMultiplier = 0.5 + Math.random(); // ±50% variance
        const volatilityPrice = this.applyVolatilityEffects(basePrice, itemData.volatility);
        const locationModifier = locationData.marketModifier;
        
        let finalPrice = volatilityPrice * varianceMultiplier * locationModifier;
        return Math.max(1, Math.floor(finalPrice));
    }

    /**
     * Refresh market prices for a location (used when traveling)
     */
    refreshMarket(location) {
        return this.generateMarketPrices(location);
    }

    /**
     * Get current market data for a location
     */
    getMarketData(location, marketState) {
        if (!marketState || !marketState[location]) {
            return null;
        }
        return marketState[location];
    }

    /**
     * Check if an item is available at current location
     */
    isItemAvailable(itemName, location, marketState) {
        const marketData = this.getMarketData(location, marketState);
        if (!marketData || !marketData[itemName]) {
            return false;
        }
        return marketData[itemName].available && marketData[itemName].quantity > 0;
    }

    /**
     * Get available items at a location
     */
    getAvailableItems(location, marketState) {
        const marketData = this.getMarketData(location, marketState);
        if (!marketData) {
            return [];
        }
        
        return Object.entries(marketData)
            .filter(([, data]) => data.available && data.quantity > 0)
            .map(([itemName, data]) => ({
                name: itemName,
                price: data.price,
                quantity: data.quantity
            }));
    }
}

/**
 * Save System for local storage management
 */
class SaveSystem {
    constructor() {
        this.saveKey = 'drugWarsGameState';
    }

    /**
     * Save game state to local storage
     */
    saveGame(gameState) {
        try {
            const serializedState = JSON.stringify(gameState);
            localStorage.setItem(this.saveKey, serializedState);
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    /**
     * Load game state from local storage
     */
    loadGame() {
        try {
            const serializedState = localStorage.getItem(this.saveKey);
            if (serializedState) {
                return JSON.parse(serializedState);
            }
        } catch (error) {
            console.error('Failed to load game:', error);
        }
        return null;
    }

    /**
     * Clear saved game data
     */
    clearSave() {
        try {
            localStorage.removeItem(this.saveKey);
            return true;
        } catch (error) {
            console.error('Failed to clear save:', error);
            return false;
        }
    }

    /**
     * Check if save data exists
     */
    hasSavedGame() {
        return localStorage.getItem(this.saveKey) !== null;
    }
}

/**
 * UI Manager for handling interface updates and user interactions
 */
class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.elements = {};
    }

    /**
     * Initialize UI elements and event listeners
     */
    init() {
        // Cache DOM elements
        this.elements = {
            cashDisplay: document.getElementById('cash-display'),
            dayDisplay: document.getElementById('day-display'),
            locationDisplay: document.getElementById('location-display'),
            vehicleDisplay: document.getElementById('vehicle-display'),
            inventoryList: document.getElementById('inventory-list'),
            inventoryCapacity: document.getElementById('inventory-capacity'),
            mainPanel: document.getElementById('main-panel'),
            actionButtons: document.getElementById('action-buttons')
        };

        // Debug: Check if elements exist
        console.log('UI Elements found:', {
            cashDisplay: !!this.elements.cashDisplay,
            dayDisplay: !!this.elements.dayDisplay,
            locationDisplay: !!this.elements.locationDisplay,
            vehicleDisplay: !!this.elements.vehicleDisplay,
            inventoryList: !!this.elements.inventoryList,
            inventoryCapacity: !!this.elements.inventoryCapacity,
            mainPanel: !!this.elements.mainPanel,
            actionButtons: !!this.elements.actionButtons
        });

        // Check if main panel exists before proceeding
        if (!this.elements.mainPanel) {
            console.error('Main panel element not found! Cannot initialize UI.');
            return;
        }

        // Initialize keyboard navigation
        this.initKeyboardNavigation();

        // Show initial screen
        this.showStartScreen();
    }

    /**
     * Initialize keyboard navigation support
     * Requirements: 11.5 - Keyboard navigation support
     */
    initKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            // Handle global keyboard shortcuts
            switch (event.key) {
                case 'Escape':
                    // Return to main game if in a sub-interface
                    if (this.gameEngine.gameState.gameStarted && !this.gameEngine.gameState.gameEnded) {
                        this.showMainGame(this.gameEngine.getGameState());
                    }
                    break;
                    
                case 'h':
                case 'H':
                    if (event.ctrlKey || event.metaKey) {
                        // Ctrl+H or Cmd+H for help/shortcuts
                        event.preventDefault();
                        this.showKeyboardShortcuts();
                    }
                    break;
                    
                case 's':
                case 'S':
                    if (event.ctrlKey || event.metaKey) {
                        // Ctrl+S or Cmd+S for save
                        event.preventDefault();
                        if (this.gameEngine.gameState.gameStarted) {
                            this.gameEngine.saveGame();
                            this.showNotification('Game saved!');
                        }
                    }
                    break;
                    
                case 't':
                case 'T':
                    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                        // T for travel (if in main game)
                        if (this.gameEngine.gameState.gameStarted && !this.gameEngine.gameState.gameEnded) {
                            this.showTravelInterface();
                        }
                    }
                    break;
                    
                case 'v':
                case 'V':
                    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                        // V for vehicle shop (if in main game)
                        if (this.gameEngine.gameState.gameStarted && !this.gameEngine.gameState.gameEnded) {
                            this.showVehicleShop();
                        }
                    }
                    break;
            }
        });

        // Add focus management for dynamic content
        this.setupFocusManagement();
    }

    /**
     * Setup focus management for dynamic content
     */
    setupFocusManagement() {
        // Ensure focus is managed when content changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.target === this.elements.mainPanel) {
                    // Focus the first interactive element when main panel content changes
                    setTimeout(() => {
                        const firstButton = this.elements.mainPanel.querySelector('button');
                        const firstInput = this.elements.mainPanel.querySelector('input');
                        const focusTarget = firstInput || firstButton;
                        
                        if (focusTarget) {
                            focusTarget.focus();
                        }
                    }, 100);
                }
            });
        });

        observer.observe(this.elements.mainPanel, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Show keyboard shortcuts help
     */
    showKeyboardShortcuts() {
        this.elements.mainPanel.innerHTML = `
            <div class="keyboard-shortcuts" role="dialog" aria-labelledby="shortcuts-title">
                <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
                <div class="shortcuts-content">
                    <div class="shortcut-section">
                        <h3>Global Shortcuts</h3>
                        <ul>
                            <li><kbd>Ctrl+S</kbd> / <kbd>Cmd+S</kbd> - Save game</li>
                            <li><kbd>Ctrl+H</kbd> / <kbd>Cmd+H</kbd> - Show this help</li>
                            <li><kbd>Escape</kbd> - Return to main game</li>
                        </ul>
                    </div>
                    
                    <div class="shortcut-section">
                        <h3>Game Navigation</h3>
                        <ul>
                            <li><kbd>T</kbd> - Open travel interface</li>
                            <li><kbd>V</kbd> - Open vehicle shop</li>
                            <li><kbd>Tab</kbd> - Navigate between elements</li>
                            <li><kbd>Enter</kbd> / <kbd>Space</kbd> - Activate buttons</li>
                        </ul>
                    </div>
                    
                    <div class="shortcut-section">
                        <h3>Accessibility</h3>
                        <ul>
                            <li>Screen reader compatible</li>
                            <li>High contrast mode supported</li>
                            <li>Reduced motion respected</li>
                            <li>Touch-friendly interface</li>
                        </ul>
                    </div>
                </div>
                
                <div class="shortcuts-actions">
                    <button onclick="game.returnToMainGame()" autofocus>Close Help</button>
                </div>
            </div>
        `;

        this.elements.actionButtons.innerHTML = '';
    }

    /**
     * Show a temporary notification message
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'status');
        notification.setAttribute('aria-live', 'polite');
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'error' ? '#ff4444' : type === 'success' ? '#00ff00' : '#ffaa00',
            color: '#1a1a1a',
            padding: '1rem 1.5rem',
            borderRadius: '4px',
            fontWeight: 'bold',
            zIndex: '1000',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Show confirmation dialog for significant actions
     * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
     */
    showConfirmationDialog(title, message, onConfirm, onCancel = null) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'confirm-title');
        overlay.setAttribute('aria-describedby', 'confirm-message');
        
        overlay.innerHTML = `
            <div class="confirmation-dialog">
                <div class="dialog-header">
                    <h3 id="confirm-title">${title}</h3>
                </div>
                <div class="dialog-content">
                    <p id="confirm-message">${message}</p>
                </div>
                <div class="dialog-actions">
                    <button class="confirm-btn" id="confirm-yes">Confirm</button>
                    <button class="cancel-btn" id="confirm-no" autofocus>Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Focus the cancel button by default for safety
        setTimeout(() => {
            document.getElementById('confirm-no').focus();
        }, 100);
        
        // Handle confirmation
        document.getElementById('confirm-yes').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        });
        
        // Handle cancellation
        document.getElementById('confirm-no').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        });
        
        // Handle escape key
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', handleEscape);
                if (onCancel) onCancel();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        
        // Prevent background interaction
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', handleEscape);
                if (onCancel) onCancel();
            }
        });
    }

    /**
     * Show loading indicator
     */
    showLoadingIndicator(message = 'Loading...') {
        const loader = document.createElement('div');
        loader.className = 'loading-indicator';
        loader.id = 'loading-indicator';
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-live', 'polite');
        loader.setAttribute('aria-label', message);
        
        loader.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p class="loading-text">${message}</p>
            </div>
        `;
        
        document.body.appendChild(loader);
        return loader;
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            document.body.removeChild(loader);
        }
    }

    /**
     * Show error message with clear feedback
     */
    showErrorMessage(title, message, actions = null) {
        this.elements.mainPanel.innerHTML = `
            <div class="error-display" role="alert">
                <div class="error-header">
                    <h2 class="error-title">${title}</h2>
                </div>
                <div class="error-content">
                    <p class="error-message">${message}</p>
                </div>
                <div class="error-actions">
                    ${actions || '<button onclick="game.returnToMainGame()">Return to Game</button>'}
                </div>
            </div>
        `;
        
        this.elements.actionButtons.innerHTML = '';
    }

    /**
     * Show success message with clear feedback
     */
    showSuccessMessage(title, message, actions = null) {
        this.elements.mainPanel.innerHTML = `
            <div class="success-display" role="status">
                <div class="success-header">
                    <h2 class="success-title">${title}</h2>
                </div>
                <div class="success-content">
                    <p class="success-message">${message}</p>
                </div>
                <div class="success-actions">
                    ${actions || '<button onclick="game.returnToMainGame()">Continue</button>'}
                </div>
            </div>
        `;
        
        this.elements.actionButtons.innerHTML = '';
    }

    /**
     * Update game state display with progress indicators
     * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
     */
    updateGameStateDisplay(gameState) {
        // Update header with enhanced information
        this.updateHeader(gameState.player);
        
        // Update inventory with detailed status
        this.updateInventory(gameState.player);
        
        // Add progress indicators for time and goals
        this.updateProgressIndicators(gameState);
        
        // Update any active status messages
        this.updateStatusMessages(gameState);
    }

    /**
     * Update progress indicators for game progression
     */
    updateProgressIndicators(gameState) {
        const player = gameState.player;
        const timeProgress = (player.day / player.maxDays) * 100;
        const startingCash = this.getStartingCashForDifficulty(player.difficulty);
        const profitProgress = Math.min(((player.cash / startingCash) - 1) * 100, 500); // Cap at 500% profit
        
        // Add progress bars to header if they don't exist
        let progressContainer = document.getElementById('progress-indicators');
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'progress-indicators';
            progressContainer.className = 'progress-indicators';
            progressContainer.setAttribute('role', 'status');
            progressContainer.setAttribute('aria-live', 'polite');
            
            const headerStats = document.querySelector('.header-stats');
            if (headerStats) {
                headerStats.appendChild(progressContainer);
            }
        }
        
        progressContainer.innerHTML = `
            <div class="progress-item">
                <label class="progress-label">Time Progress</label>
                <div class="progress-bar" role="progressbar" aria-valuenow="${timeProgress}" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-fill time-progress" style="width: ${timeProgress}%"></div>
                </div>
                <span class="progress-text">${Math.round(timeProgress)}%</span>
            </div>
            
            <div class="progress-item">
                <label class="progress-label">Profit Progress</label>
                <div class="progress-bar" role="progressbar" aria-valuenow="${profitProgress}" aria-valuemin="0" aria-valuemax="500">
                    <div class="progress-fill profit-progress" style="width: ${Math.min(profitProgress, 100)}%"></div>
                </div>
                <span class="progress-text">${profitProgress > 0 ? '+' : ''}${Math.round(profitProgress)}%</span>
            </div>
        `;
    }

    /**
     * Get starting cash for difficulty level
     */
    getStartingCashForDifficulty(difficulty) {
        switch (difficulty) {
            case 'easy': return 5000;
            case 'medium': return 2000;
            case 'hard': return 1000;
            default: return 2000;
        }
    }

    /**
     * Update status messages based on game state
     */
    updateStatusMessages(gameState) {
        const player = gameState.player;
        const messages = [];
        
        // Check for low cash warning
        const startingCash = this.getStartingCashForDifficulty(player.difficulty);
        if (player.cash < startingCash * 0.5 && player.day > 5) {
            messages.push({
                type: 'warning',
                text: 'Cash is running low! Consider taking more risks for higher profits.'
            });
        }
        
        // Check for time warnings
        const timeRemaining = player.maxDays - player.day;
        if (timeRemaining <= 5 && timeRemaining > 0) {
            messages.push({
                type: 'warning',
                text: `Only ${timeRemaining} days remaining! Make them count.`
            });
        }
        
        // Check for inventory warnings
        const inventoryStatus = this.gameEngine.getInventoryStatus();
        if (inventoryStatus.percentage >= 90) {
            messages.push({
                type: 'warning',
                text: 'Inventory nearly full! Sell items or look for expansion opportunities.'
            });
        }
        
        // Check for health warnings (if health system is active)
        if (player.health !== undefined && player.health < 30) {
            messages.push({
                type: 'error',
                text: 'Health critically low! Avoid risky situations.'
            });
        }
        
        // Display status messages
        this.displayStatusMessages(messages);
    }

    /**
     * Display status messages in the UI
     */
    displayStatusMessages(messages) {
        let statusContainer = document.getElementById('status-messages');
        if (!statusContainer) {
            statusContainer = document.createElement('div');
            statusContainer.id = 'status-messages';
            statusContainer.className = 'status-messages';
            statusContainer.setAttribute('role', 'status');
            statusContainer.setAttribute('aria-live', 'polite');
            
            const mainPanel = this.elements.mainPanel;
            if (mainPanel && mainPanel.firstChild) {
                mainPanel.insertBefore(statusContainer, mainPanel.firstChild);
            }
        }
        
        if (messages.length === 0) {
            statusContainer.innerHTML = '';
            return;
        }
        
        statusContainer.innerHTML = messages.map(msg => `
            <div class="status-message status-${msg.type}">
                <span class="status-icon">${msg.type === 'error' ? '⚠️' : msg.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <span class="status-text">${msg.text}</span>
            </div>
        `).join('');
    }

    /**
     * Update header display with player stats
     */
    updateHeader(player) {
        if (this.elements.cashDisplay) {
            let cashText = `Cash: $${player.cash.toLocaleString()}`;
            
            // Add health display if health system is active
            if (player.health !== undefined) {
                const healthClass = player.health > 70 ? 'health-good' : 
                                  player.health > 30 ? 'health-warning' : 'health-critical';
                cashText += ` | Health: <span class="${healthClass}">${player.health}/100</span>`;
            }
            
            this.elements.cashDisplay.innerHTML = cashText;
        }
        if (this.elements.dayDisplay) {
            const remainingDays = player.maxDays - player.day;
            let dayText = `Day: ${player.day}/${player.maxDays}`;
            
            // Add remaining days display (Requirement 7.5)
            if (remainingDays > 0) {
                dayText += ` (${remainingDays} remaining)`;
            } else {
                dayText += ` (Final Day!)`;
            }
            
            // Add visual warning for low remaining days
            if (remainingDays <= 3 && remainingDays > 0) {
                this.elements.dayDisplay.innerHTML = `<span class="time-warning">${dayText}</span>`;
            } else if (remainingDays <= 0) {
                this.elements.dayDisplay.innerHTML = `<span class="time-critical">${dayText}</span>`;
            } else {
                this.elements.dayDisplay.textContent = dayText;
            }
        }
        if (this.elements.locationDisplay) {
            this.elements.locationDisplay.textContent = `Location: ${player.currentLocation}`;
        }
        if (this.elements.vehicleDisplay) {
            const vehicleInfo = this.gameEngine.getCurrentVehicleInfo();
            if (vehicleInfo) {
                this.elements.vehicleDisplay.innerHTML = `
                    <span class="vehicle-name">Vehicle: ${vehicleInfo.name}</span>
                    <span class="vehicle-safety">(${vehicleInfo.eventReductionPercentage}% safer)</span>
                `;
            } else {
                this.elements.vehicleDisplay.textContent = `Vehicle: ${player.vehicle}`;
            }
        }
    }

    /**
     * Update inventory display with enhanced information
     * Requirements: 5.3, 5.4, 5.5
     */
    updateInventory(player) {
        if (!this.elements.inventoryList) return;

        const detailedInventory = this.gameEngine.getDetailedInventory();
        const inventoryStatus = this.gameEngine.getInventoryStatus();

        if (detailedInventory.items.length === 0) {
            this.elements.inventoryList.innerHTML = '<div class="inventory-empty">Empty</div>';
        } else {
            this.elements.inventoryList.innerHTML = detailedInventory.items
                .map(item => `
                    <div class="inventory-item">
                        <div class="item-name">${item.name}</div>
                        <div class="item-quantity">Qty: ${item.quantity}</div>
                        <div class="item-value">Value: $${item.totalValue.toLocaleString()}</div>
                    </div>
                `).join('');
        }

        if (this.elements.inventoryCapacity) {
            const statusClass = inventoryStatus.status;
            this.elements.inventoryCapacity.innerHTML = `
                <div class="capacity-display ${statusClass}">
                    <div class="capacity-text">Capacity: ${inventoryStatus.usage}/${inventoryStatus.capacity}</div>
                    <div class="capacity-bar">
                        <div class="capacity-fill" style="width: ${inventoryStatus.percentage}%"></div>
                    </div>
                    <div class="capacity-percentage">${inventoryStatus.percentage}% Full</div>
                    ${inventoryStatus.capacity < 300 ? '<div class="expansion-hint">Inventory can be expanded through events</div>' : ''}
                </div>
            `;
        }
    }

    /**
     * Update main panel content based on game state
     */
    updateMainPanel(gameState) {
        if (!this.elements.mainPanel) return;

        console.log('updateMainPanel called - gameStarted:', gameState.gameStarted, 'cash:', gameState.player.cash);

        if (!gameState.gameStarted) {
            console.log('Game not started, showing start screen');
            this.showStartScreen();
        } else if (gameState.gameEnded) {
            console.log('Game ended, showing end screen');
            this.showGameEnd(gameState);
        } else {
            console.log('Game in progress, showing main game');
            this.showMainGame(gameState);
        }
    }

    /**
     * Show start screen with difficulty selection
     */
    showStartScreen() {
        console.log('showStartScreen called, mainPanel exists:', !!this.elements.mainPanel);
        console.log('mainPanel element:', this.elements.mainPanel);
        
        if (!this.elements.mainPanel) {
            console.error('Cannot show start screen - main panel element not found');
            return;
        }
        
        console.log('About to set innerHTML for main panel');
        
        this.elements.mainPanel.innerHTML = `
            <div class="text-center">
                <h1>Drug Wars</h1>
                <p class="game-intro">Welcome to the streets. You're a small-time dealer looking to make it big in 30 days or less.</p>
                <p class="game-intro">Choose your starting difficulty:</p>
                
                <div class="difficulty-selection">
                    <div class="difficulty-option">
                        <button class="difficulty-btn easy" onclick="game.startNewGame('easy')">
                            <h3>Easy</h3>
                            <div class="difficulty-details">
                                <p>Starting Cash: $5,000</p>
                                <p>Duration: 45 days</p>
                                <p>Perfect for beginners</p>
                            </div>
                        </button>
                    </div>
                    
                    <div class="difficulty-option">
                        <button class="difficulty-btn medium" onclick="game.startNewGame('medium')">
                            <h3>Medium</h3>
                            <div class="difficulty-details">
                                <p>Starting Cash: $2,000</p>
                                <p>Duration: 30 days</p>
                                <p>Balanced challenge</p>
                            </div>
                        </button>
                    </div>
                    
                    <div class="difficulty-option">
                        <button class="difficulty-btn hard" onclick="game.startNewGame('hard')">
                            <h3>Hard</h3>
                            <div class="difficulty-details">
                                <p>Starting Cash: $1,000</p>
                                <p>Duration: 20 days</p>
                                <p>For experienced players</p>
                            </div>
                        </button>
                    </div>
                </div>
                
                ${this.gameEngine.saveSystem.hasSavedGame() ? 
                    '<div class="continue-game"><button class="continue-btn" onclick="game.loadSavedGame()">Continue Saved Game</button></div>' : ''}
                    
                <div class="game-info">
                    <p><strong>Starting Conditions:</strong></p>
                    <p>• Location: Bronx</p>
                    <p>• Inventory Capacity: 100 units</p>
                    <p>• Vehicle: On Foot</p>
                </div>
            </div>
        `;

        console.log('Main panel innerHTML set successfully');
        this.elements.actionButtons.innerHTML = '';
        console.log('Action buttons cleared');
    }

    /**
     * Show main game interface
     */
    showMainGame(gameState) {
        this.elements.mainPanel.innerHTML = `
            <div class="text-center">
                <h2>${gameState.player.currentLocation} Market</h2>
                <p class="location-description">${this.getLocationDescription(gameState.player.currentLocation)}</p>
            </div>

            <!-- Market Section -->
            <div class="market-section">
                <h3>Available Items</h3>
                ${this.renderMarketItems()}
            </div>

            <!-- Sell Section -->
            <div class="sell-section">
                <h3>Your Inventory</h3>
                ${this.renderInventoryItems()}
            </div>

            <!-- Game Status Summary -->
            <div class="game-status-summary">
                <div class="status-item">
                    <span class="status-label">Cash</span>
                    <span class="status-value">${gameState.player.cash.toLocaleString()}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Day</span>
                    <span class="status-value">${gameState.player.day}/${gameState.player.maxDays}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Inventory</span>
                    <span class="status-value">${this.gameEngine.getInventoryStatus().usage}/${this.gameEngine.getInventoryStatus().capacity}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Vehicle</span>
                    <span class="status-value">${gameState.player.vehicle}</span>
                </div>
            </div>
        `;

        this.elements.actionButtons.innerHTML = `
            <button onclick="game.showTravelInterface()">Travel (T)</button>
            <button onclick="game.showVehicleShop()">Vehicle Shop (V)</button>
            <button onclick="game.saveGame()">Save Game</button>
            <button onclick="game.showStartScreen()">New Game</button>
        `;
    }

    /**
     * Render market items for the main game interface
     */
    renderMarketItems() {
        const availableItems = this.gameEngine.getAvailableItems();
        
        if (availableItems.length === 0) {
            return `
                <div class="no-items">
                    <p>No items available for purchase at this location.</p>
                </div>
            `;
        }
        
        return `
            <div class="market-items">
                ${availableItems.map(item => `
                    <div class="market-item">
                        <div class="item-header">
                            <span class="item-name">${item.name}</span>
                            <span class="item-price">${item.price.toLocaleString()}</span>
                        </div>
                        <div class="item-details">
                            <span class="item-quantity">Available: ${item.quantity}</span>
                            <div class="item-actions">
                                <button class="buy-btn" onclick="game.showBuyInterface('${item.name}', ${item.price}, ${item.quantity})">
                                    Buy
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render inventory items for the main game interface
     */
    renderInventoryItems() {
        const playerInventory = this.gameEngine.getInventoryWithValues();
        
        if (playerInventory.length === 0) {
            return `
                <div class="no-items">
                    <p>Your inventory is empty.</p>
                </div>
            `;
        }
        
        return `
            <div class="inventory-items">
                ${playerInventory.map(item => `
                    <div class="inventory-item-sell">
                        <div class="item-header">
                            <span class="item-name">${item.name}</span>
                            <span class="item-price">${item.currentPrice.toLocaleString()}</span>
                        </div>
                        <div class="item-details">
                            <span class="item-quantity">Owned: ${item.quantity}</span>
                            <span class="item-value">Value: ${item.totalValue.toLocaleString()}</span>
                            <div class="item-actions">
                                <button class="sell-btn" onclick="game.showSellInterface('${item.name}', ${item.currentPrice}, ${item.quantity})">
                                    Sell
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Show game end screen
     */
    showGameEnd(gameState) {
        const player = gameState.player;
        const storyConclusion = gameState.storyConclusion || {};
        
        // Determine performance level for styling
        const profitPercentage = gameState.profitPercentage || 0;
        let performanceClass = 'performance-average';
        let performanceText = 'Average Performance';
        
        if (profitPercentage >= 500) {
            performanceClass = 'performance-legendary';
            performanceText = 'Legendary Success!';
        } else if (profitPercentage >= 200) {
            performanceClass = 'performance-excellent';
            performanceText = 'Excellent Performance!';
        } else if (profitPercentage >= 50) {
            performanceClass = 'performance-good';
            performanceText = 'Good Performance';
        } else if (profitPercentage < 0) {
            performanceClass = 'performance-poor';
            performanceText = 'Tough Break';
        }

        this.elements.mainPanel.innerHTML = `
            <div class="game-end-screen">
                <div class="game-end-header">
                    <h1>Game Complete</h1>
                    <div class="performance-indicator ${performanceClass}">
                        ${performanceText}
                    </div>
                </div>

                <div class="final-stats">
                    <div class="stat-section">
                        <h2>Financial Results</h2>
                        <div class="stat-grid">
                            <div class="stat-item">
                                <span class="stat-label">Starting Cash:</span>
                                <span class="stat-value">$${(gameState.startingCash || 0).toLocaleString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Final Cash:</span>
                                <span class="stat-value highlight">$${player.cash.toLocaleString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Total Profit:</span>
                                <span class="stat-value ${(gameState.totalProfit || 0) >= 0 ? 'profit-positive' : 'profit-negative'}">
                                    ${(gameState.totalProfit || 0) >= 0 ? '+' : ''}$${(gameState.totalProfit || 0).toLocaleString()}
                                </span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Profit Percentage:</span>
                                <span class="stat-value ${profitPercentage >= 0 ? 'profit-positive' : 'profit-negative'}">
                                    ${profitPercentage >= 0 ? '+' : ''}${profitPercentage}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="stat-section">
                        <h2>Game Statistics</h2>
                        <div class="stat-grid">
                            <div class="stat-item">
                                <span class="stat-label">Difficulty:</span>
                                <span class="stat-value">${player.difficulty.charAt(0).toUpperCase() + player.difficulty.slice(1)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Days Played:</span>
                                <span class="stat-value">${gameState.daysPlayed || 0} / ${player.maxDays}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Final Score:</span>
                                <span class="stat-value highlight">${(gameState.finalScore || 0).toLocaleString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Profit per Day:</span>
                                <span class="stat-value">$${(gameState.profitPerDay || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    ${storyConclusion.title ? `
                        <div class="stat-section story-conclusion">
                            <h2>${storyConclusion.title}</h2>
                            <div class="story-text">
                                ${storyConclusion.description.split('\n').map(paragraph => 
                                    paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ''
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="game-end-actions">
                    <button class="primary-button" onclick="game.restartGame()">
                        Play Again (${player.difficulty})
                    </button>
                    <button class="secondary-button" onclick="game.showStartScreen()">
                        Main Menu
                    </button>
                </div>
            </div>
        `;

        this.elements.actionButtons.innerHTML = '';
    }

    /**
     * Show vehicle purchase interface
     * Requirements: 10.2, 10.4
     */
    showVehicleShop() {
        // Debug logging to track which game instance is being used
        console.log('showVehicleShop called - Game engine cash:', this.gameEngine.gameState.player.cash);
        console.log('showVehicleShop - Game engine instance:', this.gameEngine);
        
        const vehicles = this.gameEngine.getAvailableVehicles();
        const currentVehicle = this.gameEngine.getCurrentVehicleInfo();
        
        this.elements.mainPanel.innerHTML = `
            <div>
                <h2>Vehicle Shop</h2>
                <div class="current-vehicle-info">
                    <h3>Current Vehicle: ${currentVehicle.name}</h3>
                    <p>${currentVehicle.description}</p>
                    <p>Safety Bonus: ${currentVehicle.eventReductionPercentage}% risk reduction</p>
                </div>
                
                <h3>Available Vehicles</h3>
                <div class="vehicle-list">
                    ${vehicles.map(vehicle => `
                        <div class="vehicle-option ${vehicle.owned ? (vehicle.current ? 'current' : 'owned') : vehicle.affordable ? 'affordable' : 'unaffordable'}">
                            <div class="vehicle-header">
                                <span class="vehicle-name-display">${vehicle.name}</span>
                                <span class="vehicle-cost">$${vehicle.cost.toLocaleString()}</span>
                                ${vehicle.owned ? (vehicle.current ? '<span class="current-indicator">CURRENT</span>' : '<span class="owned-indicator">OWNED</span>') : ''}
                            </div>
                            <div class="vehicle-description">${vehicle.description}</div>
                            <div class="vehicle-stats">
                                <span>Safety: ${vehicle.eventReductionPercentage}% risk reduction</span>
                                <span>Cost: $${vehicle.cost.toLocaleString()}</span>
                            </div>
                            ${vehicle.owned ? 
                                (vehicle.current ? 
                                    `<button class="vehicle-select-btn current" disabled>
                                        Currently Using
                                    </button>` :
                                    `<button class="vehicle-select-btn" onclick="game.selectVehicle('${vehicle.name}')">
                                        Select Vehicle
                                    </button>`
                                ) :
                                (vehicle.canPurchase ? 
                                    `<button class="vehicle-purchase-btn" onclick="game.purchaseVehicleFromShop('${vehicle.name}')">
                                        Purchase for $${vehicle.cost.toLocaleString()}
                                    </button>` :
                                    `<button class="vehicle-purchase-btn" disabled>
                                        Cannot Afford
                                    </button>`
                                )
                            }
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.elements.actionButtons.innerHTML = `
            <button onclick="game.showMainGame()">Back to Game</button>
        `;
    }

    /**
     * Handle vehicle purchase from shop interface
     */
    purchaseVehicleFromShop(vehicleName) {
        const result = this.gameEngine.purchaseVehicle(vehicleName);
        
        if (result.success) {
            // Refresh the vehicle shop display
            this.showVehicleShop();
            // Show success message (could be enhanced with a notification system)
            console.log(result.message);
        } else {
            // Show error message (could be enhanced with a notification system)
            console.error(result.message);
            alert(result.message);
        }
    }

    /**
     * Show travel interface with 6 location options
     * Requirements: 2.1, 2.3, 2.4, 2.7
     */
    showTravelInterface() {
        const currentLocation = this.gameEngine.gameState.player.currentLocation;
        const currentVehicle = this.gameEngine.getCurrentVehicleInfo();
        
        // Get all locations except current one
        const availableLocations = Object.entries(LOCATIONS)
            .filter(([locationName]) => locationName !== currentLocation)
            .map(([locationName, locationData]) => ({
                name: locationName,
                modifier: locationData.marketModifier,
                description: this.getLocationDescription(locationName, locationData)
            }));

        this.elements.mainPanel.innerHTML = `
            <div>
                <h2>Travel Menu</h2>
                <div class="current-location-info">
                    <h3>Current Location: ${currentLocation}</h3>
                    <p>Vehicle: ${currentVehicle.name}</p>
                    <p>Safety Bonus: ${currentVehicle.eventReductionPercentage}% risk reduction during travel</p>
                    <p>Base Event Risk: 15% → Actual Risk: <span class="${this.getRiskClass(15 * (1 - currentVehicle.eventReduction))}">${Math.round(15 * (1 - currentVehicle.eventReduction))}%</span></p>
                    <p class="travel-warning">⚠️ Traveling advances the day by 1 and refreshes market prices</p>
                </div>
                
                <h3>Available Destinations</h3>
                <div class="location-list">
                    ${availableLocations.map(location => `
                        <div class="location-option">
                            <div class="location-header">
                                <span class="location-name">${location.name}</span>
                                <span class="location-modifier">Market: ${(location.modifier * 100).toFixed(0)}%</span>
                            </div>
                            <div class="location-description">${location.description}</div>
                            <button class="travel-btn" onclick="game.travelToLocationFromInterface('${location.name}')">
                                Travel to ${location.name}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.elements.actionButtons.innerHTML = `
            <button onclick="game.showMainGame()">Back to Game</button>
        `;
    }

    /**
     * Get CSS class for risk level display
     */
    getRiskClass(riskPercentage) {
        if (riskPercentage <= 5) return 'risk-low';
        if (riskPercentage <= 10) return 'risk-medium';
        return 'risk-high';
    }

    /**
     * Get descriptive text for locations
     */
    getLocationDescription(locationName, locationData) {
        const descriptions = {
            'Bronx': 'Starting area with balanced markets and moderate risks',
            'Ghetto': 'Lower prices but higher risks - good for cheap deals',
            'Central Park': 'Higher prices, frequent police patrols',
            'Manhattan': 'Premium market with the highest prices',
            'Coney Island': 'Tourist area with moderate prices and unique opportunities',
            'Brooklyn': 'Local network area with standard pricing'
        };
        
        return descriptions[locationName] || 'Unknown area';
    }

    /**
     * Handle travel from interface with validation and feedback
     */
    travelToLocationFromInterface(locationName) {
        const result = this.gameEngine.travelToLocation(locationName);
        
        if (result.success) {
            if (result.eventOccurred) {
                // Show event message with continue button - don't auto-advance
                this.showTravelEventResult(result.message, result.eventMessage);
            } else {
                // No event - show quick success message and auto-advance
                this.showTravelResult(result.message, true, false);
                setTimeout(() => {
                    this.showMainGame(this.gameEngine.getGameState());
                }, 2000);
            }
        } else {
            // Show error message
            this.showTravelResult(result.message, false, false);
        }
    }

    /**
     * Show travel result message
     */
    showTravelResult(message, success, hasEvent = false) {
        const messageClass = success ? 'text-success' : 'text-error';
        const currentContent = this.elements.mainPanel.innerHTML;
        
        // Format message to handle multi-line content
        const formattedMessage = message.replace(/\n/g, '<br>');
        const delay = hasEvent ? 4 : 2;
        
        // Add message at the top of the panel
        this.elements.mainPanel.innerHTML = `
            <div class="${messageClass} text-center" style="padding: 1rem; margin-bottom: 1rem; border: 2px solid; border-radius: 8px;">
                <strong>${formattedMessage}</strong>
                ${success ? `<br><small>Returning to game in ${delay} seconds...</small>` : ''}
            </div>
            ${currentContent}
        `;
    }

    /**
     * Show travel event result with continue button
     */
    showTravelEventResult(travelMessage, eventMessage) {
        // Extract just the basic travel info (before "During travel:")
        const basicTravelMessage = travelMessage.split('\n\nDuring travel:')[0];
        const formattedTravelMessage = basicTravelMessage.replace(/\n/g, '<br>');
        const formattedEventMessage = eventMessage ? eventMessage.replace(/\n/g, '<br>') : '';
        
        this.elements.mainPanel.innerHTML = `
            <div class="travel-event-result">
                <div class="travel-success" style="padding: 1rem; margin-bottom: 1rem; border: 2px solid #00ff00; border-radius: 8px; background-color: rgba(0, 255, 0, 0.1);">
                    <h3 style="color: #00ff00; margin-bottom: 1rem;">Travel Completed</h3>
                    <p style="color: #cccccc;">${formattedTravelMessage}</p>
                </div>
                
                ${eventMessage ? `
                <div class="event-details" style="padding: 1rem; margin-bottom: 1rem; border: 2px solid #ffaa00; border-radius: 8px; background-color: rgba(255, 170, 0, 0.1);">
                    <h3 style="color: #ffaa00; margin-bottom: 1rem;">Event During Travel</h3>
                    <div style="color: #cccccc; line-height: 1.6;">${formattedEventMessage}</div>
                </div>
                ` : ''}
                
                <div class="travel-actions" style="text-align: center; margin-top: 2rem;">
                    <button class="continue-btn" onclick="game.continueAfterTravelEvent()" style="
                        background-color: #333;
                        color: #00ff00;
                        border: 2px solid #00ff00;
                        padding: 1rem 2rem;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: inherit;
                        font-size: 1.1rem;
                    ">Continue Game</button>
                </div>
            </div>
        `;

        // Update action buttons
        this.elements.actionButtons.innerHTML = `
            <button onclick="game.continueAfterTravelEvent()">Continue Game</button>
        `;
    }

    /**
     * Continue game after travel event
     */
    continueAfterTravelEvent() {
        this.showMainGame(this.gameEngine.getGameState());
    }

    /**
     * Display random event interface with player response options
     * Requirements: 4.1, 4.2
     */
    showEventInterface(event) {
        if (!event) {
            return;
        }

        const eventTypeClass = `event-${event.type}`;
        
        this.elements.mainPanel.innerHTML = `
            <div class="event-interface ${eventTypeClass}">
                <div class="event-header">
                    <h2 class="event-title">${event.title}</h2>
                    <span class="event-type">${event.type.toUpperCase()}</span>
                </div>
                
                <div class="event-description">
                    <p>${event.description}</p>
                </div>
                
                <div class="event-details">
                    ${this.generateEventDetails(event)}
                </div>
                
                <div class="event-actions">
                    ${this.generateEventActions(event)}
                </div>
            </div>
        `;

        this.elements.actionButtons.innerHTML = `
            <button onclick="game.dismissEvent()">Continue</button>
        `;
    }

    /**
     * Generate event-specific details display
     */
    generateEventDetails(event) {
        const params = event.params;
        let details = '';

        switch (event.event) {
            case this.gameEngine.eventSystem.events.market_surge:
                details = `<p><strong>${params.item}</strong> prices are surging by <strong>${Math.round((params.priceMultiplier - 1) * 100)}%</strong>!</p>`;
                break;
                
            case this.gameEngine.eventSystem.events.theft:
                const lossAmount = Math.floor(this.gameEngine.gameState.player.cash * (params.lossPercentage / 100));
                details = `<p>You lost <strong>$${lossAmount.toLocaleString()}</strong> (${Math.round(params.lossPercentage)}% of your cash)!</p>`;
                break;
                
            case this.gameEngine.eventSystem.events.cheap_deal:
                details = `<p><strong>${params.quantity}</strong> units of <strong>${params.item}</strong> available at <strong>50% off</strong> market price!</p>`;
                break;
                
            case this.gameEngine.eventSystem.events.loan_shark:
                details = `
                    <p>Loan Amount: <strong>$${params.loanAmount.toLocaleString()}</strong></p>
                    <p>Interest Rate: <strong>${Math.round(params.interestRate)}%</strong></p>
                    <p>Repayment Due: <strong>${params.daysToRepay} days</strong></p>
                `;
                break;
                
            case this.gameEngine.eventSystem.events.vehicle_deal:
                if (params.vehicle) {
                    const originalPrice = VEHICLES[params.vehicle].cost;
                    const discountedPrice = Math.floor(originalPrice * (1 - params.discountPercentage / 100));
                    details = `
                        <p><strong>${params.vehicle}</strong> available for <strong>$${discountedPrice.toLocaleString()}</strong></p>
                        <p>Regular Price: <strong>$${originalPrice.toLocaleString()}</strong> (${Math.round(params.discountPercentage)}% off!)</p>
                    `;
                }
                break;
                
            case this.gameEngine.eventSystem.events.inventory_expansion:
                details = `<p>Expand your inventory by <strong>${params.expansionAmount} units</strong>!</p>`;
                break;
                
            default:
                details = '<p>Event details will be shown here.</p>';
        }

        return details;
    }

    /**
     * Generate event-specific action buttons
     */
    generateEventActions(event) {
        const params = event.params;
        let actions = '';

        switch (event.event) {
            case this.gameEngine.eventSystem.events.loan_shark:
                actions = `
                    <button class="event-action-btn accept" onclick="game.handleEventChoice('accept')">
                        Accept Loan ($${params.loanAmount.toLocaleString()})
                    </button>
                    <button class="event-action-btn decline" onclick="game.handleEventChoice('decline')">
                        Decline
                    </button>
                `;
                break;
                
            case this.gameEngine.eventSystem.events.cheap_deal:
                const market = this.gameEngine.getCurrentMarket();
                const marketPrice = market && market[params.item] ? market[params.item].price : 0;
                const discountedPrice = Math.floor(marketPrice * 0.5);
                const totalCost = discountedPrice * params.quantity;
                const canAfford = this.gameEngine.gameState.player.cash >= totalCost;
                const hasSpace = this.gameEngine.hasInventorySpace(params.quantity);
                
                actions = `
                    <button class="event-action-btn ${canAfford && hasSpace ? 'accept' : 'disabled'}" 
                            onclick="game.handleEventChoice('buy')" 
                            ${!canAfford || !hasSpace ? 'disabled' : ''}>
                        Buy for $${totalCost.toLocaleString()}
                    </button>
                    <button class="event-action-btn decline" onclick="game.handleEventChoice('decline')">
                        Pass
                    </button>
                    ${!canAfford ? '<p class="warning">Not enough cash!</p>' : ''}
                    ${!hasSpace ? '<p class="warning">Not enough inventory space!</p>' : ''}
                `;
                break;
                
            case this.gameEngine.eventSystem.events.vehicle_deal:
                if (params.vehicle) {
                    const originalPrice = VEHICLES[params.vehicle].cost;
                    const discountedPrice = Math.floor(originalPrice * (1 - params.discountPercentage / 100));
                    const canAfford = this.gameEngine.gameState.player.cash >= discountedPrice;
                    
                    actions = `
                        <button class="event-action-btn ${canAfford ? 'accept' : 'disabled'}" 
                                onclick="game.handleEventChoice('buy')" 
                                ${!canAfford ? 'disabled' : ''}>
                            Buy ${params.vehicle}
                        </button>
                        <button class="event-action-btn decline" onclick="game.handleEventChoice('decline')">
                            Pass
                        </button>
                        ${!canAfford ? '<p class="warning">Not enough cash!</p>' : ''}
                    `;
                }
                break;
                
            default:
                actions = `
                    <button class="event-action-btn continue" onclick="game.handleEventChoice('continue')">
                        Continue
                    </button>
                `;
        }

        return actions;
    }

    /**
     * Display story event interface with narrative text
     * Requirements: 9.1, 9.2, 9.3
     */
    showStoryEvent(storyEvent) {
        if (!storyEvent) {
            return;
        }

        this.elements.mainPanel.innerHTML = `
            <div class="story-event-interface">
                <div class="story-header">
                    <h2 class="story-title">${storyEvent.title}</h2>
                    <span class="story-day">Day ${storyEvent.day}</span>
                </div>
                
                <div class="story-content">
                    <div class="story-text">
                        ${storyEvent.description.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}
                    </div>
                </div>
                
                <div class="story-actions">
                    <button class="story-continue-btn" onclick="game.continueFromStory()">Continue</button>
                </div>
            </div>
        `;

        this.elements.actionButtons.innerHTML = '';
    }

    /**
     * Show event result after player choice
     */
    showEventResult(result) {
        const resultClass = result.success ? 'event-result-success' : 'event-result-failure';
        
        this.elements.mainPanel.innerHTML = `
            <div class="event-result ${resultClass}">
                <h3>${result.success ? 'Event Completed' : 'Event Failed'}</h3>
                <p>${result.message}</p>
                <button onclick="game.returnToMainGame()">Continue Game</button>
            </div>
        `;
    }

    /**
     * Show buy interface for a specific item
     * Requirements: 3.4, 3.5, 5.1, 5.2
     */
    showBuyInterface(itemName, price, availableQuantity) {
        const playerCash = this.gameEngine.gameState.player.cash;
        const availableSpace = this.gameEngine.getAvailableInventorySpace();
        const maxAffordable = Math.floor(playerCash / price);
        const maxPossible = Math.min(maxAffordable, availableSpace, availableQuantity);
        
        this.elements.mainPanel.innerHTML = `
            <div class="buy-interface">
                <h2>Buy ${itemName}</h2>
                <div class="item-info">
                    <p><strong>Price per unit:</strong> ${price.toLocaleString()}</p>
                    <p><strong>Available:</strong> ${availableQuantity} units</p>
                    <p><strong>Your cash:</strong> ${playerCash.toLocaleString()}</p>
                    <p><strong>Inventory space:</strong> ${availableSpace} units</p>
                    <p><strong>Max you can buy:</strong> ${maxPossible} units</p>
                </div>
                
                ${maxPossible > 0 ? `
                    <div class="quantity-selector">
                        <label for="buy-quantity">Quantity to buy:</label>
                        <input type="number" id="buy-quantity" min="1" max="${maxPossible}" value="1">
                        <div class="quantity-buttons">
                            <button onclick="document.getElementById('buy-quantity').value = 1">1</button>
                            <button onclick="document.getElementById('buy-quantity').value = Math.min(10, ${maxPossible})">10</button>
                            <button onclick="document.getElementById('buy-quantity').value = ${maxPossible}">Max</button>
                        </div>
                        <p id="total-cost">Total cost: ${price.toLocaleString()}</p>
                    </div>
                    
                    <div class="buy-actions">
                        <button class="buy-confirm-btn" onclick="game.executeBuy('${itemName}')">
                            Confirm Purchase
                        </button>
                        <button onclick="game.showMainGame()">Cancel</button>
                    </div>
                ` : `
                    <div class="cannot-buy">
                        <p class="text-error">Cannot buy this item:</p>
                        ${maxAffordable === 0 ? '<p>• Not enough cash</p>' : ''}
                        ${availableSpace === 0 ? '<p>• No inventory space</p>' : ''}
                        ${availableQuantity === 0 ? '<p>• None available</p>' : ''}
                    </div>
                    
                    <div class="buy-actions">
                        <button onclick="game.showMainGame()">Back</button>
                    </div>
                `}
            </div>
        `;

        // Add event listener for quantity changes
        if (maxPossible > 0) {
            setTimeout(() => {
                const quantityInput = document.getElementById('buy-quantity');
                const totalCostElement = document.getElementById('total-cost');
                
                if (quantityInput && totalCostElement) {
                    quantityInput.addEventListener('input', () => {
                        const quantity = parseInt(quantityInput.value) || 0;
                        const totalCost = quantity * price;
                        totalCostElement.textContent = `Total cost: ${totalCost.toLocaleString()}`;
                    });
                }
            }, 100);
        }

        this.elements.actionButtons.innerHTML = '';
    }

    /**
     * Show sell interface for a specific item
     * Requirements: 3.6
     */
    showSellInterface(itemName, price, ownedQuantity) {
        this.elements.mainPanel.innerHTML = `
            <div class="sell-interface">
                <h2>Sell ${itemName}</h2>
                <div class="item-info">
                    <p><strong>Price per unit:</strong> ${price.toLocaleString()}</p>
                    <p><strong>You own:</strong> ${ownedQuantity} units</p>
                    <p><strong>Total value:</strong> ${(price * ownedQuantity).toLocaleString()}</p>
                </div>
                
                <div class="quantity-selector">
                    <label for="sell-quantity">Quantity to sell:</label>
                    <input type="number" id="sell-quantity" min="1" max="${ownedQuantity}" value="1">
                    <div class="quantity-buttons">
                        <button onclick="document.getElementById('sell-quantity').value = 1">1</button>
                        <button onclick="document.getElementById('sell-quantity').value = Math.min(10, ${ownedQuantity})">10</button>
                        <button onclick="document.getElementById('sell-quantity').value = ${ownedQuantity}">All</button>
                    </div>
                    <p id="total-earnings">Total earnings: ${price.toLocaleString()}</p>
                </div>
                
                <div class="sell-actions">
                    <button class="sell-confirm-btn" onclick="game.executeSell('${itemName}')">
                        Confirm Sale
                    </button>
                    <button onclick="game.showMainGame()">Cancel</button>
                </div>
            </div>
        `;

        // Add event listener for quantity changes
        setTimeout(() => {
            const quantityInput = document.getElementById('sell-quantity');
            const totalEarningsElement = document.getElementById('total-earnings');
            
            if (quantityInput && totalEarningsElement) {
                quantityInput.addEventListener('input', () => {
                    const quantity = parseInt(quantityInput.value) || 0;
                    const totalEarnings = quantity * price;
                    totalEarningsElement.textContent = `Total earnings: ${totalEarnings.toLocaleString()}`;
                });
            }
        }, 100);

        this.elements.actionButtons.innerHTML = '';
    }
}

// Global game instance
let game;

// Explicitly expose classes to global scope for debugging
window.GameEngine = GameEngine;
window.SaveSystem = SaveSystem;
window.MarketSystem = MarketSystem;
window.UIManager = UIManager;
window.EventSystem = EventSystem;
window.StoryManager = StoryManager;

// Initialize game when DOM is loaded with error handling and performance monitoring
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Performance monitoring
        const startTime = performance.now();
        
        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'initial-loading';
        loadingIndicator.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #1a1a1a;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: #00ff00;
                font-family: 'Courier New', monospace;
            ">
                <div style="text-align: center;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 4px solid #333;
                        border-top: 4px solid #00ff00;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 1rem auto;
                    "></div>
                    <p>Loading Drug Wars...</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingIndicator);
        
        // Initialize game with slight delay to show loading
        setTimeout(() => {
            try {
                console.log('Creating GameEngine instance...');
                console.log('Classes available:', {
                    GameEngine: typeof GameEngine !== 'undefined',
                    SaveSystem: typeof SaveSystem !== 'undefined',
                    MarketSystem: typeof MarketSystem !== 'undefined',
                    UIManager: typeof UIManager !== 'undefined'
                });
                
                game = new GameEngine();
                console.log('GameEngine created successfully:', game);
                
                // Ensure window.game methods have access to the instance
                window.gameInstance = game;
                
                // Remove loading indicator
                document.body.removeChild(loadingIndicator);
                
                // Hide the loading screen in main panel and show the actual game
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
                
                // Ensure the game UI is properly initialized
                if (game && game.uiManager) {
                    console.log('Initializing game UI...');
                    game.updateDisplay();
                }
                
                // Log performance
                const endTime = performance.now();
                console.log(`Game initialized in ${Math.round(endTime - startTime)}ms`);
                
                // GitHub Pages optimization: Check for HTTPS redirect (only on deployed sites)
                if (location.protocol !== 'https:' && 
                    location.hostname !== 'localhost' && 
                    location.hostname !== '127.0.0.1' && 
                    location.hostname.includes('github.io')) {
                    console.log('Redirecting to HTTPS for GitHub Pages');
                    location.replace(`https:${location.href.substring(location.protocol.length)}`);
                    return;
                }
                
                // Add global error handler
                window.addEventListener('error', (event) => {
                    console.error('Game error:', event.error);
                    if (game && game.uiManager) {
                        game.uiManager.showErrorMessage(
                            'Game Error',
                            'An unexpected error occurred. The game will attempt to continue.',
                            '<button onclick="location.reload()">Reload Game</button>'
                        );
                    }
                });
                
                // Add unhandled promise rejection handler
                window.addEventListener('unhandledrejection', (event) => {
                    console.error('Unhandled promise rejection:', event.reason);
                    event.preventDefault();
                });
                
                // GitHub Pages optimization: Add performance monitoring
                if ('performance' in window && 'measure' in performance) {
                    performance.mark('game-ready');
                    performance.measure('game-load-time', 'navigationStart', 'game-ready');
                    const loadTime = performance.getEntriesByName('game-load-time')[0];
                    console.log(`Total game load time: ${Math.round(loadTime.duration)}ms`);
                }
                
                // Cross-browser compatibility checks
                if (!window.localStorage) {
                    console.warn('LocalStorage not available - save/load functionality will be limited');
                }
                
                if (!window.JSON) {
                    console.error('JSON not available - game may not function properly');
                }
                
            } catch (error) {
                console.error('Failed to initialize game:', error);
                document.body.removeChild(loadingIndicator);
                document.body.innerHTML = `
                    <div style="
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #1a1a1a;
                        color: #ff4444;
                        font-family: 'Courier New', monospace;
                        text-align: center;
                        padding: 2rem;
                    ">
                        <div>
                            <h1>Game Initialization Failed</h1>
                            <p>Error: ${error.message}</p>
                            <button onclick="location.reload()" style="
                                background-color: #333;
                                color: #00ff00;
                                border: 2px solid #00ff00;
                                padding: 1rem 2rem;
                                border-radius: 4px;
                                cursor: pointer;
                                font-family: inherit;
                                margin-top: 1rem;
                            ">Reload Game</button>
                        </div>
                    </div>
                `;
            }
        }, 100);
        
    } catch (error) {
        console.error('Critical initialization error:', error);
        document.body.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: #1a1a1a;
                color: #ff4444;
                font-family: 'Courier New', monospace;
                text-align: center;
                padding: 2rem;
            ">
                <div>
                    <h1>Critical Error</h1>
                    <p>The game failed to load. Please refresh the page.</p>
                    <button onclick="location.reload()" style="
                        background-color: #333;
                        color: #00ff00;
                        border: 2px solid #00ff00;
                        padding: 1rem 2rem;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: inherit;
                        margin-top: 1rem;
                    ">Reload Game</button>
                </div>
            </div>
        `;
    }
});

// Expose some methods globally for button onclick handlers
// Only create window.game if it doesn't already exist (to avoid overwriting working versions)
if (!window.game || typeof window.game.showBuyInterface !== 'function') {
    console.log('Creating window.game object...');
    window.game = {
    startNewGame: (difficulty) => {
        const gameInstance = window.gameInstance || game;
        if (gameInstance) {
            gameInstance.startNewGame(difficulty);
        } else {
            console.warn('Game not ready yet, please wait...');
            alert('Game is still loading, please wait a moment and try again.');
        }
    },
    restartGame: () => {
        const gameInstance = window.gameInstance || game;
        if (gameInstance) gameInstance.restartGame();
    },
    saveGame: () => {
        const gameInstance = window.gameInstance || game;
        if (gameInstance) gameInstance.saveGame();
    },
    showStartScreen: () => {
        const gameInstance = window.gameInstance || game;
        if (gameInstance && gameInstance.uiManager) {
            gameInstance.uiManager.showStartScreen();
        } else {
            console.warn('Game not ready yet, please wait...');
            alert('Game is still loading, please wait a moment and try again.');
        }
    },
    loadSavedGame: () => {
        const gameInstance = window.gameInstance || game;
        if (gameInstance) {
            const savedState = gameInstance.saveSystem.loadGame();
            if (savedState) {
                gameInstance.gameState = savedState;
                gameInstance.updateDisplay();
            }
        }
    },
    travelToLocation: (location) => game ? game.travelToLocation(location) : null,
    buyItem: (itemName, quantity) => {
        const gameInstance = window.gameInstance || game;
        return gameInstance ? gameInstance.buyItem(itemName, quantity) : null;
    },
    sellItem: (itemName, quantity) => {
        const gameInstance = window.gameInstance || game;
        return gameInstance ? gameInstance.sellItem(itemName, quantity) : null;
    },
    getCurrentMarket: () => {
        const gameInstance = window.gameInstance || game;
        return gameInstance ? gameInstance.getCurrentMarket() : null;
    },
    getAvailableItems: () => {
        const gameInstance = window.gameInstance || game;
        return gameInstance ? gameInstance.getAvailableItems() : null;
    },
    getInventoryWithValues: () => {
        const gameInstance = window.gameInstance || game;
        return gameInstance ? gameInstance.getInventoryWithValues() : null;
    },
    getDetailedInventory: () => {
        const gameInstance = window.gameInstance || game;
        return gameInstance ? gameInstance.getDetailedInventory() : null;
    },
    getGameState: () => {
        const gameInstance = window.gameInstance || game;
        return gameInstance ? gameInstance.getGameState() : null;
    },
    expandInventory: (amount) => game ? game.expandInventory(amount) : null,
    getInventoryStatus: () => game ? game.getInventoryStatus() : null,
    purchaseVehicle: (vehicleName) => game ? game.purchaseVehicle(vehicleName) : null,
    getCurrentVehicleInfo: () => game ? game.getCurrentVehicleInfo() : null,
    getAvailableVehicles: () => game ? game.getAvailableVehicles() : null,
    stealVehicle: () => game ? game.stealVehicle() : null,
    offerDiscountedVehicle: (vehicleName, discount) => game ? game.offerDiscountedVehicle(vehicleName, discount) : null,
    purchaseDiscountedVehicle: (vehicleName, price) => game ? game.purchaseDiscountedVehicle(vehicleName, price) : null,
    showVehicleShop: () => (game && game.uiManager) ? game.uiManager.showVehicleShop() : null,
    purchaseVehicleFromShop: (vehicleName) => (game && game.uiManager) ? game.uiManager.purchaseVehicleFromShop(vehicleName) : null,
    showTravelInterface: () => (game && game.uiManager) ? game.uiManager.showTravelInterface() : null,
    travelToLocationFromInterface: (locationName) => (game && game.uiManager) ? game.uiManager.travelToLocationFromInterface(locationName) : null,
    showMainGame: () => {
        if (game && game.uiManager) game.uiManager.showMainGame(game.getGameState());
    },
    // Event system methods
    getCurrentEvent: () => game ? game.eventSystem.getCurrentEvent() : null,
    handleEventChoice: (choice) => {
        if (game) {
            const result = game.eventSystem.executeCurrentEvent(choice);
            game.uiManager.showEventResult(result);
            game.saveGame();
            return result;
        }
        return null;
    },
    dismissEvent: () => {
        if (game) {
            game.eventSystem.clearCurrentEvent();
            game.uiManager.showMainGame(game.getGameState());
        }
    },
    returnToMainGame: () => {
        if (game) game.uiManager.showMainGame(game.getGameState());
    },
    continueAfterTravelEvent: () => {
        if (game && game.uiManager) game.uiManager.continueAfterTravelEvent();
    },
    selectVehicle: (vehicleName) => {
        if (game) {
            const result = game.selectVehicle(vehicleName);
            if (game.uiManager) {
                if (result.success) {
                    game.uiManager.showVehicleShop(); // Refresh the vehicle shop
                } else {
                    alert(result.message);
                }
            }
            return result;
        }
        return null;
    },
    triggerRandomEvent: () => {
        if (game) {
            const event = game.eventSystem.triggerRandomEvent();
            if (event) {
                game.uiManager.showEventInterface(event);
            }
            return event;
        }
        return null;
    },
    // Story system methods
    showStoryEvent: (storyEvent) => {
        if (game) game.uiManager.showStoryEvent(storyEvent);
    },
    continueFromStory: () => {
        if (game) game.uiManager.showMainGame(game.getGameState());
    },
    getStoryStatus: () => {
        return game ? game.storyManager.getStoryStatus() : null;
    },
    // Buy/Sell interface methods
    showBuyInterface: (itemName, price, quantity) => {
        const gameInstance = window.gameInstance || game;
        if (gameInstance && gameInstance.uiManager) {
            gameInstance.uiManager.showBuyInterface(itemName, price, quantity);
        } else {
            console.warn('Game not ready yet, please wait...');
            alert('Game is still loading, please wait a moment and try again.');
        }
    },
    showSellInterface: (itemName, price, quantity) => {
        if (game && game.uiManager) {
            game.uiManager.showSellInterface(itemName, price, quantity);
        } else {
            console.warn('Game not ready yet, please wait...');
            alert('Game is still loading, please wait a moment and try again.');
        }
    },
    executeBuy: (itemName) => {
        if (!game) return;
        
        const quantityInput = document.getElementById('buy-quantity');
        const quantity = parseInt(quantityInput.value) || 0;
        
        if (quantity > 0) {
            const market = game.getCurrentMarket();
            const price = market[itemName].price;
            const totalCost = price * quantity;
            
            // Show confirmation for large purchases
            if (totalCost > game.gameState.player.cash * 0.3) {
                game.uiManager.showConfirmationDialog(
                    'Large Purchase',
                    `Are you sure you want to buy ${quantity} ${itemName} for ${totalCost.toLocaleString()}? This is ${Math.round((totalCost / game.gameState.player.cash) * 100)}% of your cash.`,
                    () => {
                        game.processBuyTransaction(itemName, quantity);
                    }
                );
            } else {
                game.processBuyTransaction(itemName, quantity);
            }
        }
    },
    
    processBuyTransaction: (itemName, quantity) => {
        if (!game) return;
        
        const loader = game.uiManager.showLoadingIndicator('Processing purchase...');
        
        setTimeout(() => {
            const result = game.buyItem(itemName, quantity);
            game.uiManager.hideLoadingIndicator();
            
            if (result.success) {
                game.uiManager.showNotification(result.message, 'success');
                game.uiManager.showMainGame(game.getGameState());
                
                // Check for random event after purchase
                if (result.event) {
                    setTimeout(() => {
                        game.uiManager.showEventInterface(result.event);
                    }, 1000);
                }
            } else {
                game.uiManager.showNotification(result.message, 'error');
            }
        }, 500); // Simulate processing time
    },
    executeSell: (itemName) => {
        if (!game) return;
        
        const quantityInput = document.getElementById('sell-quantity');
        const quantity = parseInt(quantityInput.value) || 0;
        
        if (quantity > 0) {
            const playerInventory = game.getInventoryWithValues();
            const item = playerInventory.find(inv => inv.name === itemName);
            
            // Show confirmation for selling all of an item
            if (item && quantity === item.quantity) {
                game.uiManager.showConfirmationDialog(
                    'Sell All Items',
                    `Are you sure you want to sell ALL ${quantity} ${itemName}? You won't have any left.`,
                    () => {
                        game.processSellTransaction(itemName, quantity);
                    }
                );
            } else {
                game.processSellTransaction(itemName, quantity);
            }
        }
    },
    
    processSellTransaction: (itemName, quantity) => {
        if (!game) return;
        
        const loader = game.uiManager.showLoadingIndicator('Processing sale...');
        
        setTimeout(() => {
            const result = game.sellItem(itemName, quantity);
            game.uiManager.hideLoadingIndicator();
            
            if (result.success) {
                game.uiManager.showNotification(result.message, 'success');
                game.uiManager.showMainGame(game.getGameState());
                
                // Check for random event after sale
                if (result.event) {
                    setTimeout(() => {
                        game.uiManager.showEventInterface(result.event);
                    }, 1000);
                }
            } else {
                game.uiManager.showNotification(result.message, 'error');
            }
        }, 500); // Simulate processing time
    },
    // Accessibility and keyboard navigation
    showKeyboardShortcuts: () => {
        const gameInstance = window.gameInstance || game;
        if (gameInstance) gameInstance.uiManager.showKeyboardShortcuts();
    },
    
    // Debug method
    debug: () => {
        const gameInstance = window.gameInstance || game;
        console.log('Debug info:', {
            gameInstance: !!gameInstance,
            windowGameInstance: !!window.gameInstance,
            localGame: !!game,
            gameState: gameInstance ? !!gameInstance.gameState : false,
            uiManager: gameInstance ? !!gameInstance.uiManager : false
        });
        return gameInstance;
    }
    };
} else {
    console.log('window.game already exists and has showBuyInterface, not overwriting');
}