/**
 * Simple and Reliable Mobile Touch Controls for Battle City
 * Focus on functionality over features
 */

class MobileControlsManager {
    constructor() {
        this.isEnabled = this.isMobileDevice();
        this.initialized = false;
        this.activeControls = null;
        this.eventListeners = [];
        
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
        // Более простая и надежная проверка
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
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
        this.initialized = true;
        this.log('Mobile controls manager initialized');
    }
    
    setupGameControlButtons() {
        // Создаем универсальные кнопки управления игрой
        const existingControls = document.getElementById('universal-game-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        const gameControlsDiv = document.createElement('div');
        gameControlsDiv.id = 'universal-game-controls';
        gameControlsDiv.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            display: none;
            flex-direction: column;
            gap: 10px;
            z-index: 30;
        `;
        
        // Кнопка паузы
        const pauseBtn = this.createButton('⏸️', 'Pause');
        pauseBtn.onclick = () => {
            if (window.handlePauseKey) window.handlePauseKey();
        };
        
        // Кнопка выхода
        const exitBtn = this.createButton('🚪', 'Exit');
        exitBtn.onclick = () => {
            if (window.handleEscapeKey) window.handleEscapeKey();
        };
        
        gameControlsDiv.appendChild(pauseBtn);
        gameControlsDiv.appendChild(exitBtn);
        
        document.getElementById('game-container').appendChild(gameControlsDiv);
        
        this.log('Game control buttons created');
    }
    
    createButton(text, title) {
        const button = document.createElement('div');
        button.innerHTML = text;
        button.title = title;
        button.style.cssText = `
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
            cursor: pointer;
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
        `;
        
        // Добавляем эффекты нажатия
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            button.style.background = 'rgba(255, 255, 255, 0.2)';
            button.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.style.background = 'rgba(0, 0, 0, 0.8)';
            button.style.transform = 'scale(1)';
        });
        
        return button;
    }
    
    setGameMode(gameMode) {
        if (!this.isEnabled) return;
        
        this.log(`Setting up controls for mode: ${gameMode}`);
        this.cleanup();
        
        const GameMode = window.GameMode || { SINGLE: 'SINGLE', COOPERATIVE: 'COOPERATIVE', VERSUS: 'VERSUS' };
        
        if (gameMode === GameMode.SINGLE) {
            this.setupSinglePlayerControls();
        } else {
            this.setupMultiplayerControls();
        }
        
        this.activeControls = gameMode;
        this.log(`Controls setup complete for ${gameMode}`);
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
        
        this.log(`Multiplayer controls: ${setupCount} buttons setup`);
    }
    
    setupButtonEvents(button, keyCode, buttonId) {
        // Функции обработчиков
        const handleStart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Устанавливаем клавишу как нажатую
            if (window.keys) {
                window.keys[keyCode] = true;
                this.log(`Key SET: ${keyCode} = true`);
            } else {
                this.log(`ERROR: window.keys not found!`);
            }
            
            // Визуальная обратная связь
            button.classList.add('active');
            
            this.log(`Button pressed: ${buttonId} -> ${keyCode}`);
        };
        
        const handleEnd = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Отпускаем клавишу
            if (window.keys) {
                window.keys[keyCode] = false;
                this.log(`Key SET: ${keyCode} = false`);
            }
            
            // Убираем визуальную обратную связь
            button.classList.remove('active');
            
            this.log(`Button released: ${buttonId}`);
        };
        
        // Добавляем обработчики событий
        button.addEventListener('touchstart', handleStart, { passive: false });
        button.addEventListener('touchend', handleEnd, { passive: false });
        button.addEventListener('touchcancel', handleEnd, { passive: false });
        
        // Также добавляем поддержку мыши для тестирования на десктопе
        button.addEventListener('mousedown', handleStart);
        button.addEventListener('mouseup', handleEnd);
        button.addEventListener('mouseleave', handleEnd);
        
        // Сохраняем обработчики для очистки
        this.eventListeners.push({
            element: button,
            events: [
                { type: 'touchstart', handler: handleStart },
                { type: 'touchend', handler: handleEnd },
                { type: 'touchcancel', handler: handleEnd },
                { type: 'mousedown', handler: handleStart },
                { type: 'mouseup', handler: handleEnd },
                { type: 'mouseleave', handler: handleEnd }
            ]
        });
    }
    
    cleanup() {
        // Удаляем все обработчики событий
        this.eventListeners.forEach(({ element, events }) => {
            events.forEach(({ type, handler }) => {
                element.removeEventListener(type, handler);
            });
            element.classList.remove('active');
        });
        
        this.eventListeners = [];
        
        // Очищаем все клавиши
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
        
        // Обновляем видимость кнопок управления игрой
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
        
        // Обновляем видимость мобильных контролов
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
        
        this.log(`Visibility updated: ${gameState}, ${gameMode}`);
    }
    
    setGameState(gameState, gameMode) {
        this.updateVisibility(gameState, gameMode);
    }
    
    // Метод для тестирования
    testControls() {
        this.log('Testing mobile controls...');
        this.log(`Mobile device: ${this.isEnabled}`);
        this.log(`Initialized: ${this.initialized}`);
        this.log(`Active controls: ${this.activeControls}`);
        this.log(`Event listeners: ${this.eventListeners.length}`);
        
        // Проверяем наличие кнопок
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
        
        // Проверяем объект keys
        this.log(`window.keys object: ${window.keys ? 'Found' : 'Missing'}`);
        if (window.keys) {
            this.log('Current keys state:', window.keys);
        }
    }
    
    // Метод для тестирования конкретной клавиши
    testKey(keyCode, duration = 1000) {
        this.log(`Testing key: ${keyCode} for ${duration}ms`);
        
        if (!window.keys) {
            this.log('ERROR: window.keys not found!');
            return;
        }
        
        window.keys[keyCode] = true;
        this.log(`Key ${keyCode} set to TRUE`);
        
        setTimeout(() => {
            window.keys[keyCode] = false;
            this.log(`Key ${keyCode} set to FALSE`);
        }, duration);
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

// Глобальная переменная
let mobileControlsManager = null;

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('[MobileControls] DOM loaded, initializing...');
    
    setTimeout(() => {
        try {
            mobileControlsManager = new MobileControlsManager();
            window.mobileControlsManager = mobileControlsManager;
            
            console.log('[MobileControls] Manager created successfully');
            
            // Тестируем контролы
            if (mobileControlsManager.isEnabled) {
                mobileControlsManager.testControls();
            }
            
        } catch (error) {
            console.error('[MobileControls] Initialization failed:', error);
        }
    }, 200);
});

// Экспортируем для глобального доступа
window.MobileControlsManager = MobileControlsManager;