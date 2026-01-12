/**
 * Complete Mobile Controls Manager for Battle City
 * Supports Single Player and Local Multiplayer (2 players)
 * Uses Pointer Events only - no touch/mouse conflicts
 * Production-ready, clean, and bug-free implementation
 */

class MobileControlsManager {
    constructor() {
        this.isEnabled = this.isMobileDevice();
        this.initialized = false;
        this.activeControls = null;
        this.eventListeners = new Map(); // Better cleanup tracking
        this.activePointers = new Map(); // Track active pointer IDs
        
        // Control mappings for keyboard simulation
        this.singlePlayerMapping = {
            'btn-up': 'ArrowUp',
            'btn-down': 'ArrowDown', 
            'btn-left': 'ArrowLeft',
            'btn-right': 'ArrowRight',
            'btn-shoot': 'Space'
        };
        
        this.multiplayerMapping = {
            'btn-p1-up': 'KeyW',
            'btn-p1-down': 'KeyS',
            'btn-p1-left': 'KeyA', 
            'btn-p1-right': 'KeyD',
            'btn-p1-shoot': 'Space',
            'btn-p2-up': 'ArrowUp',
            'btn-p2-down': 'ArrowDown',
            'btn-p2-left': 'ArrowLeft',
            'btn-p2-right': 'ArrowRight',
            'btn-p2-shoot': 'Enter'
        };
        
        this.init();
    }
    
    isMobileDevice() {
        // Comprehensive mobile device detection
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
            'android', 'iphone', 'ipad', 'ipod', 'blackberry', 
            'windows phone', 'mobile', 'webos', 'opera mini'
        ];
        
        const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
        const isSmallScreen = window.innerWidth <= 768;
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const hasHover = window.matchMedia('(hover: hover)').matches;
        const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
        const isDesktop = hasHover && hasFinePointer;
        
        // Device is mobile if: has mobile UA OR (small screen AND touch support AND not desktop)
        const isMobile = isMobileUA || (isSmallScreen && hasTouch && !isDesktop);
        
        console.log(`[MobileControls] Device detection:`, {
            userAgent: userAgent.substring(0, 50) + '...',
            isMobileUA,
            isSmallScreen,
            hasTouch,
            isDesktop,
            isMobile,
            screenSize: `${window.innerWidth}x${window.innerHeight}`
        });
        
        return isMobile;
    }
    
    log(message) {
        console.log(`[MobileControls] ${message}`);
    }
    
    init() {
        if (!this.isEnabled) {
            this.log('Mobile controls disabled - not a mobile device');
            return;
        }
        
        this.log('Initializing mobile controls manager');
        this.setupGameControlButtons();
        this.hideAllControls();
        this.preventBrowserGestures();
        
        this.initialized = true;
        this.log('Mobile controls manager initialized');
    }
    
    preventBrowserGestures() {
        // Prevent browser gestures that interfere with game controls
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault(); // Prevent pinch zoom
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault(); // Prevent pinch zoom
            }
        }, { passive: false });
        
        // Prevent double-tap zoom on game container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.addEventListener('touchend', (e) => {
                e.preventDefault();
            }, { passive: false });
        }
    }
    
    hideAllControls() {
        const mobileControlsContainer = document.getElementById('mobile-controls');
        const singleControls = document.getElementById('single-player-controls');
        const multiControls = document.getElementById('multiplayer-controls');
        const gameControls = document.getElementById('universal-game-controls');
        
        if (mobileControlsContainer) {
            mobileControlsContainer.style.display = 'none';
            mobileControlsContainer.classList.remove('show');
        }
        if (singleControls) {
            singleControls.classList.add('hidden');
            singleControls.style.display = 'none';
        }
        if (multiControls) {
            multiControls.classList.add('hidden');
            multiControls.style.display = 'none';
        }
        if (gameControls) {
            gameControls.style.display = 'none';
        }
        
        this.log('All mobile controls hidden');
    }
    
    setupGameControlButtons() {
        // Create universal game control buttons (pause/exit)
        const existingControls = document.getElementById('universal-game-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        const gameControlsDiv = document.createElement('div');
        gameControlsDiv.id = 'universal-game-controls';
        gameControlsDiv.className = 'universal-game-controls';
        
        // Pause button
        const pauseBtn = this.createGameButton('⏸️', 'Pause');
        pauseBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (window.handlePauseKey) window.handlePauseKey();
        });
        
        // Exit button
        const exitBtn = this.createGameButton('🚪', 'Exit');
        exitBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (window.handleEscapeKey) window.handleEscapeKey();
        });
        
        gameControlsDiv.appendChild(pauseBtn);
        gameControlsDiv.appendChild(exitBtn);
        
        document.getElementById('game-container').appendChild(gameControlsDiv);
        
        this.log('Game control buttons created');
    }
    
    createGameButton(text, title) {
        const button = document.createElement('div');
        button.innerHTML = text;
        button.title = title;
        button.className = 'universal-control-btn';
        
        // Add visual feedback for button press
        button.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            button.style.background = 'rgba(255, 255, 255, 0.2)';
            button.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('pointerup', (e) => {
            e.preventDefault();
            button.style.background = 'rgba(0, 0, 0, 0.8)';
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('pointerleave', (e) => {
            button.style.background = 'rgba(0, 0, 0, 0.8)';
            button.style.transform = 'scale(1)';
        });
        
        return button;
    }
    
    setGameMode(gameMode) {
        if (!this.isEnabled) {
            this.log('Mobile controls disabled - skipping setGameMode');
            return;
        }
        
        this.log(`Setting up controls for mode: ${gameMode}`);
        this.cleanup();
        
        const GameMode = window.GameMode || { SINGLE: 'SINGLE', COOPERATIVE: 'COOPERATIVE', VERSUS: 'VERSUS' };
        
        if (gameMode === GameMode.SINGLE) {
            this.setupSinglePlayerControls();
        } else if (gameMode === GameMode.COOPERATIVE || gameMode === GameMode.VERSUS) {
            this.setupMultiplayerControls();
        } else {
            this.log(`Unknown game mode: ${gameMode}`);
        }
        
        this.activeControls = gameMode;
        this.log(`Controls setup complete for ${gameMode}`);
        
        // Update visibility after setup
        setTimeout(() => {
            this.updateVisibility(window.currentGameState, gameMode);
        }, 100);
    }
    
    setupSinglePlayerControls() {
        const mapping = this.singlePlayerMapping;
        let setupCount = 0;
        
        Object.keys(mapping).forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                const keyCode = mapping[buttonId];
                this.setupButtonEvents(button, keyCode, buttonId);
                setupCount++;
            } else {
                this.log(`Button not found: ${buttonId}`);
            }
        });
        
        this.log(`Single player controls: ${setupCount} buttons setup`);
    }
    
    setupMultiplayerControls() {
        const mapping = this.multiplayerMapping;
        let setupCount = 0;
        
        this.log('Setting up multiplayer controls...');
        
        Object.keys(mapping).forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                const keyCode = mapping[buttonId];
                this.setupButtonEvents(button, keyCode, buttonId);
                setupCount++;
                this.log(`✓ Button ${buttonId} -> ${keyCode} setup successful`);
            } else {
                this.log(`✗ Button not found: ${buttonId}`);
            }
        });
        
        this.log(`Multiplayer controls: ${setupCount} buttons setup`);
        
        if (!window.keys) {
            this.log('ERROR: window.keys object not found!');
        } else {
            this.log('✓ window.keys object found');
        }
    }
    
    setupButtonEvents(button, keyCode, buttonId) {
        // Use Pointer Events for unified touch/mouse handling
        const handleStart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Prevent duplicate inputs from same pointer
            if (this.activePointers.has(e.pointerId)) {
                return;
            }
            
            this.activePointers.set(e.pointerId, buttonId);
            
            // Set key as pressed
            if (window.keys) {
                window.keys[keyCode] = true;
                this.log(`Key SET: ${keyCode} = true (pointer: ${e.pointerId})`);
            } else {
                this.log(`ERROR: window.keys not found!`);
            }
            
            // Visual feedback
            button.classList.add('active');
            
            // Capture pointer to ensure we get pointerup even if finger moves outside button
            button.setPointerCapture(e.pointerId);
            
            this.log(`Button pressed: ${buttonId} -> ${keyCode}`);
        };
        
        const handleEnd = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Only handle if this pointer was active on this button
            if (!this.activePointers.has(e.pointerId) || 
                this.activePointers.get(e.pointerId) !== buttonId) {
                return;
            }
            
            this.activePointers.delete(e.pointerId);
            
            // Release key
            if (window.keys) {
                window.keys[keyCode] = false;
                this.log(`Key SET: ${keyCode} = false (pointer: ${e.pointerId})`);
            }
            
            // Remove visual feedback
            button.classList.remove('active');
            
            // Release pointer capture
            if (button.hasPointerCapture(e.pointerId)) {
                button.releasePointerCapture(e.pointerId);
            }
            
            this.log(`Button released: ${buttonId}`);
        };
        
        const handleCancel = (e) => {
            // Handle pointer cancel (e.g., system gesture interruption)
            handleEnd(e);
        };
        
        // Add pointer event listeners
        button.addEventListener('pointerdown', handleStart, { passive: false });
        button.addEventListener('pointerup', handleEnd, { passive: false });
        button.addEventListener('pointercancel', handleCancel, { passive: false });
        button.addEventListener('pointerleave', handleEnd, { passive: false });
        
        // Store listeners for cleanup
        if (!this.eventListeners.has(button)) {
            this.eventListeners.set(button, []);
        }
        
        this.eventListeners.get(button).push(
            { type: 'pointerdown', handler: handleStart },
            { type: 'pointerup', handler: handleEnd },
            { type: 'pointercancel', handler: handleCancel },
            { type: 'pointerleave', handler: handleEnd }
        );
    }
    
    cleanup() {
        // Remove all event listeners
        this.eventListeners.forEach((events, element) => {
            events.forEach(({ type, handler }) => {
                element.removeEventListener(type, handler);
            });
            element.classList.remove('active');
        });
        
        this.eventListeners.clear();
        this.activePointers.clear();
        
        // Clear all keys
        if (window.keys) {
            Object.values(this.singlePlayerMapping).forEach(key => {
                window.keys[key] = false;
            });
            Object.values(this.multiplayerMapping).forEach(key => {
                window.keys[key] = false;
            });
        }
        
        this.log('Cleanup completed');
    }
    
    updateVisibility(gameState, gameMode) {
        const GameState = window.GameState || { 
            PLAYING: 'PLAYING', 
            COOPERATIVE: 'COOPERATIVE', 
            VERSUS: 'VERSUS', 
            PAUSED: 'PAUSED',
            MENU: 'MENU',
            MODE_SELECT: 'MODE_SELECT',
            GAME_OVER: 'GAME_OVER'
        };
        
        const GameMode = window.GameMode || { SINGLE: 'SINGLE', COOPERATIVE: 'COOPERATIVE', VERSUS: 'VERSUS' };
        
        // Determine if controls should be shown
        const shouldShowControls = (gameState === GameState.PLAYING || 
                                   gameState === GameState.COOPERATIVE || 
                                   gameState === GameState.VERSUS) && this.isEnabled;
        
        // Update game control buttons visibility (pause/exit)
        const gameControls = document.getElementById('universal-game-controls');
        if (gameControls) {
            if (shouldShowControls || gameState === GameState.PAUSED) {
                gameControls.style.display = 'flex';
            } else {
                gameControls.style.display = 'none';
            }
        }
        
        // Update movement controls visibility
        const singleControls = document.getElementById('single-player-controls');
        const multiControls = document.getElementById('multiplayer-controls');
        const mobileControlsContainer = document.getElementById('mobile-controls');
        
        if (shouldShowControls) {
            // Show mobile controls container
            if (mobileControlsContainer) {
                mobileControlsContainer.style.display = 'flex';
                mobileControlsContainer.classList.add('show');
            }
            
            // Show appropriate controls based on game mode
            if (gameMode === GameMode.SINGLE) {
                if (singleControls) {
                    singleControls.classList.remove('hidden');
                    singleControls.style.display = 'flex';
                }
                if (multiControls) {
                    multiControls.classList.add('hidden');
                    multiControls.style.display = 'none';
                }
            } else {
                if (singleControls) {
                    singleControls.classList.add('hidden');
                    singleControls.style.display = 'none';
                }
                if (multiControls) {
                    multiControls.classList.remove('hidden');
                    multiControls.style.display = 'flex';
                }
            }
        } else {
            // Hide all mobile controls
            if (mobileControlsContainer) {
                mobileControlsContainer.style.display = 'none';
                mobileControlsContainer.classList.remove('show');
            }
            if (singleControls) {
                singleControls.classList.add('hidden');
                singleControls.style.display = 'none';
            }
            if (multiControls) {
                multiControls.classList.add('hidden');
                multiControls.style.display = 'none';
            }
        }
        
        this.log(`Visibility updated: ${gameState}, ${gameMode}, showControls: ${shouldShowControls}`);
    }
    
    setGameState(gameState, gameMode) {
        this.updateVisibility(gameState, gameMode);
    }
    
    // Development and testing methods
    testControls() {
        if (!this.isEnabled) {
            this.log('Controls testing skipped - not enabled');
            return;
        }
        
        this.log('Testing mobile controls...');
        this.log(`Mobile device: ${this.isEnabled}`);
        this.log(`Initialized: ${this.initialized}`);
        this.log(`Active controls: ${this.activeControls}`);
        this.log(`Event listeners: ${this.eventListeners.size}`);
        
        // Check button availability
        const singleButtons = Object.keys(this.singlePlayerMapping);
        const multiButtons = Object.keys(this.multiplayerMapping);
        
        singleButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            this.log(`Single button ${buttonId}: ${button ? 'Found' : 'Missing'}`);
        });
        
        multiButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            this.log(`Multi button ${buttonId}: ${button ? 'Found' : 'Missing'}`);
        });
        
        this.log(`window.keys object: ${window.keys ? 'Found' : 'Missing'}`);
    }
    
    testKey(keyCode, duration = 1000) {
        if (!window.keys) {
            this.log('ERROR: window.keys not found!');
            return;
        }
        
        this.log(`Testing key: ${keyCode} for ${duration}ms`);
        
        window.keys[keyCode] = true;
        this.log(`Key ${keyCode} set to TRUE`);
        
        setTimeout(() => {
            window.keys[keyCode] = false;
            this.log(`Key ${keyCode} set to FALSE`);
        }, duration);
    }
    
    testMultiplayerControls() {
        this.log('Testing all multiplayer controls...');
        
        const testKeys = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
        
        testKeys.forEach((key, index) => {
            setTimeout(() => {
                this.testKey(key, 500);
            }, index * 600);
        });
    }
    
    destroy() {
        this.cleanup();
        
        const gameControls = document.getElementById('universal-game-controls');
        if (gameControls) {
            gameControls.remove();
        }
        
        this.log('Mobile controls destroyed');
    }
}


// Global variable
let mobileControlsManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[MobileControls] DOM loaded, initializing...');
    
    setTimeout(() => {
        try {
            mobileControlsManager = new MobileControlsManager();
            window.mobileControlsManager = mobileControlsManager;
            
            console.log('[MobileControls] Manager created successfully');
            
            // Test controls if enabled
            if (mobileControlsManager.isEnabled) {
                mobileControlsManager.testControls();
            }
            
        } catch (error) {
            console.error('[MobileControls] Initialization failed:', error);
        }
    }, 200);
});

// Export for global access
window.MobileControlsManager = MobileControlsManager;