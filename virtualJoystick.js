/**
 * Virtual Joystick - Simple floating controls like in reference image
 */

class VirtualJoystick {
    constructor() {
        this.isEnabled = this.isMobileDevice();
        this.dpadState = { up: false, down: false, left: false, right: false };
        this.fireState = false;
        this.currentGameMode = null;
        this.currentGameState = null;
        
        if (this.isEnabled) {
            this.init();
        }
    }
    
    isMobileDevice() {
        // Проверяем User Agent на мобильные устройства
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
            'android', 'iphone', 'ipad', 'ipod', 'blackberry', 
            'windows phone', 'mobile', 'webos', 'opera mini'
        ];
        
        const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // Проверяем размер экрана (мобильные устройства обычно имеют ширину <= 768px)
        const isSmallScreen = window.innerWidth <= 768;
        
        // Проверяем наличие touch events
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        
        // Исключаем настольные браузеры с поддержкой hover
        const hasHover = window.matchMedia('(hover: hover)').matches;
        const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
        const isDesktop = hasHover && hasFinePointer;
        
        // Считаем устройство мобильным если:
        // 1. User Agent содержит мобильные ключевые слова ИЛИ
        // 2. (Экран маленький И есть поддержка touch) И НЕ настольный компьютер
        const isMobile = isMobileUA || (isSmallScreen && hasTouch && !isDesktop);
        
        console.log(`[VirtualJoystick] Device detection:`, {
            userAgent: userAgent,
            isMobileUA: isMobileUA,
            isSmallScreen: isSmallScreen,
            hasTouch: hasTouch,
            hasHover: hasHover,
            hasFinePointer: hasFinePointer,
            isDesktop: isDesktop,
            isMobile: isMobile,
            screenSize: `${window.innerWidth}x${window.innerHeight}`
        });
        
        return isMobile;
    }
    
    init() {
        console.log('[VirtualJoystick] Initializing...');
        this.createOverlay();
        this.hideControls(); // Скрываем контролы по умолчанию
    }
    
    createOverlay() {
        // Дополнительная проверка - не создаем overlay на ПК
        if (!this.isEnabled) {
            console.log('[VirtualJoystick] Overlay creation skipped - not a mobile device');
            return;
        }
        
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
        // Дополнительная проверка - не показываем на ПК
        if (!this.isEnabled) {
            console.log('[VirtualJoystick] Controls not shown - not a mobile device');
            return;
        }
        
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
        this.currentGameMode = gameMode;
        this.updateVisibility();
    }
    
    setGameState(gameState) {
        console.log(`[VirtualJoystick] Game state: ${gameState}`);
        this.currentGameState = gameState;
        this.updateVisibility();
    }
    
    updateVisibility() {
        const GameState = window.GameState || { 
            PLAYING: 'PLAYING', COOPERATIVE: 'COOPERATIVE', VERSUS: 'VERSUS',
            MENU: 'MENU', MODE_SELECT: 'MODE_SELECT', GAME_OVER: 'GAME_OVER', PAUSED: 'PAUSED'
        };
        
        const GameMode = window.GameMode || { 
            SINGLE: 'SINGLE', COOPERATIVE: 'COOPERATIVE', VERSUS: 'VERSUS' 
        };
        
        // Show virtual joystick ONLY when:
        // 1. Game mode is SINGLE player
        // 2. Game state is PLAYING (not in menu, mode select, etc.)
        const shouldShow = (
            this.currentGameMode === GameMode.SINGLE && 
            this.currentGameState === GameState.PLAYING
        );
        
        if (shouldShow) {
            this.showControls();
        } else {
            this.hideControls();
        }
        
        console.log(`[VirtualJoystick] Visibility update - Mode: ${this.currentGameMode}, State: ${this.currentGameState}, Show: ${shouldShow}`);
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