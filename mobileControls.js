/**
 * Enhanced Mobile Touch Controls for Battle City
 * Supports LOCAL CO-OP with dual-stick shooter style controls
 */

class MobileControls {
    constructor() {
        this.isEnabled = this.isMobileDevice();
        this.touchZones = {
            player1: { top: 0.5, bottom: 1.0 }, // Bottom half
            player2: { top: 0.0, bottom: 0.5 }  // Top half
        };
        
        // Touch tracking for each player
        this.activeTouches = {
            player1: { joystick: null, fire: null },
            player2: { joystick: null, fire: null }
        };
        
        // Virtual joystick states
        this.joysticks = {
            player1: { active: false, x: 0, y: 0, centerX: 0, centerY: 0 },
            player2: { active: false, x: 0, y: 0, centerX: 0, centerY: 0 }
        };
        
        // Fire button states
        this.fireButtons = {
            player1: { active: false, x: 0, y: 0 },
            player2: { active: false, x: 0, y: 0 }
        };
        
        // Control mappings to game keys
        this.keyMappings = {
            player1: {
                up: 'KeyW',
                down: 'KeyS',
                left: 'KeyA', 
                right: 'KeyD',
                fire: 'Space'
            },
            player2: {
                up: 'ArrowUp',
                down: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight', 
                fire: 'Enter'
            }
        };
        
        this.deadZone = 0.2; // Joystick dead zone
        this.maxDistance = 50; // Maximum joystick distance
        
        this.init();
    }
    
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0);
    }
    
    init() {
        if (!this.isEnabled) {
            console.log('Mobile controls disabled - not a mobile device');
            return;
        }
        
        console.log('Initializing enhanced mobile controls');
        this.createControlElements();
        this.setupEventListeners();
        
        // Изначально скрываем улучшенные контролы
        this.setEnabled(false);
    }
    
    createControlElements() {
        // Create enhanced mobile controls only for mobile devices
        if (!this.isEnabled) return;
        
        // НЕ удаляем существующие мобильные контролы - они нужны для одиночной игры
        
        // Create new mobile controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mobile-controls-enhanced';
        controlsContainer.className = 'mobile-controls-enhanced';
        
        // Create game control buttons
        const gameControlsDiv = this.createGameControls();
        controlsContainer.appendChild(gameControlsDiv);
        
        // Create player zones
        const player1Zone = this.createPlayerZone('player1', 'P1', 'bottom');
        const player2Zone = this.createPlayerZone('player2', 'P2', 'top');
        
        controlsContainer.appendChild(player1Zone);
        controlsContainer.appendChild(player2Zone);
        
        // Add to game container
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(controlsContainer);
        
        // Add CSS styles
        this.addStyles();
    }
    
    createGameControlButtons() {
        // Remove existing game control buttons
        const existingGameControls = document.getElementById('universal-game-controls');
        if (existingGameControls) {
            existingGameControls.remove();
        }
        
        // Create universal game control buttons (visible on all devices)
        const gameControlsDiv = document.createElement('div');
        gameControlsDiv.id = 'universal-game-controls';
        gameControlsDiv.className = 'universal-game-controls';
        
        // Pause button
        const pauseBtn = document.createElement('div');
        pauseBtn.className = 'universal-control-btn';
        pauseBtn.id = 'universal-pause-btn';
        pauseBtn.innerHTML = '⏸️';
        pauseBtn.title = 'Pause (Backspace)';
        
        // Exit button
        const exitBtn = document.createElement('div');
        exitBtn.className = 'universal-control-btn';
        exitBtn.id = 'universal-exit-btn';
        exitBtn.innerHTML = '🚪';
        exitBtn.title = 'Exit (ESC)';
        
        gameControlsDiv.appendChild(pauseBtn);
        gameControlsDiv.appendChild(exitBtn);
        
        // Add to game container
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(gameControlsDiv);
        
        // Add event listeners
        this.setupGameControlListeners();
    }
    
    setupGameControlListeners() {
        const pauseBtn = document.getElementById('universal-pause-btn');
        const exitBtn = document.getElementById('universal-exit-btn');
        
        if (pauseBtn) {
            pauseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.handlePauseKey) window.handlePauseKey();
            });
            pauseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.handlePauseKey) window.handlePauseKey();
            });
        }
        
        if (exitBtn) {
            exitBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.handleEscapeKey) window.handleEscapeKey();
            });
            exitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.handleEscapeKey) window.handleEscapeKey();
            });
        }
    }
    
    createPlayerZone(playerId, label, position) {
        const zone = document.createElement('div');
        zone.className = `player-zone player-zone-${position}`;
        zone.id = `${playerId}-zone`;
        
        // Player label
        const playerLabel = document.createElement('div');
        playerLabel.className = 'player-label';
        playerLabel.textContent = label;
        playerLabel.style.color = playerId === 'player1' ? '#4CAF50' : '#2196F3';
        
        // Joystick area (left side)
        const joystickArea = document.createElement('div');
        joystickArea.className = 'joystick-area';
        joystickArea.id = `${playerId}-joystick-area`;
        
        const joystick = document.createElement('div');
        joystick.className = 'virtual-joystick';
        joystick.id = `${playerId}-joystick`;
        
        const joystickKnob = document.createElement('div');
        joystickKnob.className = 'joystick-knob';
        joystick.appendChild(joystickKnob);
        
        joystickArea.appendChild(joystick);
        
        // Fire button (right side)
        const fireButton = document.createElement('div');
        fireButton.className = 'fire-button';
        fireButton.id = `${playerId}-fire`;
        fireButton.innerHTML = '🔥';
        
        // Assemble zone
        zone.appendChild(playerLabel);
        zone.appendChild(joystickArea);
        zone.appendChild(fireButton);
        
        return zone;
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .mobile-controls-enhanced {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 25;
                display: flex;
                flex-direction: column;
            }
            
            .universal-game-controls {
                position: absolute;
                top: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 35;
                pointer-events: auto;
            }
            
            .universal-control-btn {
                width: 50px;
                height: 50px;
                border: 2px solid rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
                -webkit-tap-highlight-color: transparent;
                transition: all 0.2s ease;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
            
            .universal-control-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.6);
                transform: scale(1.05);
            }
            
            .universal-control-btn:active {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.8);
                transform: scale(0.95);
            }
            
            .mobile-game-controls-enhanced {
                position: absolute;
                top: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 30;
                pointer-events: auto;
            }
            
            .game-control-btn-enhanced {
                width: 50px;
                height: 50px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
                -webkit-tap-highlight-color: transparent;
                transition: all 0.2s ease;
                cursor: pointer;
            }
            
            .game-control-btn-enhanced:active {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.6);
                transform: scale(0.95);
            }
            
            .player-zone {
                position: relative;
                width: 100%;
                height: 50%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px 40px;
                box-sizing: border-box;
                pointer-events: auto;
            }
            
            .player-zone-top {
                border-bottom: 2px solid rgba(255, 255, 255, 0.1);
            }
            
            .player-zone-bottom {
                border-top: 2px solid rgba(255, 255, 255, 0.1);
            }
            
            .player-label {
                position: absolute;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 5px 15px;
                border-radius: 15px;
                font-size: 14px;
                font-weight: bold;
                font-family: 'Courier New', monospace;
                z-index: 30;
            }
            
            .joystick-area {
                width: 120px;
                height: 120px;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .virtual-joystick {
                width: 100px;
                height: 100px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                position: relative;
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
                -webkit-tap-highlight-color: transparent;
            }
            
            .virtual-joystick.active {
                border-color: rgba(255, 255, 255, 0.6);
                background: rgba(255, 255, 255, 0.2);
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            }
            
            .joystick-knob {
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.8);
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                transition: all 0.1s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
            
            .joystick-knob.active {
                background: rgba(255, 255, 255, 1);
                transform: translate(-50%, -50%) scale(1.1);
            }
            
            .fire-button {
                width: 80px;
                height: 80px;
                border: 3px solid rgba(255, 0, 0, 0.5);
                border-radius: 50%;
                background: rgba(255, 0, 0, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
                -webkit-tap-highlight-color: transparent;
                transition: all 0.1s ease;
                cursor: pointer;
            }
            
            .fire-button.active {
                border-color: rgba(255, 0, 0, 0.8);
                background: rgba(255, 0, 0, 0.5);
                transform: scale(0.95);
                box-shadow: 0 0 20px rgba(255, 0, 0, 0.4);
            }
            
            /* Hide on desktop with mouse */
            @media (hover: hover) and (pointer: fine) {
                .mobile-controls-enhanced { 
                    display: none; 
                }
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .player-zone {
                    padding: 15px 30px;
                }
                
                .joystick-area {
                    width: 100px;
                    height: 100px;
                }
                
                .virtual-joystick {
                    width: 80px;
                    height: 80px;
                }
                
                .joystick-knob {
                    width: 32px;
                    height: 32px;
                }
                
                .fire-button {
                    width: 70px;
                    height: 70px;
                    font-size: 28px;
                }
            }
            
            @media (max-width: 480px) {
                .player-zone {
                    padding: 10px 20px;
                }
                
                .joystick-area {
                    width: 90px;
                    height: 90px;
                }
                
                .virtual-joystick {
                    width: 70px;
                    height: 70px;
                }
                
                .joystick-knob {
                    width: 28px;
                    height: 28px;
                }
                
                .fire-button {
                    width: 60px;
                    height: 60px;
                    font-size: 24px;
                }
            }
            
            /* Landscape orientation priority */
            @media (orientation: landscape) and (max-height: 500px) {
                .player-zone {
                    padding: 5px 25px;
                }
                
                .player-label {
                    top: 5px;
                    font-size: 12px;
                    padding: 3px 10px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Setup enhanced mobile controls only for mobile devices
        if (!this.isEnabled) return;
        
        const controlsContainer = document.getElementById('mobile-controls-enhanced');
        if (!controlsContainer) return;
        
        // Touch events on the entire controls container
        controlsContainer.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        controlsContainer.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        controlsContainer.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        controlsContainer.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
        
        // Prevent context menu on long press
        controlsContainer.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        
        for (let touch of event.changedTouches) {
            const player = this.getTouchPlayer(touch);
            if (!player) continue;
            
            const touchType = this.getTouchType(touch, player);
            if (!touchType) continue;
            
            // Check if this touch type is already bound to another touch
            if (this.activeTouches[player][touchType] !== null) continue;
            
            // Bind touch to player and type
            this.activeTouches[player][touchType] = touch.identifier;
            
            if (touchType === 'joystick') {
                this.startJoystick(player, touch);
            } else if (touchType === 'fire') {
                this.startFire(player, touch);
            }
        }
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        
        for (let touch of event.changedTouches) {
            const player = this.getPlayerByTouchId(touch.identifier);
            if (!player) continue;
            
            const touchType = this.getTouchTypeByTouchId(touch.identifier, player);
            if (touchType === 'joystick') {
                this.updateJoystick(player, touch);
            }
        }
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        
        for (let touch of event.changedTouches) {
            const player = this.getPlayerByTouchId(touch.identifier);
            if (!player) continue;
            
            const touchType = this.getTouchTypeByTouchId(touch.identifier, player);
            
            if (touchType === 'joystick') {
                this.endJoystick(player);
            } else if (touchType === 'fire') {
                this.endFire(player);
            }
            
            // Clear touch binding
            this.activeTouches[player][touchType] = null;
        }
    }
    
    getTouchPlayer(touch) {
        const rect = document.getElementById('mobile-controls-enhanced').getBoundingClientRect();
        const relativeY = (touch.clientY - rect.top) / rect.height;
        
        // Player 1: нижняя половина (0.5 - 1.0)
        // Player 2: верхняя половина (0.0 - 0.5)
        if (relativeY >= 0.5) {
            return 'player1';
        } else if (relativeY < 0.5) {
            return 'player2';
        }
        
        return null;
    }
    
    getTouchType(touch, player) {
        const rect = document.getElementById('mobile-controls-enhanced').getBoundingClientRect();
        const relativeX = (touch.clientX - rect.left) / rect.width;
        
        // Left side is joystick, right side is fire button
        if (relativeX < 0.5) {
            return 'joystick';
        } else {
            return 'fire';
        }
    }
    
    getPlayerByTouchId(touchId) {
        for (let player in this.activeTouches) {
            for (let touchType in this.activeTouches[player]) {
                if (this.activeTouches[player][touchType] === touchId) {
                    return player;
                }
            }
        }
        return null;
    }
    
    getTouchTypeByTouchId(touchId, player) {
        for (let touchType in this.activeTouches[player]) {
            if (this.activeTouches[player][touchType] === touchId) {
                return touchType;
            }
        }
        return null;
    }
    
    startJoystick(player, touch) {
        const joystickElement = document.getElementById(`${player}-joystick`);
        const rect = joystickElement.getBoundingClientRect();
        
        this.joysticks[player].active = true;
        this.joysticks[player].centerX = rect.left + rect.width / 2;
        this.joysticks[player].centerY = rect.top + rect.height / 2;
        
        joystickElement.classList.add('active');
        joystickElement.querySelector('.joystick-knob').classList.add('active');
        
        this.updateJoystick(player, touch);
        
        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    updateJoystick(player, touch) {
        if (!this.joysticks[player].active) return;
        
        const centerX = this.joysticks[player].centerX;
        const centerY = this.joysticks[player].centerY;
        
        // Calculate distance from center
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Limit to max distance
        const limitedDistance = Math.min(distance, this.maxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        
        // Calculate final position
        const finalX = Math.cos(angle) * limitedDistance;
        const finalY = Math.sin(angle) * limitedDistance;
        
        // Update joystick state
        this.joysticks[player].x = finalX / this.maxDistance;
        this.joysticks[player].y = finalY / this.maxDistance;
        
        // Update visual position
        const knob = document.getElementById(`${player}-joystick`).querySelector('.joystick-knob');
        knob.style.transform = `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px))`;
        
        // Update game keys based on joystick position
        this.updateMovementKeys(player);
    }
    
    updateMovementKeys(player) {
        const joystick = this.joysticks[player];
        const keys = this.keyMappings[player];
        
        // Clear all movement keys first
        if (window.keys) {
            window.keys[keys.up] = false;
            window.keys[keys.down] = false;
            window.keys[keys.left] = false;
            window.keys[keys.right] = false;
        }
        
        // Apply dead zone
        if (Math.abs(joystick.x) < this.deadZone && Math.abs(joystick.y) < this.deadZone) {
            return;
        }
        
        // Set keys based on joystick position
        if (window.keys) {
            if (joystick.y < -this.deadZone) window.keys[keys.up] = true;
            if (joystick.y > this.deadZone) window.keys[keys.down] = true;
            if (joystick.x < -this.deadZone) window.keys[keys.left] = true;
            if (joystick.x > this.deadZone) window.keys[keys.right] = true;
        }
    }
    
    endJoystick(player) {
        this.joysticks[player].active = false;
        this.joysticks[player].x = 0;
        this.joysticks[player].y = 0;
        
        const joystickElement = document.getElementById(`${player}-joystick`);
        joystickElement.classList.remove('active');
        
        const knob = joystickElement.querySelector('.joystick-knob');
        knob.classList.remove('active');
        knob.style.transform = 'translate(-50%, -50%)';
        
        // Clear movement keys
        const keys = this.keyMappings[player];
        if (window.keys) {
            window.keys[keys.up] = false;
            window.keys[keys.down] = false;
            window.keys[keys.left] = false;
            window.keys[keys.right] = false;
        }
    }
    
    startFire(player, touch) {
        const fireButton = document.getElementById(`${player}-fire`);
        fireButton.classList.add('active');
        
        this.fireButtons[player].active = true;
        
        // Set fire key
        const keys = this.keyMappings[player];
        if (window.keys) {
            window.keys[keys.fire] = true;
        }
        
        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    }
    
    endFire(player) {
        const fireButton = document.getElementById(`${player}-fire`);
        fireButton.classList.remove('active');
        
        this.fireButtons[player].active = false;
        
        // Clear fire key
        const keys = this.keyMappings[player];
        if (window.keys) {
            window.keys[keys.fire] = false;
        }
    }
    
    updateVisibility() {
        // Update enhanced mobile controls visibility (only for mobile devices)
        const controlsContainer = document.getElementById('mobile-controls-enhanced');
        if (controlsContainer) {
            const GameMode = window.GameMode || { COOPERATIVE: 'COOPERATIVE', VERSUS: 'VERSUS' };
            const currentMode = this.currentGameMode || window.currentGameMode;
            
            if (this.isEnabled && (currentMode === GameMode.COOPERATIVE || currentMode === GameMode.VERSUS)) {
                controlsContainer.style.display = 'flex';
            } else {
                controlsContainer.style.display = 'none';
            }
        }
        
        // Update universal game control buttons visibility (for all devices)
        this.updateGameControlsVisibility();
    }
    
    updateGameControlsVisibility() {
        const gameControls = document.getElementById('universal-game-controls');
        if (!gameControls) return;
        
        // Show game control buttons during gameplay on all devices
        const GameState = window.GameState || { PLAYING: 'PLAYING', COOPERATIVE: 'COOPERATIVE', VERSUS: 'VERSUS', PAUSED: 'PAUSED' };
        const currentState = window.currentGameState;
        
        if (currentState === GameState.PLAYING || 
            currentState === GameState.COOPERATIVE || 
            currentState === GameState.VERSUS ||
            currentState === GameState.PAUSED) {
            gameControls.style.display = 'flex';
        } else {
            gameControls.style.display = 'none';
        }
    }
    
    // Public method to update visibility when game mode changes
    setGameMode(gameMode) {
        // Store the current game mode for reference
        this.currentGameMode = gameMode;
        this.updateVisibility();
        
        // Enable/disable enhanced mobile controls based on game mode
        const GameMode = window.GameMode || { SINGLE: 'SINGLE', COOPERATIVE: 'COOPERATIVE', VERSUS: 'VERSUS' };
        const shouldEnable = (gameMode === GameMode.COOPERATIVE || gameMode === GameMode.VERSUS);
        this.setEnabled(shouldEnable);
    }
    
    // Public method to update game controls visibility when game state changes
    setGameState(gameState) {
        this.updateGameControlsVisibility();
    }
    
    // Public method to enable/disable controls
    setEnabled(enabled) {
        const controlsContainer = document.getElementById('mobile-controls-enhanced');
        if (controlsContainer) {
            if (enabled) {
                controlsContainer.style.display = 'flex';
                controlsContainer.style.pointerEvents = 'auto';
                controlsContainer.style.opacity = '1';
            } else {
                controlsContainer.style.display = 'none';
                controlsContainer.style.pointerEvents = 'none';
                controlsContainer.style.opacity = '0';
            }
        }
    }
    
    // Cleanup method
    destroy() {
        const controlsContainer = document.getElementById('mobile-controls-enhanced');
        if (controlsContainer) {
            controlsContainer.remove();
        }
        
        // Clear all active touches and keys
        for (let player in this.activeTouches) {
            this.endJoystick(player);
            this.endFire(player);
        }
    }
}

// Global instance
let mobileControls = null;

// Initialize mobile controls when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the game to initialize
    setTimeout(() => {
        // Initialize mobile controls
        mobileControls = new MobileControls();
        
        // Make it globally accessible
        window.mobileControls = mobileControls;
        
        // Hook into game mode changes
        const originalStartGame = window.startGame;
        if (originalStartGame) {
            window.startGame = function(gameMode) {
                const result = originalStartGame.call(this, gameMode);
                if (mobileControls) {
                    mobileControls.setGameMode(gameMode);
                }
                return result;
            };
        }
    }, 100);
});