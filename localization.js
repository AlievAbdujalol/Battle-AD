// Система локализации для Battle City
const Languages = {
    EN: 'en',
    RU: 'ru', 
    TJ: 'tj'
};

const translations = {
    en: {
        // Main Menu
        gameTitle: "BATTLE CITY",
        gameSubtitle: "PROTECT THE BASE. DESTROY ENEMIES.",
        startMission: "START MISSION",
        controls: "WASD / ARROWS - MOVE<br>SPACE - SHOOT",
        
        // Mode Selection
        selectMode: "SELECT GAME MODE",
        singlePlayer: "SINGLE PLAYER",
        singlePlayerDesc: "Classic solo mission",
        cooperative: "COOPERATIVE",
        cooperativeDesc: "Team up with a friend",
        cooperativeControls: "Player 1: WASD + Space | Player 2: Arrows + Enter",
        versus: "VERSUS",
        versusDesc: "Compete against a friend",
        versusControls: "Player 1: WASD + Space | Player 2: Arrows + Enter",
        backToMenu: "BACK TO MENU",
        
        // Game Over
        missionFailed: "MISSION FAILED",
        playerWins: "PLAYER {0} WINS!",
        drawGame: "DRAW GAME!",
        tryAgain: "TRY AGAIN",
        
        // Pause
        gamePaused: "GAME PAUSED",
        resumeGame: "RESUME GAME",
        exitToMenu: "EXIT TO MENU",
        pauseHelp: "Press BACKSPACE to resume or ESC to exit",
        
        // HUD
        lives: "LIVES",
        score: "SCORE",
        teamScore: "TEAM SCORE",
        wave: "WAVE",
        enemies: "ENEMIES",
        
        // Language Selection
        language: "Language",
        english: "English",
        russian: "Русский",
        tajik: "Тоҷикӣ"
    },
    
    ru: {
        // Main Menu
        gameTitle: "БИТВА ГОРОДА",
        gameSubtitle: "ЗАЩИТИ БАЗУ. УНИЧТОЖЬ ВРАГОВ.",
        startMission: "НАЧАТЬ МИССИЮ",
        controls: "WASD / СТРЕЛКИ - ДВИЖЕНИЕ<br>ПРОБЕЛ - СТРЕЛЬБА",
        
        // Mode Selection
        selectMode: "ВЫБЕРИТЕ РЕЖИМ ИГРЫ",
        singlePlayer: "ОДИНОЧНАЯ ИГРА",
        singlePlayerDesc: "Классическая одиночная миссия",
        cooperative: "КООПЕРАТИВ",
        cooperativeDesc: "Играйте вместе с другом",
        cooperativeControls: "Игрок 1: WASD + Пробел | Игрок 2: Стрелки + Enter",
        versus: "СОРЕВНОВАНИЕ",
        versusDesc: "Соревнуйтесь с другом",
        versusControls: "Игрок 1: WASD + Пробел | Игрок 2: Стрелки + Enter",
        backToMenu: "НАЗАД В МЕНЮ",
        
        // Game Over
        missionFailed: "МИССИЯ ПРОВАЛЕНА",
        playerWins: "ИГРОК {0} ПОБЕЖДАЕТ!",
        drawGame: "НИЧЬЯ!",
        tryAgain: "ПОПРОБОВАТЬ СНОВА",
        
        // Pause
        gamePaused: "ИГРА НА ПАУЗЕ",
        resumeGame: "ПРОДОЛЖИТЬ ИГРУ",
        exitToMenu: "ВЫЙТИ В МЕНЮ",
        pauseHelp: "Нажмите BACKSPACE для продолжения или ESC для выхода",
        
        // HUD
        lives: "ЖИЗНИ",
        score: "СЧЕТ",
        teamScore: "СЧЕТ КОМАНДЫ",
        wave: "ВОЛНА",
        enemies: "ВРАГИ",
        
        // Language Selection
        language: "Язык",
        english: "English",
        russian: "Русский",
        tajik: "Тоҷикӣ"
    },
    
    tj: {
        // Main Menu
        gameTitle: "ҶАНГИ ШАҲР",
        gameSubtitle: "ПОЙГОҲРО ҲИФЗ КУН. ДУШМАНОНРО НОБУД КУН.",
        startMission: "ОҒОЗИ ВАЗИФА",
        controls: "WASD / ТИРҲО - ҲАРАКАТ<br>ФОСИЛА - ТИРОНДАНӢ",
        
        // Mode Selection
        selectMode: "РЕЖИМИ БОЗИРО ИНТИХОБ КУНЕД",
        singlePlayer: "БОЗИИ ЯККА",
        singlePlayerDesc: "Вазифаи классикии якка",
        cooperative: "ҲАМКОРӢ",
        cooperativeDesc: "Бо дӯст якҷоя бозӣ кунед",
        cooperativeControls: "Бозингар 1: WASD + Фосила | Бозингар 2: Тирҳо + Enter",
        versus: "МУСОБИҚА",
        versusDesc: "Бо дӯст мусобиқа кунед",
        versusControls: "Бозингар 1: WASD + Фосила | Бозингар 2: Тирҳо + Enter",
        backToMenu: "БОЗГАШТ БА МЕНЮ",
        
        // Game Over
        missionFailed: "ВАЗИФА ИҶРО НАШУД",
        playerWins: "БОЗИНГАР {0} ҒОЛИБ!",
        drawGame: "МУСОВӢ!",
        tryAgain: "БОЗ КӮШИШ КУНЕД",
        
        // Pause
        gamePaused: "БОЗӢ ТАВАҚҚУФ ШУД",
        resumeGame: "ИДОМА ДОДАН",
        exitToMenu: "БАРОМАД БА МЕНЮ",
        pauseHelp: "BACKSPACE-ро барои идома ё ESC-ро барои баромад пахш кунед",
        
        // HUD
        lives: "ҲАЁТ",
        score: "ҲИСОБ",
        teamScore: "ҲИСОБИ КОМАНДА",
        wave: "МАВҶ",
        enemies: "ДУШМАНОН",
        
        // Language Selection
        language: "Забон",
        english: "English",
        russian: "Русский", 
        tajik: "Тоҷикӣ"
    }
};

class Localization {
    constructor() {
        this.currentLanguage = this.getStoredLanguage() || Languages.EN;
        this.loadLanguage(this.currentLanguage);
    }
    
    getStoredLanguage() {
        return localStorage.getItem('battlecity-language');
    }
    
    setLanguage(language) {
        this.currentLanguage = language;
        localStorage.setItem('battlecity-language', language);
        this.loadLanguage(language);
        this.updateUI();
    }
    
    loadLanguage(language) {
        this.strings = translations[language] || translations[Languages.EN];
    }
    
    get(key, ...args) {
        let text = this.strings[key] || key;
        
        // Поддержка параметров {0}, {1} и т.д.
        args.forEach((arg, index) => {
            text = text.replace(`{${index}}`, arg);
        });
        
        return text;
    }
    
    updateUI() {
        // Обновляем все элементы с data-i18n атрибутами
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = this.get(key);
            
            if (element.innerHTML !== undefined) {
                element.innerHTML = text;
            } else {
                element.textContent = text;
            }
        });
    }
}

// Глобальный экземпляр локализации
let i18n = null;