/**
 * Battle City - Современная реализация на чистом JS
 * Особенности: Псевдо-2.5D, Процедурный звук, Адаптивный Fullscreen, Умная физика
 */

// --- Инициализация Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Базовое разрешение (логическое)
canvas.width = 800;
canvas.height = 600;

// --- Константы ---
const TILE_SIZE = 40;
const MAP_COLS = canvas.width / TILE_SIZE;
const MAP_ROWS = canvas.height / TILE_SIZE;

const GameState = {
    MENU: 'MENU',
    MODE_SELECT: 'MODE_SELECT',
    PLAYING: 'PLAYING',
    COOPERATIVE: 'COOPERATIVE',
    VERSUS: 'VERSUS',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
};

const GameMode = {
    SINGLE: 'SINGLE',
    COOPERATIVE: 'COOPERATIVE', 
    VERSUS: 'VERSUS'
};

const ControlSchemes = {
    PLAYER1: {
        up: 'KeyW',
        down: 'KeyS', 
        left: 'KeyA',
        right: 'KeyD',
        shoot: 'Space'
    },
    PLAYER2: {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft', 
        right: 'ArrowRight',
        shoot: 'Enter'
    }
};

const Tile = {
    EMPTY: 0,
    BRICK: 1,
    STEEL: 2
};

const AIState = {
    PATROL: 'PATROL',
    ATTACK_BASE: 'ATTACK_BASE',
    ATTACK_PLAYER: 'ATTACK_PLAYER'
};

let enemiesFrozenTimer = 0;

// --- Менеджер звука (Web Audio API) ---
class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playShoot() { this.playTone(440, 110, 0.1, 'square'); }
    playExplosion() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
    playPowerup() { this.playTone(200, 800, 0.3, 'sine'); }
    playGameOver() { this.playTone(150, 50, 1.0, 'square'); }

    playTone(startFreq, endFreq, duration, type) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
}

const sounds = new SoundManager();

// --- Multiplayer Session Management ---
class MultiplayerSession {
    constructor(mode) {
        this.mode = mode;
        this.players = [];
        this.sharedLives = mode === GameMode.COOPERATIVE ? 6 : null;
        this.sharedScore = mode === GameMode.COOPERATIVE ? 0 : null;
        this.winner = null;
        this.startTime = Date.now();
    }

    addPlayer(playerId, controlScheme, color) {
        const newPlayer = new MultiplayerPlayer(playerId, controlScheme, color);
        this.players.push(newPlayer);
        return newPlayer;
    }

    getSharedScore() {
        return this.mode === GameMode.COOPERATIVE ? this.sharedScore : null;
    }

    addScore(points, playerId = null) {
        if (this.mode === GameMode.COOPERATIVE) {
            this.sharedScore += points;
        } else if (playerId !== null) {
            const player = this.players.find(p => p.playerId === playerId);
            if (player) {
                player.individualScore += points;
            }
        }
    }

    loseLife(playerId = null) {
        if (this.mode === GameMode.COOPERATIVE) {
            this.sharedLives = Math.max(0, this.sharedLives - 1);
            return this.sharedLives > 0;
        } else if (playerId !== null) {
            const player = this.players.find(p => p.playerId === playerId);
            if (player) {
                player.lives = Math.max(0, player.lives - 1);
                return player.lives > 0;
            }
        }
        return false;
    }

    checkGameEndConditions() {
        if (this.mode === GameMode.COOPERATIVE) {
            return this.sharedLives <= 0;
        } else {
            const alivePlayers = this.players.filter(p => p.lives > 0);
            if (alivePlayers.length <= 1) {
                if (alivePlayers.length === 1) {
                    this.winner = alivePlayers[0].playerId;
                }
                return true;
            }
        }
        return false;
    }
}

// --- Enhanced Player Class for Multiplayer ---
// (Будет объявлен после класса Player)

// --- Player Manager Class ---
class PlayerManager {
    constructor() {
        this.players = [];
        this.gameMode = GameMode.SINGLE;
    }

    createPlayers(mode) {
        this.gameMode = mode;
        this.players = [];

        if (mode === GameMode.SINGLE) {
            // Создаем обычного игрока для одиночной игры
            player = new Player();
            this.players = [player];
        } else {
            // Создаем мультиплеерную сессию
            multiplayerSession = new MultiplayerSession(mode);
            
            // Делаем сессию глобально доступной
            window.multiplayerSession = multiplayerSession;
            
            // Создаем двух игроков
            const player1 = multiplayerSession.addPlayer(1, ControlSchemes.PLAYER1, '#4CAF50'); // Зеленый
            const player2 = multiplayerSession.addPlayer(2, ControlSchemes.PLAYER2, '#2196F3'); // Синий
            
            // Позиционируем игроков
            this.positionPlayersForMultiplayer(player1, player2);
            
            this.players = [player1, player2];
            players = this.players;
            
            console.log(`Multiplayer session created:`, multiplayerSession);
            console.log(`Players created:`, this.players);
        }
    }

    positionPlayersForMultiplayer(player1, player2) {
        const bc = Math.floor(MAP_COLS / 2);
        
        // Player 1 слева от центра
        player1.x = (bc - 2) * TILE_SIZE + (TILE_SIZE - player1.width) / 2;
        player1.y = (MAP_ROWS - 4) * TILE_SIZE + (TILE_SIZE - player1.height) / 2;
        
        // Player 2 справа от центра
        player2.x = (bc + 2) * TILE_SIZE + (TILE_SIZE - player2.width) / 2;
        player2.y = (MAP_ROWS - 4) * TILE_SIZE + (TILE_SIZE - player2.height) / 2;
    }

    updatePlayers(dt) {
        for (const player of this.players) {
            if (player.isActive) {
                player.update(dt);
            }
        }
        
        if (this.gameMode !== GameMode.SINGLE) {
            this.handlePlayerCollisions();
        }
    }

    handlePlayerCollisions() {
        // Предотвращаем наложение игроков друг на друга
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                const p1 = this.players[i];
                const p2 = this.players[j];
                
                if (p1.isActive && p2.isActive) {
                    const margin = 4;
                    if (rectIntersect(
                        p1.x + margin, p1.y + margin, p1.width - 2*margin, p1.height - 2*margin,
                        p2.x + margin, p2.y + margin, p2.width - 2*margin, p2.height - 2*margin
                    )) {
                        // Разделяем игроков
                        const dx = p2.x - p1.x;
                        const dy = p2.y - p1.y;
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        
                        if (distance > 0) {
                            const pushDistance = (p1.width + margin) / 2;
                            const pushX = (dx / distance) * pushDistance;
                            const pushY = (dy / distance) * pushDistance;
                            
                            p1.x -= pushX / 2;
                            p1.y -= pushY / 2;
                            p2.x += pushX / 2;
                            p2.y += pushY / 2;
                        }
                    }
                }
            }
        }
    }

    checkGameEndConditions() {
        if (!multiplayerSession) return false;
        return multiplayerSession.checkGameEndConditions();
    }

    getActivePlayers() {
        return this.players.filter(p => p.isActive);
    }
}

// --- Вспомогательные функции ---
function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

// --- Классы сущностей ---

class Bullet {
    constructor(x, y, angle, ownerType, shooterId = null) {
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 6;
        this.speed = 450;
        this.angle = angle;
        this.ownerType = ownerType;
        this.shooterId = shooterId; // ID игрока, который выстрелил
        this.active = true;
    }

    update(dt) {
        const rad = this.angle * Math.PI / 180;
        this.x += Math.sin(rad) * this.speed * dt;
        this.y -= Math.cos(rad) * this.speed * dt;

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.active = false;
        }

        const tile = map.getTileAt(this.x, this.y);
        if (tile && tile.type !== Tile.EMPTY) {
            if (tile.type === Tile.BRICK) {
                map.setTile(tile.row, tile.col, Tile.EMPTY);
                sounds.playExplosion();
            }
            this.active = false;
        }

        if (this.active && rectIntersect(this.x - 3, this.y - 3, 6, 6, base.x, base.y, base.width, base.height)) {
            base.destroy();
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.ownerType === 'player' ? '#fff' : '#ff0';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Tank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32; 
        this.height = 32;
        this.angle = 0;
        this.speed = 130;
        this.active = true;
        this.shootTimer = 0;
        this.shootCooldown = 0.6;
    }

    canMove(nx, ny, isPlayer = false) {
        // Margin для стен (6px) - дает свободу в проходах
        const wallMargin = 6;
        const cx = nx + wallMargin;
        const cy = ny + wallMargin;
        const cw = this.width - wallMargin * 2;
        const ch = this.height - wallMargin * 2;

        // 1. Границы холста
        if (nx < 0 || nx + this.width > canvas.width || ny < 0 || ny + this.height > canvas.height) return false;
        
        // 2. Коллизия с картой (стены)
        if (map.checkCollision(cx, cy, cw, ch)) return false;
        
        // 3. Коллизия с базой
        if (rectIntersect(cx, cy, cw, ch, base.x, base.y, base.width, base.height)) return false;

        // 4. Коллизия с другими танками (используем небольшое наложение для плавности)
        const tankMargin = 4;
        if (isPlayer) {
            for (let e of enemies) {
                if (e.active && rectIntersect(nx + tankMargin, ny + tankMargin, this.width - tankMargin*2, this.height - tankMargin*2, e.x + tankMargin, e.y + tankMargin, e.width - tankMargin*2, e.height - tankMargin*2)) return false;
            }
        } else {
            // Проверяем столкновения с игроками (для врагов)
            if (currentGameMode === GameMode.SINGLE && player) {
                // Одиночная игра
                if (rectIntersect(nx + tankMargin, ny + tankMargin, this.width - tankMargin*2, this.height - tankMargin*2, player.x + tankMargin, player.y + tankMargin, player.width - tankMargin*2, player.height - tankMargin*2)) return false;
            } else if (players && players.length > 0) {
                // Мультиплеер
                for (let p of players) {
                    if (p.isActive && rectIntersect(nx + tankMargin, ny + tankMargin, this.width - tankMargin*2, this.height - tankMargin*2, p.x + tankMargin, p.y + tankMargin, p.width - tankMargin*2, p.height - tankMargin*2)) return false;
                }
            }
            
            // Проверяем столкновения с другими врагами
            for (let e of enemies) {
                if (e !== this && e.active && rectIntersect(nx + tankMargin, ny + tankMargin, this.width - tankMargin*2, this.height - tankMargin*2, e.x + tankMargin, e.y + tankMargin, e.width - tankMargin*2, e.height - tankMargin*2)) return false;
            }
        }
        return true;
    }

    // Новый метод для безопасного движения с предотвращением застревания
    safeMove(targetX, targetY) {
        const originalX = this.x;
        const originalY = this.y;
        
        // Пробуем переместиться к целевой позиции
        if (this.canMove(targetX, targetY, true)) {
            this.x = targetX;
            this.y = targetY;
            return true;
        }
        
        // Если не можем двигаться к цели, пробуем частичное движение
        const stepSize = 2; // Размер шага для поиска свободного места
        const maxSteps = 10; // Максимальное количество попыток
        
        // Пробуем двигаться по X
        if (Math.abs(targetX - originalX) > 0.1) {
            const dirX = targetX > originalX ? 1 : -1;
            for (let i = 1; i <= maxSteps; i++) {
                const testX = originalX + (dirX * stepSize * i);
                if (this.canMove(testX, originalY, true)) {
                    this.x = testX;
                    return true;
                }
            }
        }
        
        // Пробуем двигаться по Y
        if (Math.abs(targetY - originalY) > 0.1) {
            const dirY = targetY > originalY ? 1 : -1;
            for (let i = 1; i <= maxSteps; i++) {
                const testY = originalY + (dirY * stepSize * i);
                if (this.canMove(originalX, testY, true)) {
                    this.y = testY;
                    return true;
                }
            }
        }
        
        // Если застряли, пытаемся найти ближайшее свободное место
        return this.unstuck();
    }

    // Метод для выхода из застревания
    unstuck() {
        const originalX = this.x;
        const originalY = this.y;
        const searchRadius = 20;
        const step = 4;
        
        // Ищем свободное место в радиусе вокруг текущей позиции
        for (let radius = step; radius <= searchRadius; radius += step) {
            // Проверяем 8 направлений
            const directions = [
                {x: 0, y: -radius},    // вверх
                {x: radius, y: 0},     // вправо
                {x: 0, y: radius},     // вниз
                {x: -radius, y: 0},    // влево
                {x: radius, y: -radius}, // вверх-вправо
                {x: radius, y: radius},  // вниз-вправо
                {x: -radius, y: radius}, // вниз-влево
                {x: -radius, y: -radius} // вверх-влево
            ];
            
            for (let dir of directions) {
                const testX = originalX + dir.x;
                const testY = originalY + dir.y;
                
                if (this.canMove(testX, testY, true)) {
                    this.x = testX;
                    this.y = testY;
                    return true;
                }
            }
        }
        
        return false; // Не удалось найти свободное место
    }

    shoot(ownerType, shooterId = null) {
        if (this.shootTimer <= 0) {
            const bx = this.x + this.width / 2;
            const by = this.y + this.height / 2;
            bullets.push(new Bullet(bx, by, this.angle, ownerType, shooterId));
            this.shootTimer = this.shootCooldown;
            if (ownerType === 'player') sounds.playShoot();
        }
    }

    drawTank(ctx, color, barrelColor) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle * Math.PI / 180);
        ctx.fillStyle = color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.width / 2 - 2, -this.height / 2, 6, this.height);
        ctx.fillRect(this.width / 2 - 4, -this.height / 2, 6, this.height);
        ctx.fillStyle = barrelColor;
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillRect(-3, -this.height / 2 - 5, 6, 15);
        ctx.restore();
    }
}

class Player extends Tank {
    constructor() {
        super(0, 0);
        this.lives = 3;
        this.score = 0;
        this.shieldTimer = 0;
        this.respawn();
    }

    respawn() {
        const bc = Math.floor(MAP_COLS / 2);
        let spawnX = bc * TILE_SIZE + (TILE_SIZE - this.width) / 2;
        let spawnY = (MAP_ROWS - 4) * TILE_SIZE + (TILE_SIZE - this.height) / 2;
        
        // Проверяем, что место респавна свободно
        if (this.canMove(spawnX, spawnY, true)) {
            this.x = spawnX;
            this.y = spawnY;
        } else {
            // Если место занято, пробуем сместиться немного
            for (let offset = 10; offset <= 40; offset += 10) {
                if (this.canMove(spawnX - offset, spawnY, true)) {
                    this.x = spawnX - offset;
                    this.y = spawnY;
                    break;
                } else if (this.canMove(spawnX + offset, spawnY, true)) {
                    this.x = spawnX + offset;
                    this.y = spawnY;
                    break;
                } else if (this.canMove(spawnX, spawnY - offset, true)) {
                    this.x = spawnX;
                    this.y = spawnY - offset;
                    break;
                }
            }
        }
        
        this.angle = 0;
        this.shieldTimer = 3;
    }

    update(dt) {
        if (this.shootTimer > 0) this.shootTimer -= dt;
        if (this.shieldTimer > 0) this.shieldTimer -= dt;

        let dx = 0, dy = 0, isMoving = false;
        let requestedAngle = this.angle;

        // 1. Определение направления - поддерживаем как клавиатуру, так и мобильные контролы
        if (keys['ArrowUp'] || keys['KeyW']) { 
            dy = -1; 
            requestedAngle = 0; 
            isMoving = true; 
        }
        else if (keys['ArrowDown'] || keys['KeyS']) { 
            dy = 1; 
            requestedAngle = 180; 
            isMoving = true; 
        }
        else if (keys['ArrowLeft'] || keys['KeyA']) { 
            dx = -1; 
            requestedAngle = 270; 
            isMoving = true; 
        }
        else if (keys['ArrowRight'] || keys['KeyD']) { 
            dx = 1; 
            requestedAngle = 90; 
            isMoving = true; 
        }

        if (isMoving) {
            // Упрощенное движение без сложной логики
            this.angle = requestedAngle;
            
            let nx = this.x + dx * this.speed * dt;
            let ny = this.y + dy * this.speed * dt;

            if (this.canMove(nx, ny, true)) {
                this.x = nx;
                this.y = ny;
            }
        }

        if (keys['Space']) this.shoot('player');
    }

    draw(ctx) {
        this.drawTank(ctx, '#2e7d32', '#1b5e20');
        if (this.shieldTimer > 0) {
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.8, 0, Math.PI * 2);
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

// --- Enhanced Player Class for Multiplayer ---
class MultiplayerPlayer extends Player {
    constructor(playerId, controlScheme, color) {
        super();
        this.playerId = playerId;
        this.controlScheme = controlScheme;
        this.color = color;
        this.individualScore = 0;
        this.isActive = true;
    }

    setControlScheme(scheme) {
        this.controlScheme = scheme;
    }

    setPlayerColor(color) {
        this.color = color;
    }

    canShootPlayer(targetPlayer) {
        if (!multiplayerSession) return false;
        
        // В кооперативном режиме игроки не могут стрелять друг в друга
        if (multiplayerSession.mode === GameMode.COOPERATIVE) {
            return false;
        }
        
        // В соревновательном режиме игроки могут стрелять друг в друга
        return multiplayerSession.mode === GameMode.VERSUS;
    }

    update(dt) {
        if (this.shootTimer > 0) this.shootTimer -= dt;
        if (this.shieldTimer > 0) this.shieldTimer -= dt;

        let dx = 0, dy = 0, isMoving = false;
        let requestedAngle = this.angle;

        // Используем схему управления для конкретного игрока
        const controls = this.controlScheme;
        
        // 1. Определение направления (приоритет последнего нажатия)
        if (keys[controls.up]) { dy = -1; requestedAngle = 0; isMoving = true; }
        else if (keys[controls.down]) { dy = 1; requestedAngle = 180; isMoving = true; }
        else if (keys[controls.left]) { dx = -1; requestedAngle = 270; isMoving = true; }
        else if (keys[controls.right]) { dx = 1; requestedAngle = 90; isMoving = true; }

        if (isMoving) {
            const snapSize = TILE_SIZE / 2; // 20px
            const centerOffset = (TILE_SIZE - this.width) / 2; // 4px

            // 2. Grid Snapping при смене направления (мгновенное центрирование)
            if (requestedAngle !== this.angle) {
                if (requestedAngle === 0 || requestedAngle === 180) {
                    const targetX = Math.round((this.x - centerOffset) / snapSize) * snapSize + centerOffset;
                    this.safeMove(targetX, this.y);
                } else {
                    const targetY = Math.round((this.y - centerOffset) / snapSize) * snapSize + centerOffset;
                    this.safeMove(this.x, targetY);
                }
                this.angle = requestedAngle;
            }

            // 3. Попытка основного движения с использованием безопасного перемещения
            let nx = this.x + dx * this.speed * dt;
            let ny = this.y + dy * this.speed * dt;

            if (!this.safeMove(nx, ny)) {
                // 4. Улучшенная Sliding Logic: доводка до центра "коридора" при блокировке
                const alignSpeed = this.speed * dt * 1.8;
                if (dy !== 0) { // Движение по вертикали, выравниваем горизонталь
                    const targetX = Math.round((this.x - centerOffset) / snapSize) * snapSize + centerOffset;
                    const diff = targetX - this.x;
                    if (Math.abs(diff) > 0.5 && Math.abs(diff) < 18) {
                        const step = (diff > 0) ? Math.min(alignSpeed, diff) : Math.max(-alignSpeed, diff);
                        this.safeMove(this.x + step, this.y);
                    }
                }
                if (dx !== 0) { // Движение по горизонтали, выравниваем вертикаль
                    const targetY = Math.round((this.y - centerOffset) / snapSize) * snapSize + centerOffset;
                    const diff = targetY - this.y;
                    if (Math.abs(diff) > 0.5 && Math.abs(diff) < 18) {
                        const step = (diff > 0) ? Math.min(alignSpeed, diff) : Math.max(-alignSpeed, diff);
                        this.safeMove(this.x, this.y + step);
                    }
                }
            }
        }

        // Стрельба с использованием схемы управления
        if (keys[controls.shoot] && this.shootTimer <= 0) {
            this.shoot('player', this.playerId);
        }
    }

    draw(ctx) {
        // Рисуем танк с цветом игрока
        const barrelColor = this.color === '#4CAF50' ? '#2E7D32' : '#1565C0';
        super.drawTank(ctx, this.color, barrelColor);
        
        // Рисуем щит если активен
        if (this.shieldTimer > 0) {
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.8, 0, Math.PI * 2);
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

class Enemy extends Tank {
    constructor(x, y, type) {
        super(x, y);
        this.type = type;
        this.aiState = AIState.PATROL;
        this.dirTimer = 0;
        if (type === 'fast') this.speed = 170;
        if (type === 'armored') this.health = 3; else this.health = 1;
    }

    update(dt) {
        if (this.shootTimer > 0) this.shootTimer -= dt;
        if (enemiesFrozenTimer > 0) return;
        this.dirTimer -= dt;

        if (Math.random() < 0.005) {
            const rand = Math.random();
            if (rand < 0.7) this.aiState = AIState.ATTACK_BASE;
            else if (rand < 0.9) this.aiState = AIState.PATROL;
            else this.aiState = AIState.ATTACK_PLAYER;
        }

        if (this.dirTimer <= 0) {
            this.updateAIDirection();
            this.dirTimer = 1.5 + Math.random() * 2;
        }

        const rad = this.angle * Math.PI / 180;
        const nx = this.x + Math.sin(rad) * this.speed * dt;
        const ny = this.y - Math.cos(rad) * this.speed * dt;

        if (this.canMove(nx, ny, false)) {
            this.x = nx;
            this.y = ny;
        } else {
            this.dirTimer = 0; // Немедленная смена курса при столкновении
            const checkX = nx + Math.sin(rad) * 15;
            const checkY = ny - Math.cos(rad) * 15;
            const tile = map.getTileAt(checkX, checkY);
            if (tile && tile.type === Tile.BRICK) this.shoot('enemy');
        }
        if (Math.random() < 0.015) this.shoot('enemy');
    }

    updateAIDirection() {
        let targetX = base.x, targetY = base.y;
        if (this.aiState === AIState.ATTACK_PLAYER) { 
            // В мультиплеере выбираем ближайшего активного игрока
            if (currentGameMode === GameMode.SINGLE && player) {
                targetX = player.x; 
                targetY = player.y;
            } else if (players && players.length > 0) {
                let closestPlayer = null;
                let closestDistance = Infinity;
                
                for (let p of players) {
                    if (p.isActive) {
                        const distance = Math.sqrt((p.x - this.x) ** 2 + (p.y - this.y) ** 2);
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestPlayer = p;
                        }
                    }
                }
                
                if (closestPlayer) {
                    targetX = closestPlayer.x;
                    targetY = closestPlayer.y;
                }
            }
        }
        if (this.aiState === AIState.PATROL) {
            const dirs = [0, 90, 180, 270];
            this.angle = dirs[Math.floor(Math.random() * dirs.length)];
        } else {
            const dx = targetX - this.x, dy = targetY - this.y;
            if (Math.abs(dx) > Math.abs(dy)) this.angle = dx > 0 ? 90 : 270;
            else this.angle = dy > 0 ? 180 : 0;
        }
    }

    draw(ctx) {
        let color = '#c62828';
        if (this.type === 'fast') color = '#f9a825';
        if (this.type === 'armored') color = '#4e342e';
        this.drawTank(ctx, color, '#212121');
    }
}

class GameMap {
    constructor() { this.tiles = []; this.generate(); }
    generate() {
        for (let r = 0; r < MAP_ROWS; r++) {
            this.tiles[r] = [];
            for (let c = 0; c < MAP_COLS; c++) {
                if (r < 2 || r > MAP_ROWS - 5 || c < 2 || c > MAP_COLS - 3) {
                    this.tiles[r][c] = Tile.EMPTY;
                    continue;
                }
                const rand = Math.random();
                if (rand < 0.2) this.tiles[r][c] = Tile.BRICK;
                else if (rand < 0.05) this.tiles[r][c] = Tile.STEEL;
                else this.tiles[r][c] = Tile.EMPTY;
            }
        }
        const br = MAP_ROWS - 2, bc = Math.floor(MAP_COLS / 2);
        this.tiles[br][bc-1] = Tile.BRICK; this.tiles[br-1][bc-1] = Tile.BRICK;
        this.tiles[br-1][bc] = Tile.BRICK; this.tiles[br-1][bc+1] = Tile.BRICK;
        this.tiles[br][bc+1] = Tile.BRICK;
    }
    getTileAt(x, y) {
        const c = Math.floor(x / TILE_SIZE), r = Math.floor(y / TILE_SIZE);
        if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) return { type: this.tiles[r][c], row: r, col: c };
        return null;
    }
    setTile(r, c, type) { if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) this.tiles[r][c] = type; }
    checkCollision(x, y, w, h) {
        // Precision epsilon (0.5) для предотвращения "липкости" на стыках тайлов
        const eps = 0.5;
        const x1 = Math.floor((x + eps) / TILE_SIZE);
        const x2 = Math.floor((x + w - eps) / TILE_SIZE);
        const y1 = Math.floor((y + eps) / TILE_SIZE);
        const y2 = Math.floor((y + h - eps) / TILE_SIZE);
        for (let r = y1; r <= y2; r++) {
            for (let c = x1; c <= x2; c++) {
                if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
                    if (this.tiles[r][c] !== Tile.EMPTY) return true;
                }
            }
        }
        return false;
    }
    draw(ctx) {
        for (let r = 0; r < MAP_ROWS; r++) {
            for (let c = 0; c < MAP_COLS; c++) {
                if (this.tiles[r][c] === Tile.EMPTY) continue;
                const x = c * TILE_SIZE, y = r * TILE_SIZE;
                if (this.tiles[r][c] === Tile.BRICK) {
                    ctx.fillStyle = '#a52a2a'; ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    ctx.strokeStyle = '#5d1a1a'; ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                } else {
                    ctx.fillStyle = '#999'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#eee'; ctx.strokeRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                }
            }
        }
    }
}

class Base {
    constructor() {
        this.width = TILE_SIZE; this.height = TILE_SIZE;
        this.x = Math.floor(MAP_COLS / 2) * TILE_SIZE; this.y = (MAP_ROWS - 2) * TILE_SIZE;
        this.alive = true;
    }
    destroy() { if (this.alive) { this.alive = false; sounds.playExplosion(); gameOver(); } }
    draw(ctx) {
        ctx.fillStyle = this.alive ? '#ffd700' : '#333';
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 5); ctx.lineTo(this.x + 35, this.y + 35);
        ctx.lineTo(this.x + 5, this.y + 35); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.stroke();
    }
}

class WaveManager {
    constructor() { this.wave = 0; this.toSpawn = 0; this.timer = 0; }
    update(dt) {
        if (this.toSpawn > 0) {
            this.timer -= dt;
            if (this.timer <= 0) { this.spawn(); this.timer = 2; this.toSpawn--; }
        } else if (enemies.length === 0) { this.wave++; this.toSpawn = 3 + this.wave * 2; this.timer = 3; }
    }
    spawn() {
        const points = [{x: 40, y: 40}, {x: canvas.width / 2 - 20, y: 40}, {x: canvas.width - 80, y: 40}];
        const p = points[Math.floor(Math.random() * points.length)];
        const types = ['normal', 'fast', 'armored'];
        const type = types[Math.floor(Math.random() * Math.min(types.length, this.wave))];
        enemies.push(new Enemy(p.x, p.y, type));
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.width = 30; this.height = 30;
        this.type = type; this.active = true; this.timer = 10;
    }
    update(dt) { this.timer -= dt; if (this.timer <= 0) this.active = false; }
    apply(p) {
        sounds.playPowerup();
        switch(this.type) {
            case 'shield': 
                p.shieldTimer = 10; 
                break;
            case 'life': 
                if (multiplayerSession && multiplayerSession.mode === GameMode.COOPERATIVE) {
                    // В кооперативе добавляем жизнь к общему пулу
                    multiplayerSession.sharedLives++;
                } else {
                    // В одиночной игре или versus режиме добавляем жизнь конкретному игроку
                    p.lives++;
                }
                break;
            case 'rapid': 
                p.shootCooldown = 0.25; 
                setTimeout(() => { p.shootCooldown = 0.6; }, 10000); 
                break;
            case 'freeze': 
                enemiesFrozenTimer = 5; 
                break;
        }
    }
    draw(ctx) {
        const colors = { shield: '#00f', life: '#f0f', rapid: '#f00', freeze: '#0ff' };
        ctx.fillStyle = colors[this.type] || '#ff0';
        ctx.beginPath(); ctx.arc(this.x + 15, this.y + 15, 14, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(this.type[0].toUpperCase(), this.x + 15, this.y + 20);
    }
}

// --- Глобальные переменные и управление ---
let player, map, base, waveManager, playerManager;
let bullets = [], enemies = [], powerUps = [];
let currentGameState = GameState.MENU;
let currentGameMode = GameMode.SINGLE;
let players = [];
let multiplayerSession = null;
let keys = {};
let lastTime = 0;
let isPaused = false;
let pauseStartTime = 0;

// Диагностика мобильных контролов
function debugMobileControls() {
    console.log('[Game] Mobile controls debug:');
    console.log('- keys object:', keys);
    console.log('- mobileControlsManager:', window.mobileControlsManager);
    
    if (window.mobileControlsManager) {
        console.log('- isEnabled:', window.mobileControlsManager.isEnabled);
        console.log('- initialized:', window.mobileControlsManager.initialized);
        console.log('- activeControls:', window.mobileControlsManager.activeControls);
    }
    
    // Проверяем наличие кнопок
    const singleButtons = ['btn-up', 'btn-down', 'btn-left', 'btn-right', 'btn-shoot'];
    singleButtons.forEach(id => {
        const btn = document.getElementById(id);
        console.log(`- Button ${id}:`, btn ? 'Found' : 'Missing');
    });
}

// Делаем функцию глобально доступной
window.debugMobileControls = debugMobileControls;

// Функция для принудительного тестирования мобильных контролов
function forceMobileControlsTest() {
    console.log('[Game] Force testing mobile controls...');
    
    if (!window.mobileControlsManager) {
        console.error('[Game] mobileControlsManager not found!');
        return;
    }
    
    // Принудительно включаем мобильные контролы
    window.mobileControlsManager.isEnabled = true;
    window.mobileControlsManager.setGameMode('SINGLE');
    
    // Тестируем каждую кнопку
    const testButtons = ['btn-up', 'btn-down', 'btn-left', 'btn-right', 'btn-shoot'];
    const keyMapping = {
        'btn-up': 'ArrowUp',
        'btn-down': 'ArrowDown',
        'btn-left': 'ArrowLeft',
        'btn-right': 'ArrowRight',
        'btn-shoot': 'Space'
    };
    
    testButtons.forEach((buttonId, index) => {
        setTimeout(() => {
            const button = document.getElementById(buttonId);
            const keyCode = keyMapping[buttonId];
            
            if (button) {
                console.log(`[Game] Testing button ${buttonId} -> ${keyCode}`);
                
                // Симулируем нажатие
                keys[keyCode] = true;
                button.classList.add('active');
                
                setTimeout(() => {
                    keys[keyCode] = false;
                    button.classList.remove('active');
                    console.log(`[Game] Button ${buttonId} test complete`);
                }, 200);
            } else {
                console.error(`[Game] Button ${buttonId} not found!`);
            }
        }, index * 300);
    });
}

window.forceMobileControlsTest = forceMobileControlsTest;

// Функция для мониторинга клавиш в реальном времени
function monitorKeys() {
    console.log('[Game] Starting key monitoring...');
    
    const keyMonitor = setInterval(() => {
        const activeKeys = [];
        const testKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
        
        testKeys.forEach(key => {
            if (keys[key]) {
                activeKeys.push(key);
            }
        });
        
        if (activeKeys.length > 0) {
            console.log('[Game] Active keys:', activeKeys);
        }
    }, 100);
    
    // Останавливаем мониторинг через 30 секунд
    setTimeout(() => {
        clearInterval(keyMonitor);
        console.log('[Game] Key monitoring stopped');
    }, 30000);
    
    return keyMonitor;
}

window.monitorKeys = monitorKeys;

// Функция для тестирования видимости мобильных контролов
function testMobileControlsVisibility() {
    console.log('[Game] Testing mobile controls visibility...');
    
    const mobileControls = document.getElementById('mobile-controls');
    const singleControls = document.getElementById('single-player-controls');
    const multiControls = document.getElementById('multiplayer-controls');
    const gameControls = document.getElementById('universal-game-controls');
    
    console.log('Current game state:', currentGameState);
    console.log('Current game mode:', currentGameMode);
    console.log('Mobile controls container:', {
        element: mobileControls,
        display: mobileControls ? mobileControls.style.display : 'not found',
        hasShowClass: mobileControls ? mobileControls.classList.contains('show') : false
    });
    console.log('Single player controls:', {
        element: singleControls,
        display: singleControls ? singleControls.style.display : 'not found',
        hasHiddenClass: singleControls ? singleControls.classList.contains('hidden') : false
    });
    console.log('Multiplayer controls:', {
        element: multiControls,
        display: multiControls ? multiControls.style.display : 'not found',
        hasHiddenClass: multiControls ? multiControls.classList.contains('hidden') : false
    });
    console.log('Game controls:', {
        element: gameControls,
        display: gameControls ? gameControls.style.display : 'not found'
    });
}

window.testMobileControlsVisibility = testMobileControlsVisibility;

// Функция для принудительного тестирования мультиплеерных контролов
function forceTestMultiplayerControls() {
    console.log('[Game] Force testing multiplayer controls...');
    
    if (!window.mobileControlsManager) {
        console.error('[Game] mobileControlsManager not found!');
        return;
    }
    
    // Принудительно настраиваем мультиплеерные контролы
    window.mobileControlsManager.setGameMode('COOPERATIVE');
    
    // Тестируем каждую кнопку мультиплеера
    const multiplayerButtons = [
        { id: 'btn-p1-up', key: 'KeyW' },
        { id: 'btn-p1-down', key: 'KeyS' },
        { id: 'btn-p1-left', key: 'KeyA' },
        { id: 'btn-p1-right', key: 'KeyD' },
        { id: 'btn-p1-shoot', key: 'Space' },
        { id: 'btn-p2-up', key: 'ArrowUp' },
        { id: 'btn-p2-down', key: 'ArrowDown' },
        { id: 'btn-p2-left', key: 'ArrowLeft' },
        { id: 'btn-p2-right', key: 'ArrowRight' },
        { id: 'btn-p2-shoot', key: 'Enter' }
    ];
    
    multiplayerButtons.forEach((btn, index) => {
        setTimeout(() => {
            const button = document.getElementById(btn.id);
            
            if (button) {
                console.log(`[Game] Testing button ${btn.id} -> ${btn.key}`);
                
                // Симулируем нажатие
                keys[btn.key] = true;
                button.classList.add('active');
                
                setTimeout(() => {
                    keys[btn.key] = false;
                    button.classList.remove('active');
                    console.log(`[Game] Button ${btn.id} test complete`);
                }, 300);
            } else {
                console.error(`[Game] Button ${btn.id} not found!`);
            }
        }, index * 400);
    });
}

window.forceTestMultiplayerControls = forceTestMultiplayerControls;

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    
    // Обработка ESC - выход из игры
    if (e.code === 'Escape') {
        e.preventDefault();
        handleEscapeKey();
    }
    
    // Обработка Backspace - пауза
    if (e.code === 'Backspace') {
        e.preventDefault();
        handlePauseKey();
    }
    
    // Обработка F - полноэкранный режим (только если не в игре или игра на паузе)
    if (e.code === 'KeyF') {
        // Разрешаем F только в меню или на паузе
        if (currentGameState === GameState.MENU || 
            currentGameState === GameState.MODE_SELECT || 
            currentGameState === GameState.GAME_OVER ||
            currentGameState === GameState.PAUSED) {
            e.preventDefault();
            if (!document.fullscreenElement) {
                document.getElementById('game-container').requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    }
    
    // Блокируем стрелки во время игры, чтобы они не влияли на селектор языка
    if ((e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') &&
        (currentGameState === GameState.PLAYING || 
         currentGameState === GameState.COOPERATIVE || 
         currentGameState === GameState.VERSUS)) {
        e.preventDefault();
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

function handleEscapeKey() {
    // Выход из игры в зависимости от текущего состояния
    if (currentGameState === GameState.PLAYING || 
        currentGameState === GameState.COOPERATIVE || 
        currentGameState === GameState.VERSUS ||
        currentGameState === GameState.PAUSED) {
        
        // Возвращаемся в меню выбора режима для мультиплеера или главное меню для одиночной игры
        if (currentGameMode === GameMode.SINGLE) {
            returnToMainMenu();
        } else {
            returnToModeSelect();
        }
    } else if (currentGameState === GameState.MODE_SELECT) {
        // Из выбора режима возвращаемся в главное меню
        returnToMainMenu();
    } else if (currentGameState === GameState.GAME_OVER) {
        // Из Game Over возвращаемся в главное меню
        returnToMainMenu();
    }
}

function handlePauseKey() {
    // Пауза работает только во время игры
    if (currentGameState === GameState.PLAYING || 
        currentGameState === GameState.COOPERATIVE || 
        currentGameState === GameState.VERSUS) {
        togglePause();
    } else if (currentGameState === GameState.PAUSED) {
        togglePause();
    }
}

// Делаем функции глобально доступными
window.handleEscapeKey = handleEscapeKey;
window.handlePauseKey = handlePauseKey;

function togglePause() {
    if (isPaused) {
        // Снимаем паузу
        isPaused = false;
        pauseStartTime = 0;
        document.getElementById('pause-screen').classList.add('hidden');
        
        // Возобновляем аудио контекст если нужно
        if (sounds.ctx.state === 'suspended') {
            sounds.ctx.resume();
        }
    } else {
        // Ставим на паузу
        isPaused = true;
        pauseStartTime = Date.now();
        document.getElementById('pause-screen').classList.remove('hidden');
    }
    
    // Обновляем мобильные контролы
    updateMobileControls();
}

function returnToMainMenu() {
    // Очищаем игровое состояние
    isPaused = false;
    currentGameState = GameState.MENU;
    
    // Убираем класс game-active
    document.body.classList.remove('game-active');
    
    // Скрываем все экраны
    document.getElementById('mode-select-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('multiplayer-hud').classList.add('hidden');
    
    // Показываем главное меню
    document.getElementById('menu-screen').classList.remove('hidden');
    
    // Обновляем мобильные контролы
    updateMobileControls();
}

function returnToModeSelect() {
    // Очищаем игровое состояние
    isPaused = false;
    currentGameState = GameState.MODE_SELECT;
    
    // Убираем класс game-active
    document.body.classList.remove('game-active');
    
    // Скрываем все экраны кроме выбора режима
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('multiplayer-hud').classList.add('hidden');
    
    // Показываем экран выбора режима
    document.getElementById('mode-select-screen').classList.remove('hidden');
    
    // Обновляем мобильные контролы
    updateMobileControls();
}

// Функция для обновления мобильных контролов
function updateMobileControls() {
    if (window.mobileControlsManager) {
        window.mobileControlsManager.setGameState(currentGameState, currentGameMode);
    }
    
    if (window.virtualJoystick) {
        window.virtualJoystick.setGameState(currentGameState);
        window.virtualJoystick.setGameMode(currentGameMode);
    }
}

// Инициализация обработчиков событий после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем систему локализации
    i18n = new Localization();
    i18n.updateUI();
    
    // Устанавливаем текущий язык в селекторе
    document.getElementById('language-select').value = i18n.currentLanguage;
    
    // Обработчик смены языка
    document.getElementById('language-select').addEventListener('change', function(e) {
        i18n.setLanguage(e.target.value);
        updateGameTexts();
    });
    
    // Блокируем фокус на селекторе языка во время игры
    document.getElementById('language-select').addEventListener('focus', function(e) {
        if (currentGameState === GameState.PLAYING || 
            currentGameState === GameState.COOPERATIVE || 
            currentGameState === GameState.VERSUS) {
            e.target.blur(); // Убираем фокус
        }
    });
    
    // Блокируем клавиши стрелок на селекторе языка во время игры
    document.getElementById('language-select').addEventListener('keydown', function(e) {
        if (currentGameState === GameState.PLAYING || 
            currentGameState === GameState.COOPERATIVE || 
            currentGameState === GameState.VERSUS) {
            e.preventDefault();
            e.stopPropagation();
        }
    });

    document.getElementById('start-button').addEventListener('click', () => {
        currentGameState = GameState.MODE_SELECT;
        document.getElementById('menu-screen').classList.add('hidden');
        document.getElementById('mode-select-screen').classList.remove('hidden');
        
        // Обновляем мобильные контролы при переходе к выбору режима
        updateMobileControls();
    });

    document.getElementById('single-mode-btn').addEventListener('click', () => startGame(GameMode.SINGLE));
    document.getElementById('cooperative-mode-btn').addEventListener('click', () => startGame(GameMode.COOPERATIVE));
    document.getElementById('versus-mode-btn').addEventListener('click', () => startGame(GameMode.VERSUS));

    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
        currentGameState = GameState.MENU;
        document.getElementById('mode-select-screen').classList.add('hidden');
        document.getElementById('menu-screen').classList.remove('hidden');
        
        // Обновляем мобильные контролы при возврате в главное меню
        updateMobileControls();
    });

    document.getElementById('restart-button').addEventListener('click', () => {
        if (currentGameMode === GameMode.SINGLE) {
            startGame(GameMode.SINGLE);
        } else {
            currentGameState = GameState.MODE_SELECT;
            document.getElementById('game-over-screen').classList.add('hidden');
            document.getElementById('mode-select-screen').classList.remove('hidden');
        }
    });

    // Обработчики для экрана паузы
    document.getElementById('resume-button').addEventListener('click', () => {
        togglePause();
    });

    document.getElementById('pause-exit-button').addEventListener('click', () => {
        handleEscapeKey();
    });

    // Мобильные кнопки управления игрой
    const mobilePauseBtn = document.getElementById('mobile-pause-btn');
    const mobileExitBtn = document.getElementById('mobile-exit-btn');
    
    if (mobilePauseBtn) {
        mobilePauseBtn.addEventListener('click', () => {
            handlePauseKey();
        });
    }

    if (mobileExitBtn) {
        mobileExitBtn.addEventListener('click', () => {
            handleEscapeKey();
        });
    }

    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.onclick = () => {
            if (!document.fullscreenElement) document.getElementById('game-container').requestFullscreen();
            else document.exitFullscreen();
        };
    }
});

function resizeCanvas() {
    const container = document.getElementById('game-container');
    const containerRect = container.getBoundingClientRect();
    
    // Base canvas dimensions
    const baseWidth = 800;
    const baseHeight = 600;
    const aspectRatio = baseWidth / baseHeight;
    
    // Available space
    const availableWidth = containerRect.width;
    const availableHeight = containerRect.height;
    
    // Calculate optimal size
    let canvasWidth, canvasHeight;
    
    if (availableWidth / availableHeight > aspectRatio) {
        // Height is the limiting factor
        canvasHeight = Math.min(availableHeight * 0.85, availableHeight - 100);
        canvasWidth = canvasHeight * aspectRatio;
    } else {
        // Width is the limiting factor
        canvasWidth = Math.min(availableWidth * 0.95, availableWidth - 40);
        canvasHeight = canvasWidth / aspectRatio;
    }
    
    // Apply mobile-specific adjustments
    if (window.innerWidth <= 768) {
        canvasWidth = Math.min(canvasWidth, availableWidth * 0.98);
        canvasHeight = Math.min(canvasHeight, availableHeight * 0.75);
        
        // Maintain aspect ratio
        if (canvasWidth / canvasHeight > aspectRatio) {
            canvasWidth = canvasHeight * aspectRatio;
        } else {
            canvasHeight = canvasWidth / aspectRatio;
        }
    }
    
    // Landscape mobile adjustments
    if (window.innerHeight <= 500 && window.innerWidth > window.innerHeight) {
        canvasHeight = Math.min(canvasHeight, availableHeight * 0.9);
        canvasWidth = canvasHeight * aspectRatio;
    }
    
    // Apply the calculated size
    canvas.style.width = Math.floor(canvasWidth) + 'px';
    canvas.style.height = Math.floor(canvasHeight) + 'px';
    
    // Ensure canvas stays centered
    canvas.style.margin = 'auto';
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    // Delay resize to allow orientation change to complete
    setTimeout(resizeCanvas, 100);
});
resizeCanvas();

function startGame(gameMode = GameMode.SINGLE) {
    currentGameMode = gameMode;
    
    // Подключаем мобильные контролы для выбранного режима
    if (window.mobileControlsManager) {
        // Настраиваем контролы с задержкой, чтобы убедиться что DOM готов
        setTimeout(() => {
            window.mobileControlsManager.setGameMode(gameMode);
            console.log('[Game] Mobile controls setup for mode:', gameMode);
            
            // Дополнительная диагностика для мультиплеера
            if (gameMode === GameMode.COOPERATIVE || gameMode === GameMode.VERSUS) {
                setTimeout(() => {
                    console.log('[Game] Testing multiplayer controls...');
                    if (window.mobileControlsManager.testMultiplayerControls) {
                        window.mobileControlsManager.testMultiplayerControls();
                    }
                }, 1000);
            }
        }, 200);
    } else {
        console.warn('[Game] mobileControlsManager not found!');
    }
    
    // Подключаем виртуальный джойстик
    if (window.virtualJoystick) {
        window.virtualJoystick.setGameMode(gameMode);
        window.virtualJoystick.setGameState(currentGameState);
        console.log('[Game] Virtual joystick setup for mode:', gameMode);
    }
    
    // Диагностика мобильных контролов
    setTimeout(() => {
        debugMobileControls();
    }, 500);
    
    // Добавляем класс для скрытия селектора языка
    document.body.classList.add('game-active');
    
    // Очищаем предыдущую сессию
    multiplayerSession = null;
    players = [];
    player = null;
    
    // Порядок критичен: сначала карта и база, потом игрок (для respawn)
    map = new GameMap();
    base = new Base();
    
    // Создаем PlayerManager и инициализируем игроков
    playerManager = new PlayerManager();
    playerManager.createPlayers(gameMode);
    
    console.log(`Game started with mode: ${gameMode}`);
    console.log(`MultiplayerSession:`, multiplayerSession);
    console.log(`Players:`, players);
    
    waveManager = new WaveManager();
    
    bullets = [];
    enemies = [];
    powerUps = [];
    enemiesFrozenTimer = 0;
    
    // Устанавливаем соответствующее состояние игры
    if (gameMode === GameMode.SINGLE) {
        currentGameState = GameState.PLAYING;
    } else if (gameMode === GameMode.COOPERATIVE) {
        currentGameState = GameState.COOPERATIVE;
    } else if (gameMode === GameMode.VERSUS) {
        currentGameState = GameState.VERSUS;
    }
    
    // Обновляем мобильные контролы
    updateMobileControls();
    
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('mode-select-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    if (sounds.ctx.state === 'suspended') sounds.ctx.resume();
}

function gameOver() {
    currentGameState = GameState.GAME_OVER;
    
    // Убираем класс game-active
    document.body.classList.remove('game-active');
    
    document.getElementById('game-over-screen').classList.remove('hidden');
    
    // Обновляем заголовок
    updateGameOverTitle();
    
    // Обновляем текст в зависимости от режима игры
    let finalText = '';
    if (currentGameMode === GameMode.SINGLE && player) {
        finalText = `${i18n.get('score')}: ${player.score}`;
    } else if (multiplayerSession) {
        if (multiplayerSession.mode === GameMode.COOPERATIVE) {
            finalText = `${i18n.get('teamScore')}: ${multiplayerSession.sharedScore}`;
        } else if (multiplayerSession.mode === GameMode.VERSUS) {
            if (multiplayerSession.winner) {
                const winnerPlayer = players.find(p => p.playerId === multiplayerSession.winner);
                finalText = `${i18n.get('score')}: ${winnerPlayer.individualScore}`;
            } else {
                finalText = i18n.get('drawGame');
            }
        }
    }
    
    document.getElementById('final-score').innerHTML = finalText;
    sounds.playGameOver();
}

function update(dt) {
    if (currentGameState === GameState.MENU || currentGameState === GameState.MODE_SELECT || currentGameState === GameState.GAME_OVER) return;
    
    // Если игра на паузе, не обновляем игровую логику
    if (isPaused || currentGameState === GameState.PAUSED) return;
    
    // Обновляем игроков
    if (currentGameMode === GameMode.SINGLE) {
        // В одиночной игре обновляем напрямую player
        if (player) {
            player.update(dt);
        }
    } else {
        // В мультиплеере используем PlayerManager
        if (playerManager) {
            playerManager.updatePlayers(dt);
        }
    }
    
    waveManager.update(dt);
    if (enemiesFrozenTimer > 0) enemiesFrozenTimer -= dt;
    bullets.forEach(b => b.update(dt)); 
    enemies.forEach(e => e.update(dt)); 
    powerUps.forEach(p => p.update(dt));

    bullets.forEach(b => {
        if (!b.active) return;
        if (b.ownerType === 'player') {
            // Столкновения пуль игроков с врагами
            enemies.forEach(e => {
                if (e.active && rectIntersect(b.x-3, b.y-3, 6, 6, e.x, e.y, e.width, e.height)) {
                    b.active = false; 
                    e.health--;
                    if (e.health <= 0) {
                        e.active = false; 
                        sounds.playExplosion();
                        
                        // Начисляем очки в зависимости от режима игры
                        if (multiplayerSession) {
                            if (multiplayerSession.mode === GameMode.COOPERATIVE) {
                                multiplayerSession.addScore(100);
                            } else if (multiplayerSession.mode === GameMode.VERSUS) {
                                // Найдем игрока, который выстрелил (по ID пули)
                                const shooterPlayer = players.find(p => p.playerId === b.shooterId);
                                if (shooterPlayer) {
                                    multiplayerSession.addScore(100, shooterPlayer.playerId);
                                }
                            }
                        } else if (player) {
                            player.score += 100;
                        }
                        
                        // Генерируем power-up
                        if (Math.random() < 0.2) {
                            const types = ['shield', 'life', 'rapid', 'freeze'];
                            powerUps.push(new PowerUp(e.x, e.y, types[Math.floor(Math.random()*4)]));
                        }
                    }
                }
            });
            
            // Столкновения пуль игроков с другими игроками (только в versus режиме)
            if (multiplayerSession && multiplayerSession.mode === GameMode.VERSUS) {
                players.forEach(targetPlayer => {
                    if (targetPlayer.isActive && targetPlayer.shieldTimer <= 0 && 
                        targetPlayer.playerId !== b.shooterId &&
                        rectIntersect(b.x-3, b.y-3, 6, 6, targetPlayer.x, targetPlayer.y, targetPlayer.width, targetPlayer.height)) {
                        
                        b.active = false;
                        sounds.playExplosion();
                        
                        // Наносим урон цели
                        const hasLives = multiplayerSession.loseLife(targetPlayer.playerId);
                        if (!hasLives) {
                            targetPlayer.isActive = false;
                        } else {
                            targetPlayer.respawn();
                        }
                        
                        // Даем бонусные очки стрелку
                        multiplayerSession.addScore(200, b.shooterId);
                        
                        // Проверяем условия окончания игры
                        if (multiplayerSession.checkGameEndConditions()) {
                            gameOver();
                        }
                    }
                });
            }
        } else {
            // Столкновения пуль врагов с игроками
            if (currentGameMode === GameMode.SINGLE && player) {
                // Одиночная игра
                if (player.shieldTimer <= 0 && rectIntersect(b.x-3, b.y-3, 6, 6, player.x, player.y, player.width, player.height)) {
                    b.active = false; 
                    player.lives--; 
                    sounds.playExplosion();
                    if (player.lives <= 0) gameOver(); 
                    else player.respawn();
                }
            } else if (players) {
                // Мультиплеер
                players.forEach(targetPlayer => {
                    if (targetPlayer.isActive && targetPlayer.shieldTimer <= 0 &&
                        rectIntersect(b.x-3, b.y-3, 6, 6, targetPlayer.x, targetPlayer.y, targetPlayer.width, targetPlayer.height)) {
                        
                        b.active = false;
                        sounds.playExplosion();
                        
                        if (multiplayerSession) {
                            const hasLives = multiplayerSession.loseLife(targetPlayer.playerId);
                            if (!hasLives) {
                                if (multiplayerSession.mode === GameMode.COOPERATIVE) {
                                    gameOver();
                                } else {
                                    targetPlayer.isActive = false;
                                    if (multiplayerSession.checkGameEndConditions()) {
                                        gameOver();
                                    }
                                }
                            } else {
                                targetPlayer.respawn();
                            }
                        }
                    }
                });
            }
        }
    });
    bullets = bullets.filter(b => b.active); 
    enemies = enemies.filter(e => e.active); 
    powerUps = powerUps.filter(p => p.active);
    
    // Обработка power-up'ов
    if (currentGameMode === GameMode.SINGLE && player) {
        // Одиночная игра
        powerUps.forEach(p => { 
            if (p.active && rectIntersect(player.x, player.y, player.width, player.height, p.x, p.y, p.width, p.height)) { 
                p.apply(player); 
                p.active = false; 
            } 
        });
    } else if (players) {
        // Мультиплеер
        powerUps.forEach(p => {
            if (p.active) {
                players.forEach(player => {
                    if (player.isActive && rectIntersect(player.x, player.y, player.width, player.height, p.x, p.y, p.width, p.height)) {
                        p.apply(player);
                        p.active = false;
                    }
                });
            }
        });
    }

    // Проверяем условия окончания игры для мультиплеера
    if (multiplayerSession && multiplayerSession.checkGameEndConditions()) {
        gameOver();
        return;
    }

    // --- Визуальные эффекты ---
    if (enemiesFrozenTimer > 0) {
        // Визуальный эффект "заморозки" врагов (анимированный лед)
        enemies.forEach(e => {
            if (e.active) {
                // Анимированный "лед" вокруг врага
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#e0f7fa'; // PaleTurquoise
                ctx.fillRect(e.x - 2, e.y - 2, e.width + 4, e.height + 4);
                ctx.restore();
            }
        });
    }
}

// --- Вспомогательные функции для цвета ---
function lightenColor(color, percent) {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return `#${(
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)}`;
}

function shadeColor(color, percent) {
    const f = parseInt(color.slice(1), 16);
    const t = percent < 0 ? 0 : 255;
    const p = percent < 0 ? percent * -1 : percent;
    const R = f >> 16;
    const G = f >> 8 & 0x00FF;
    const B = f & 0x0000FF;
    return `#${(
        0x1000000 +
        (Math.round((t - R) * p) + R) * 0x10000 +
        (Math.round((t - G) * p) + G) * 0x100 +
        (Math.round((t - B) * p) + B)
    ).toString(16).slice(1)}`;
}

function draw() {
    ctx.fillStyle = '#000'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (currentGameState === GameState.PLAYING || currentGameState === GameState.COOPERATIVE || 
        currentGameState === GameState.VERSUS || currentGameState === GameState.GAME_OVER) {
        
        map.draw(ctx); 
        base.draw(ctx); 
        powerUps.forEach(p => p.draw(ctx));
        
        // Рисуем игроков
        if (currentGameMode === GameMode.SINGLE && player) {
            player.draw(ctx);
        } else if (players && players.length > 0) {
            players.forEach(p => {
                if (p.isActive) {
                    p.draw(ctx);
                }
            });
        }
        
        enemies.forEach(e => e.draw(ctx)); 
        bullets.forEach(b => b.draw(ctx));
        
        // Рисуем HUD
        drawHUD();
    }
}

function drawHUD() {
    // Фон для HUD
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; 
    ctx.fillRect(0, 0, canvas.width, 40);
    
    ctx.fillStyle = '#ffd700'; 
    ctx.font = 'bold 18px Arial'; 
    
    if (currentGameMode === GameMode.SINGLE && player) {
        // Одиночная игра - оригинальный HUD
        ctx.textAlign = 'left';
        ctx.fillText(`🛡️ ${i18n.get('lives')}: ${player.lives}`, 20, 26); 
        ctx.fillText(`⭐ ${i18n.get('score')}: ${player.score}`, 150, 26);
        ctx.textAlign = 'right'; 
        ctx.fillText(`🌊 ${i18n.get('wave')}: ${waveManager.wave}`, canvas.width - 180, 26);
        ctx.fillText(`💀 ${i18n.get('enemies')}: ${enemies.length + waveManager.toSpawn}`, canvas.width - 20, 26);
    } else if (multiplayerSession) {
        if (multiplayerSession.mode === GameMode.COOPERATIVE) {
            // Кооперативный режим - общие жизни и счет
            ctx.textAlign = 'left';
            ctx.fillText(`🛡️ ${i18n.get('lives')}: ${multiplayerSession.sharedLives}`, 20, 26);
            ctx.fillText(`⭐ ${i18n.get('score')}: ${multiplayerSession.sharedScore}`, 150, 26);
            ctx.textAlign = 'right';
            ctx.fillText(`🌊 ${i18n.get('wave')}: ${waveManager.wave}`, canvas.width - 180, 26);
            ctx.fillText(`💀 ${i18n.get('enemies')}: ${enemies.length + waveManager.toSpawn}`, canvas.width - 20, 26);
        } else if (multiplayerSession.mode === GameMode.VERSUS) {
            // Соревновательный режим - индивидуальные счета
            ctx.textAlign = 'left';
            const p1 = players[0];
            const p2 = players[1];
            
            ctx.fillStyle = '#4CAF50'; // Зеленый для Player 1
            ctx.fillText(`P1 🛡️${p1.lives} ⭐${p1.individualScore}`, 20, 26);
            
            ctx.fillStyle = '#2196F3'; // Синий для Player 2  
            ctx.fillText(`P2 🛡️${p2.lives} ⭐${p2.individualScore}`, 200, 26);
            
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'right';
            ctx.fillText(`🌊 ${i18n.get('wave')}: ${waveManager.wave}`, canvas.width - 180, 26);
            ctx.fillText(`💀 ${i18n.get('enemies')}: ${enemies.length + waveManager.toSpawn}`, canvas.width - 20, 26);
        }
    }
}

// Функция для обновления заголовка Game Over экрана
function updateGameOverTitle() {
    const titleElement = document.getElementById('game-over-title');
    if (multiplayerSession && multiplayerSession.mode === GameMode.VERSUS && multiplayerSession.winner) {
        titleElement.textContent = i18n.get('playerWins', multiplayerSession.winner);
    } else if (multiplayerSession && multiplayerSession.mode === GameMode.COOPERATIVE) {
        titleElement.textContent = i18n.get('missionFailed');
    } else {
        titleElement.textContent = i18n.get('missionFailed');
    }
}

// Функция для обновления всех игровых текстов при смене языка
function updateGameTexts() {
    // Обновляем все элементы с data-i18n атрибутами
    i18n.updateUI();
    
    // Обновляем HUD если игра активна
    if (currentGameState !== GameState.MENU && currentGameState !== GameState.MODE_SELECT) {
        // HUD обновится автоматически при следующем кадре
    }
    
    // Обновляем Game Over экран если он активен
    if (currentGameState === GameState.GAME_OVER) {
        updateGameOverTitle();
        
        // Обновляем текст счета
        let finalText = '';
        if (currentGameMode === GameMode.SINGLE && player) {
            finalText = `${i18n.get('score')}: ${player.score}`;
        } else if (multiplayerSession) {
            if (multiplayerSession.mode === GameMode.COOPERATIVE) {
                finalText = `${i18n.get('teamScore')}: ${multiplayerSession.sharedScore}`;
            } else if (multiplayerSession.mode === GameMode.VERSUS) {
                if (multiplayerSession.winner) {
                    const winnerPlayer = players.find(p => p.playerId === multiplayerSession.winner);
                    finalText = `${i18n.get('score')}: ${winnerPlayer.individualScore}`;
                } else {
                    finalText = i18n.get('drawGame');
                }
            }
        }
        document.getElementById('final-score').innerHTML = finalText;
    }
}

function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1); lastTime = timestamp;
    update(dt); draw(); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);