/**
 * FIXED Mobile Controls Manager
 * No duplicates • Pointer Events only • Clean lifecycle
 */

class MobileControlsManager {
    constructor() {
        this.enabled = this.isMobile();
        this.activeMode = null;
        this.handlers = [];

        if (this.enabled) {
            console.log('[MobileControls] enabled');
        }
    }

    isMobile() {
        return (
            ('ontouchstart' in window) ||
            navigator.maxTouchPoints > 0 ||
            /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        );
    }

    setup(mode) {
        if (!this.enabled) return;

        this.cleanup();
        this.activeMode = mode;

        if (mode === GameMode.SINGLE) {
            this.bindSinglePlayer();
        } else {
            this.bindMultiplayer();
        }
    }

    bind(buttonId, keyCode) {
        const btn = document.getElementById(buttonId);
        if (!btn) return;

        const down = (e) => {
            e.preventDefault();
            e.stopPropagation();
            keys[keyCode] = true;
            btn.classList.add('active');
        };

        const up = (e) => {
            e.preventDefault();
            e.stopPropagation();
            keys[keyCode] = false;
            btn.classList.remove('active');
        };

        btn.addEventListener('pointerdown', down);
        btn.addEventListener('pointerup', up);
        btn.addEventListener('pointercancel', up);
        btn.addEventListener('pointerleave', up);

        this.handlers.push({ btn, down, up });
    }

    bindSinglePlayer() {
        document.getElementById('single-player-controls')?.classList.remove('hidden');
        document.getElementById('multiplayer-controls')?.classList.add('hidden');

        this.bind('btn-up', 'ArrowUp');
        this.bind('btn-down', 'ArrowDown');
        this.bind('btn-left', 'ArrowLeft');
        this.bind('btn-right', 'ArrowRight');
        this.bind('btn-shoot', 'Space');
    }

    bindMultiplayer() {
        document.getElementById('single-player-controls')?.classList.add('hidden');
        document.getElementById('multiplayer-controls')?.classList.remove('hidden');

        // Player 1
        this.bind('btn-p1-up', 'KeyW');
        this.bind('btn-p1-down', 'KeyS');
        this.bind('btn-p1-left', 'KeyA');
        this.bind('btn-p1-right', 'KeyD');
        this.bind('btn-p1-shoot', 'Space');

        // Player 2
        this.bind('btn-p2-up', 'ArrowUp');
        this.bind('btn-p2-down', 'ArrowDown');
        this.bind('btn-p2-left', 'ArrowLeft');
        this.bind('btn-p2-right', 'ArrowRight');
        this.bind('btn-p2-shoot', 'Enter');
    }

    cleanup() {
        this.handlers.forEach(({ btn, down, up }) => {
            btn.removeEventListener('pointerdown', down);
            btn.removeEventListener('pointerup', up);
            btn.removeEventListener('pointercancel', up);
            btn.removeEventListener('pointerleave', up);
            btn.classList.remove('active');
        });
        this.handlers = [];
    }
}

// Глобальный экземпляр
window.mobileControls = new MobileControlsManager();
