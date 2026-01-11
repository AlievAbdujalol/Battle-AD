/**
 * Virtual Joystick - Simple floating controls like in reference image
 */

class VirtualJoystick {
    constructor() {
        this.isEnabled = this.isMobileDevice();
        this.dpadState = { up: false, down: false, left: false, right: false };
        this.fireState = false;
        
        if (this.isEnabled) {
            this.init();
        }
    }
    
    isMobileDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }
    
    init() {
        console.log('[VirtualJoystick] Initializing...');
        this.createOverlay();
        this.hideControls();
    }
    
    createOverlay() {
        // Remove existing
        const existing = document.getElementById('virtual-joystick-overlay');
        if (existing) existing.remove();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'virtual-joystick-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 1000; display: none;
        `;
        
        // D-pad
        overlay.appendChild(this.createDPad());
        
        // Fire button
        overlay.appendChild(this.createFireButton());
        
        document.body.appendChild(overlay);
        console.log('[VirtualJoystick] Overlay created');
    }
    
    createDPad() {
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute; bottom: 80px; left: 30px;
            width: 120px; height: 120px; pointer-events: auto;
        `;
        
        const buttons = [
            { id: 'up', text: '▲', pos: 'top: 0; left: 50%; transform: translateX(-50%);' },
            { id: 'left', text: '◀', pos: 'top: 50%; left: 0; transform: translateY(-50%);' },
            { id: 'right', text: '▶', pos: 'top: 50%; right: 0; transform: translateY(-50%);' },
            { id: 'down', text: '▼', pos: 'bottom: 0; left: 50%; transform: translateX(-50%);' }
        ];
        
        buttons.forEach(btn => {
            const button = document.createElement('div');
            button.innerHTML = btn.text;
            button.style.cssText = `
                position: absolute; width: 50px; height: 50px;
                background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                font-size: 20px; color: white; user-select: none; touch-action: manipulation;
                ${btn.pos}
            `;
            
            this.setupButton(button, btn.id, 'dpad');
            container.appendChild(button);
        });
        
        return container;
    }
    
    createFireButton() {
        const button = document.createElement('div');
        button.innerHTML = '🔥';
        button.style.cssText = `
            position: absolute; bottom: 100px; right: 40px;
            width: 80px; height: 80px;
            background: rgba(139, 69, 19, 0.8); border: 3px solid rgba(255, 140, 0, 0.6);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 32px; pointer-events: auto; user-select: none; touch-action: manipulation;
        `;
        
        this.setupButton(button, 'fire', 'fire');
        return button;
    }
    
    setupButton(button, id, type) {
        const start = (e) => {
            e.preventDefault();
            
            if (type === 'dpad') {
                this.dpadState[id] = true;
                button.style.background = 'rgba(255, 255, 255, 0.2)';
            } else {
                this.fireState = true;
                button.style.background = 'rgba(255, 69, 0, 0.9)';
            }
            
            this.updateKeys();
            console.log(`[VirtualJoystick] ${id} pressed`);
        };
        
        const end = (e) => {
            e.preventDefault();
            
            if (type === 'dpad') {
                this.dpadState[id] = false;
                button.style.background = 'rgba(0, 0, 0, 0.7)';
            } else {
                this.fireState = false;
                button.style.background = 'rgba(139, 69, 19, 0.8)';
            }
            
            this.updateKeys();
            console.log(`[VirtualJoystick] ${id} released`);
        };
        
        button.addEventListener('touchstart', start, { passive: false });
        button.addEventListener('touchend', end, { passive: false });
        button.addEventListener('touchcancel', end, { passive: false });
        button.addEventListener('mousedown', start);
        button.addEventListener('mouseup', end);
        button.addEventListener('mouseleave', end);
    }
    
    updateKeys() {
        if (!window.keys) return;
        
        // Single player keys
        window.keys['ArrowUp'] = this.dpadState.up;
        window.keys['ArrowDown'] = this.dpadState.down;
        window.keys['ArrowLeft'] = this.dpadState.left;
        window.keys['ArrowRight'] = this.dpadState.right;
        window.keys['Space'] = this.fireState;
        
        // Also set WASD for compatibility
        window.keys['KeyW'] = this.dpadState.up;
        window.keys['KeyS'] = this.dpadState.down;
        window.keys['KeyA'] = this.dpadState.left;
        window.keys['KeyD'] = this.dpadState.right;
    }
    
    showControls() {
        const overlay = document.getElementById('virtual-joystick-overlay');
        if (overlay) {
            overlay.style.display = 'block';
            console.log('[VirtualJoystick] Controls shown');
        }
    }
    
    hideControls() {
        const overlay = document.getElementById('virtual-joystick-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            console.log('[VirtualJoystick] Controls hidden');
        }
    }
    
    setGameMode(gameMode) {
        console.log(`[VirtualJoystick] Game mode: ${gameMode}`);
        
        const GameMode = window.GameMode || { SINGLE: 'SINGLE', COOPERATIVE: 'COOPERATIVE', VERSUS: 'VERSUS' };
        
        // Show virtual joystick only for single player mode
        // For multiplayer, use the existing mobile controls system
        if (gameMode === GameMode.SINGLE) {
            this.showControls();
        } else {
            this.hideControls();
        }
    }
    
    setGameState(gameState) {
        const GameState = window.GameState || { 
            PLAYING: 'PLAYING', COOPERATIVE: 'COOPERATIVE', VERSUS: 'VERSUS',
            MENU: 'MENU', MODE_SELECT: 'MODE_SELECT', GAME_OVER: 'GAME_OVER', PAUSED: 'PAUSED'
        };
        
        // Show controls only during single player gameplay
        if (gameState === GameState.PLAYING) {
            this.showControls();
        } else {
            this.hideControls();
        }
    }
}

// Global instance
let virtualJoystick = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        virtualJoystick = new VirtualJoystick();
        window.virtualJoystick = virtualJoystick;
        console.log('[VirtualJoystick] Initialized');
    }, 100);
});