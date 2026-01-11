/**
 * Clean Mobile Touch Controls for Battle City
 * Handles both single player and multiplayer modes without duplication
 */

class MobileControlsManager {
    constructor() {
        this.isEnabled = this.isMobileDevice();
        this.initialized = false;
        this.activeControls = null;
        this.touchHandlers = new Map();
        
        // Control mappings
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
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0);
    }
    
    init() {
        if (!this.isEnabled) {
            console.log('Mobile controls disabled - not a mobile device');
            return;
        }
        
        console.log('Initializing mobile controls manager');
        this.setupGameControlButtons();
        this.initialized = true;
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
        gameControlsDiv.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            display: none;
            flex-direction: column;
            gap: 10px;
            z-index: 30;
            pointer-events: auto;
        `;
        
        // Pause button
        const pauseBtn = document.createElement('div');
        pauseBtn.className = 'universal-control-btn';
        pauseBtn.id = 'universal-pause-btn';
        pauseBtn.innerHTML = '⏸️';
        pauseBtn.title = 'Pause';
        pauseBtn.style.cssText = `
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
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        `;
        
        // Exit button
        const exitBtn = document.createElement('div');
        exitBtn.className = 'universal-control-btn';
        exitBtn.id = 'universal-exit-btn';
        exitBtn.innerHTML = '🚪';
        exitBtn.title = 'Exit';
        exitBtn.style.cssText = pauseBtn.style.cssText;
        
        gameControlsDiv.appendChild(pauseBtn);
        gameControlsDiv.appendChild(exitBtn);
        
        document.getElementById('game-container').appendChild(gameControlsDiv);
        
        // Add event listeners
        this.addButtonListeners(pauseBtn, () => {
            if (window.handlePauseKey) window.handlePauseKey();
        });
        
        this.addButtonListeners(exitBtn, () => {
            if (window.handleEscapeKey) window.handleEscapeKey();
        });
    }
    
    addButtonListeners(element, callback) {
        const touchStart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.style.background = 'rgba(255, 255, 255, 0.2)';
            element.style.borderColor = 'rgba(255, 255, 255, 0.8)';
            element.style.transform = 'scale(0.95)';
            callback();
        };
        
        const touchEnd = (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.style.background = 'rgba(0, 0, 0, 0.8)';
            element.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            element.style.transform = 'scale(1)';
        };
        
        element.addEventListener('touchstart', touchStart, { passive: false });
        element.addEventListener('touchend', touchEnd, { passive: false });
        element.addEventListener('touchcancel', touchEnd, { passive: false });
        element.addEventListener('click', callback);
    }
    
    setupControlsForMode(gameMode) {
        if (!this.isEnabled) return;
        
        this.cleanup();
        
        const GameMode = window.GameMode || { SINGLE: 'SINGLE', COOPERATIVE: 'COOPERATIVE', VERSUS: 'VERSUS' };
        
        if (gameMode === GameMode.SINGLE) {
            this.setupSinglePlayerControls();
        } else {
            this.setupMultiplayerControls();
        }
        
        this.activeControls = gameMode;
    }
    
    setupSinglePlayerControls() {
        const mapping = this.singlePlayerMapping;
        
        Object.keys(mapping).forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                const keyCode = mapping[buttonId];
                
                const startHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.keys) window.keys[keyCode] = true;
                    button.classList.add('active');
                };
                
                const endHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.keys) window.keys[keyCode] = false;
                    button.classList.remove('active');
                };
                
                // Store handlers for cleanup
                this.touchHandlers.set(buttonId, { startHandler, endHandler });
                
                // Add event listeners
                button.addEventListener('touchstart', startHandler, { passive: false });
                button.addEventListener('touchend', endHandler, { passive: false });
                button.addEventListener('touchcancel', endHandler, { passive: false });
                button.addEventListener('mousedown', startHandler);
                button.addEventListener('mouseup', endHandler);
                button.addEventListener('mouseleave', endHandler);
            }
        });
    }
    
    setupMultiplayerControls() {
        const mapping = this.multiplayerMapping;
        
        Object.keys(mapping).forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                const keyCode = mapping[buttonId];
                
                const startHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.keys) window.keys[keyCode] = true;
                    button.classList.add('active');
                };
                
                const endHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.keys) window.keys[keyCode] = false;
                    button.classList.remove('active');
                };
                
                // Store handlers for cleanup
                this.touchHandlers.set(buttonId, { startHandler, endHandler });
                
                // Add event listeners
                button.addEventListener('touchstart', startHandler, { passive: false });
                button.addEventListener('touchend', endHandler, { passive: false });
                button.addEventListener('touchcancel', endHandler, { passive: false });
                button.addEventListener('mousedown', startHandler);
                button.addEventListener('mouseup', endHandler);
                button.addEventListener('mouseleave', endHandler);
            }
        });
    }
    
    cleanup() {
        // Remove all existing event listeners
        this.touchHandlers.forEach((handlers, buttonId) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.removeEventListener('touchstart', handlers.startHandler);
                button.removeEventListener('touchend', handlers.endHandler);
                button.removeEventListener('touchcancel', handlers.endHandler);
                button.removeEventListener('mousedown', handlers.startHandler);
                button.removeEventListener('mouseup', handlers.endHandler);
                button.removeEventListener('mouseleave', handlers.endHandler);
                button.classList.remove('active');
            }
        });
        
        this.touchHandlers.clear();
        
        // Clear any active keys
        if (window.keys) {
            Object.values(this.singlePlayerMapping).forEach(key => {
                window.keys[key] = false;
            });
            Object.values(this.multiplayerMapping).forEach(key => {
                window.keys[key] = false;
            });
        }
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
        
        // Update game control buttons visibility
        const gameControls = document.getElementById('universal-game-controls');
        if (gameControls) {
            if (gameState === GameState.PLAYING || 
                gameState === GameState.COOPERATIVE || 
                gameState === GameState.VERSUS ||
                gameState === GameState.PAUSED) {
                gameControls.style.display = 'flex';
            } else {
                gameControls.style.display = 'none';
            }
        }
        
        // Update mobile controls visibility
        const singleControls = document.getElementById('single-player-controls');
        const multiControls = document.getElementById('multiplayer-controls');
        
        if (gameState === GameState.PLAYING || 
            gameState === GameState.COOPERATIVE || 
            gameState === GameState.VERSUS) {
            
            if (gameMode === GameMode.SINGLE) {
                if (singleControls) singleControls.classList.remove('hidden');
                if (multiControls) multiControls.classList.add('hidden');
            } else {
                if (singleControls) singleControls.classList.add('hidden');
                if (multiControls) multiControls.classList.remove('hidden');
            }
        } else {
            if (singleControls) singleControls.classList.add('hidden');
            if (multiControls) multiControls.classList.add('hidden');
        }
    }
    
    setGameMode(gameMode) {
        this.setupControlsForMode(gameMode);
    }
    
    setGameState(gameState, gameMode) {
        this.updateVisibility(gameState, gameMode);
    }
    
    destroy() {
        this.cleanup();
        
        const gameControls = document.getElementById('universal-game-controls');
        if (gameControls) {
            gameControls.remove();
        }
    }
}

// Global instance
let mobileControlsManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        mobileControlsManager = new MobileControlsManager();
        window.mobileControlsManager = mobileControlsManager;
        
        console.log('Mobile controls manager initialized');
    }, 100);
});