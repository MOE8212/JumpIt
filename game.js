// Game Configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#87CEEB',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%',
        parent: 'game',
        expandParent: true,
        fullscreenTarget: 'game-container',
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// World configuration
const WORLD_WIDTH = 3200; // 4x wider than screen
const WORLD_HEIGHT = 600;

// Background themes
const backgrounds = [
    { gradient: ['#FF6B6B', '#4ECDC4'], name: 'Sunset Ocean' },
    { gradient: ['#A8E6CF', '#FFD93D'], name: 'Spring Meadow' },
    { gradient: ['#FF9A9E', '#FECFEF'], name: 'Cotton Candy' },
    { gradient: ['#667eea', '#764ba2'], name: 'Purple Dream' },
    { gradient: ['#f093fb', '#f5576c'], name: 'Pink Sunset' },
    { gradient: ['#4facfe', '#00f2fe'], name: 'Blue Sky' }
];

let currentBackgroundIndex = 0;

// Game variables
let game;
let player;
let platforms;
let coins;
let enemies;
let cursors;
let spaceKey;
let gameStarted = false;
let gameTime = 0;
let startTime;
let score = 0;
let lives = 3;
let coinsCollected = 0;
let isGameOver = false;
let isInvulnerable = false;

// Make game globally accessible for music control
window.game = game;

// Mobile controls
let leftBtn, rightBtn, jumpBtn;

// Initialize game when page loads
window.addEventListener('load', () => {
    // Don't start game immediately - wait for auth
    setupMobileControls();

    // Create and start background music immediately
    createGlobalBackgroundMusic();

    // Ensure home screen is visible
    const homeScreen = document.getElementById('home-screen');
    if (homeScreen) {
        homeScreen.classList.remove('hidden');
        console.log('Home screen made visible on load');
    }

    // Initialize shop system
    updateShopDisplay();

    // Setup fullscreen button
    setupFullscreenButton();

    // Test if button exists
    setTimeout(() => {
        const testBtn = document.getElementById('home-fullscreen-btn');
        console.log('=== FULLSCREEN BUTTON TEST ===');
        console.log('Button found:', !!testBtn);
        if (testBtn) {
            console.log('Button visible:', testBtn.offsetWidth > 0 && testBtn.offsetHeight > 0);
            console.log('Button clickable:', testBtn.style.pointerEvents !== 'none');
        }
    }, 1000);

    // Update version display with current commit info
    updateVersionDisplay();
});

// Create global background music that starts immediately
function createGlobalBackgroundMusic() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let isPlaying = false;
    let musicInterval;

    // Werewolf howling melody - low, haunting tones
    const howlMelody = [
        { freq: 110, duration: 1.2 }, // A2 - deep howl
        { freq: 123, duration: 0.8 }, // B2
        { freq: 110, duration: 0.6 }, // A2
        { freq: 98, duration: 1.0 },  // G2 - very deep
        { freq: 110, duration: 0.8 }, // A2
        { freq: 123, duration: 0.6 }, // B2
        { freq: 131, duration: 0.8 }, // C3
        { freq: 110, duration: 1.5 }, // A2 - long howl
        { freq: 87, duration: 0.8 },  // F2 - deepest
        { freq: 110, duration: 0.6 }, // A2
        { freq: 123, duration: 0.6 }, // B2
        { freq: 110, duration: 1.0 }  // A2 - final howl
    ];
    let currentNote = 0;

    const playHowl = (frequency, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sawtooth'; // Raw, animal-like sound

        // Create howling effect with frequency modulation
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        lfo.frequency.setValueAtTime(0.5, audioContext.currentTime); // Slow modulation
        lfo.type = 'sine';
        lfoGain.gain.setValueAtTime(20, audioContext.currentTime); // Modulation depth
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);

        // Add reverb for echo effect
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, audioContext.currentTime);
        filter.Q.setValueAtTime(0.5, audioContext.currentTime);

        // Create howling tremolo effect
        const tremolo = audioContext.createGain();
        const tremoloLfo = audioContext.createOscillator();
        tremoloLfo.frequency.setValueAtTime(8, audioContext.currentTime); // Fast tremolo
        tremoloLfo.type = 'sine';
        tremoloLfo.connect(tremolo.gain);
        tremolo.gain.setValueAtTime(0.4, audioContext.currentTime);
        tremolo.gain.setValueAtTime(0.1, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        lfo.start(audioContext.currentTime);
        tremoloLfo.start(audioContext.currentTime);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        lfo.stop(audioContext.currentTime + duration);
        tremoloLfo.stop(audioContext.currentTime + duration);
    };

    const playMelody = () => {
        if (!isPlaying) return;

        const note = howlMelody[currentNote];
        playHowl(note.freq, note.duration);
        currentNote = (currentNote + 1) % howlMelody.length;
    };

    // Don't start music immediately - let game music handle it
    // Make it globally accessible for stopping if needed
    window.globalMusic = {
        start: function () {
            // Disabled - game music will play instead
            console.log('Global music disabled in favor of game music');
        },
        stop: function () {
            if (isPlaying) {
                isPlaying = false;
                clearInterval(musicInterval);
                console.log('Global music stopped');
            }
        }
    };
}

// Function to start the game after authentication
function startGame() {
    console.log('=== START GAME FUNCTION CALLED ===');

    // Hide home screen and show game
    const homeScreen = document.getElementById('home-screen');
    const gameElement = document.getElementById('game');

    console.log('Home screen element:', homeScreen);
    console.log('Game element:', gameElement);

    if (homeScreen) {
        console.log('Home screen classes BEFORE:', homeScreen.classList.toString());
        console.log('Home screen display BEFORE:', window.getComputedStyle(homeScreen).display);
        console.log('Home screen z-index BEFORE:', window.getComputedStyle(homeScreen).zIndex);

        homeScreen.classList.add('hidden');

        console.log('Home screen classes AFTER:', homeScreen.classList.toString());
        console.log('Home screen display AFTER:', window.getComputedStyle(homeScreen).display);
        console.log('Home screen z-index AFTER:', window.getComputedStyle(homeScreen).zIndex);
        console.log('Home screen hidden successfully');
    } else {
        console.error('Home screen element not found!');
    }

    if (gameElement) {
        console.log('Game element display BEFORE:', gameElement.style.display);
        gameElement.style.display = 'block';
        console.log('Game element display AFTER:', gameElement.style.display);
        console.log('Game element shown successfully');
    } else {
        console.error('Game element not found!');
    }

    console.log('Current game instance:', game);

    if (!game) {
        console.log('Creating new Phaser game instance...');
        try {
            game = new Phaser.Game(config);
            window.game = game; // Make globally accessible
            console.log('Game created successfully:', game);
        } catch (error) {
            console.error('Error creating game:', error);
            console.error('Error stack:', error.stack);
        }
    } else {
        console.log('Game already exists, skipping creation');
    }

    console.log('=== START GAME FUNCTION COMPLETED ===');
}

// Function to show home screen

function preload() {
    console.log('Preload function called');

    // Create colored rectangles for sprites directly in preload
    createColoredRectangles.call(this);

    // Create audio textures for sound effects
    createAudioTextures.call(this);

    console.log('Preload completed');
}

function createColoredRectangles() {
    console.log('Creating colored rectangles...');

    // Create animated character textures
    createPlayerTextures.call(this);

    // Create a simple colored rectangle for platform
    const platformGraphics = this.add.graphics();
    platformGraphics.fillStyle(0x8B4513);
    platformGraphics.fillRect(0, 0, 200, 32);
    platformGraphics.generateTexture('platform', 200, 32);
    platformGraphics.destroy();
    console.log('Platform texture created');

    // Create a simple colored rectangle for coin
    const coinGraphics = this.add.graphics();
    coinGraphics.fillStyle(0xFFD700);
    coinGraphics.fillCircle(16, 16, 16);
    coinGraphics.generateTexture('coin', 32, 32);
    coinGraphics.destroy();
    console.log('Coin texture created');

    // Create cute purple worm enemy
    const enemyGraphics = this.add.graphics();

    // Worm body (segmented) - body gets THINNER towards head
    enemyGraphics.fillStyle(0x9B59B6); // Purple
    enemyGraphics.fillCircle(8, 16, 4);   // Body segment 1 (back)
    enemyGraphics.fillCircle(16, 16, 5);  // Body segment 2 (middle)
    enemyGraphics.fillCircle(24, 16, 6);  // Head (front) - biggest

    // Eyes on the head (right side)
    enemyGraphics.fillStyle(0xFFFFFF);
    enemyGraphics.fillCircle(22, 14, 2);   // Left eye
    enemyGraphics.fillCircle(26, 14, 2);   // Right eye

    // Eye pupils
    enemyGraphics.fillStyle(0x000000);
    enemyGraphics.fillCircle(22, 14, 1);
    enemyGraphics.fillCircle(26, 14, 1);

    // Smile
    enemyGraphics.lineStyle(2, 0x000000);
    enemyGraphics.arc(24, 18, 3, 0, Math.PI);

    enemyGraphics.generateTexture('enemy', 32, 32);
    enemyGraphics.destroy();
    console.log('Enemy texture created');
}

function createPlayerTextures() {
    // Create idle player (standing)
    const idleGraphics = this.add.graphics();

    // Blue hat
    idleGraphics.fillStyle(0x0066CC);
    idleGraphics.fillRect(8, 4, 16, 12);

    // Head
    idleGraphics.fillStyle(0xFFDBB3);
    idleGraphics.fillCircle(16, 16, 8);

    // Body
    idleGraphics.fillStyle(0x00AA00);
    idleGraphics.fillRect(12, 24, 8, 16);

    // Arms
    idleGraphics.fillRect(8, 26, 4, 12);
    idleGraphics.fillRect(20, 26, 4, 12);

    // Legs (standing)
    idleGraphics.fillStyle(0x006600);
    idleGraphics.fillRect(12, 40, 4, 8);
    idleGraphics.fillRect(16, 40, 4, 8);

    idleGraphics.generateTexture('player-idle', 32, 48);
    idleGraphics.destroy();

    // Create walking player (legs apart)
    const walkGraphics = this.add.graphics();

    // Blue hat
    walkGraphics.fillStyle(0x0066CC);
    walkGraphics.fillRect(8, 4, 16, 12);

    // Head
    walkGraphics.fillStyle(0xFFDBB3);
    walkGraphics.fillCircle(16, 16, 8);

    // Body
    walkGraphics.fillStyle(0x00AA00);
    walkGraphics.fillRect(12, 24, 8, 16);

    // Arms (swinging)
    walkGraphics.fillRect(8, 26, 4, 12);
    walkGraphics.fillRect(20, 26, 4, 12);

    // Legs (walking - one forward, one back)
    walkGraphics.fillStyle(0x006600);
    walkGraphics.fillRect(11, 40, 4, 8); // Left leg back
    walkGraphics.fillRect(17, 40, 4, 8); // Right leg forward

    walkGraphics.generateTexture('player-walk', 32, 48);
    walkGraphics.destroy();

    console.log('Player textures created');
}

function createAudioTextures() {
    console.log('Creating audio textures...');

    // Create jump sound effect using Web Audio API
    this.jumpSound = createJumpSound();

    // Create background music
    this.backgroundMusic = createBackgroundMusic();

    console.log('Audio textures created');
}

function createJumpSound() {
    // Create a simple beep sound for jumping
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    return function () {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };
}

function createBackgroundMusic() {
    // Create cheerful, complex jump'n'run music with chords!
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let isPlaying = false;
    let musicInterval;

    // Enhanced melody with bass line and harmony
    const complexMelody = [
        // Phrase 1
        { melody: 523, bass: 262, harmony: 659, duration: 0.25 }, // C5 + C4 + E5
        { melody: 587, bass: 294, harmony: 698, duration: 0.25 }, // D5 + D4 + F5
        { melody: 659, bass: 330, harmony: 784, duration: 0.25 }, // E5 + E4 + G5
        { melody: 698, bass: 349, harmony: 880, duration: 0.25 }, // F5 + F4 + A5
        { melody: 784, bass: 392, harmony: 988, duration: 0.35 }, // G5 + G4 + B5
        { melody: 784, bass: 392, harmony: 659, duration: 0.15 }, // G5 + G4 + E5

        // Phrase 2
        { melody: 698, bass: 349, harmony: 880, duration: 0.25 }, // F5 + F4 + A5
        { melody: 659, bass: 330, harmony: 784, duration: 0.25 }, // E5 + E4 + G5
        { melody: 587, bass: 294, harmony: 698, duration: 0.35 }, // D5 + D4 + F5
        { melody: 523, bass: 262, harmony: 659, duration: 0.25 }, // C5 + C4 + E5

        // Phrase 3 - Higher
        { melody: 880, bass: 440, harmony: 1047, duration: 0.25 }, // A5 + A4 + C6
        { melody: 784, bass: 392, harmony: 988, duration: 0.25 }, // G5 + G4 + B5
        { melody: 698, bass: 349, harmony: 880, duration: 0.25 }, // F5 + F4 + A5
        { melody: 659, bass: 330, harmony: 784, duration: 0.35 }, // E5 + E4 + G5

        // Phrase 4 - Resolution
        { melody: 587, bass: 294, harmony: 698, duration: 0.25 }, // D5 + D4 + F5
        { melody: 659, bass: 330, harmony: 784, duration: 0.25 }, // E5 + E4 + G5
        { melody: 523, bass: 262, harmony: 659, duration: 0.5 }   // C5 + C4 + E5 - hold
    ];
    let currentNote = 0;

    const playChord = (melody, bass, harmony, duration) => {
        [melody, bass, harmony].forEach((freq, idx) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();

            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = idx === 1 ? 'sawtooth' : 'triangle'; // Bass uses sawtooth

            // Bright filter
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(3500, audioContext.currentTime);
            filter.Q.setValueAtTime(0.8, audioContext.currentTime);

            // Different volumes for melody, bass, harmony
            const volume = idx === 0 ? 0.12 : (idx === 1 ? 0.08 : 0.06);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        });
    };

    const playMelody = () => {
        if (!isPlaying) return;

        const note = complexMelody[currentNote];
        playChord(note.melody, note.bass, note.harmony, note.duration);

        currentNote = (currentNote + 1) % complexMelody.length;
    };

    return {
        start: function () {
            if (!isPlaying) {
                isPlaying = true;
                // Stop any global music first
                if (window.globalMusic && window.globalMusic.stop) {
                    window.globalMusic.stop();
                }
                musicInterval = setInterval(playMelody, 220); // Upbeat tempo!
                console.log('Complex jump music started!');
            }
        },
        stop: function () {
            if (isPlaying) {
                isPlaying = false;
                clearInterval(musicInterval);
                console.log('Complex jump music stopped');
            }
        }
    };
}

function create() {
    console.log('Create function called');

    // Set world bounds for the larger world
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Create dynamic background that covers the entire world
    createDynamicBackground.call(this);

    // Create platforms
    platforms = this.physics.add.staticGroup();

    // Ground platform - make it cover the entire world width
    const ground = platforms.create(WORLD_WIDTH / 2, 584, 'platform');
    ground.setScale(WORLD_WIDTH / 200, 1); // Scale to cover entire world width
    ground.refreshBody();
    ground.body.setSize(WORLD_WIDTH, 32); // Set exact collision box - full world width

    // Add visual ground line for entire world
    const groundLine = this.add.graphics();
    groundLine.lineStyle(4, 0x8B4513, 1);
    groundLine.lineBetween(0, 600, WORLD_WIDTH, 600);

    // Create platforms with better spacing for movement
    const platformPositions = [
        // Left section (0-800) - More spaced out
        { x: 300, y: 480 }, { x: 550, y: 420 }, { x: 750, y: 480 },

        // Middle section (800-1600) - Good spacing
        { x: 950, y: 480 }, { x: 1200, y: 400 }, { x: 1450, y: 460 },

        // Right section (1600-2400) - More challenging
        { x: 1700, y: 450 }, { x: 2000, y: 380 }, { x: 2250, y: 500 },

        // Far right section (2400-3200) - Final challenge
        { x: 2600, y: 480 }, { x: 2850, y: 400 }, { x: 3100, y: 460 }
    ];

    platformPositions.forEach(pos => {
        const platform = platforms.create(pos.x, pos.y, 'platform');
        platform.body.setSize(200, 32);
    });

    // Create player
    player = this.physics.add.sprite(100, 540, 'player-idle'); // Start with idle texture
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.body.setSize(32, 48); // Set exact collision box

    // Animation variables
    player.isWalking = false;
    player.walkTimer = 0;

    // Player physics
    this.physics.add.collider(player, platforms);

    // Set up camera to follow player
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(player);
    this.cameras.main.setDeadzone(100, 50); // Smooth camera movement

    // Create coins with better placement across the larger world
    coins = this.physics.add.group();

    // Place coins strategically around the better-spaced platforms
    const coinPositions = [
        // Left section (0-800) - Around platforms
        { x: 350, y: 440 }, { x: 600, y: 380 }, { x: 800, y: 440 },
        { x: 200, y: 540 }, { x: 500, y: 540 }, { x: 850, y: 540 },

        // Middle section (800-1600) - Good distribution
        { x: 1000, y: 440 }, { x: 1250, y: 360 }, { x: 1500, y: 420 },
        { x: 900, y: 540 }, { x: 1150, y: 540 }, { x: 1550, y: 540 },

        // Right section (1600-2400) - More challenging
        { x: 1750, y: 410 }, { x: 2050, y: 340 }, { x: 2300, y: 460 },
        { x: 1650, y: 540 }, { x: 1950, y: 540 }, { x: 2350, y: 540 },

        // Far right section (2400-3200) - Final coins
        { x: 2650, y: 440 }, { x: 2900, y: 360 }, { x: 3150, y: 420 },
        { x: 2550, y: 540 }, { x: 2800, y: 540 }, { x: 3200, y: 540 }
    ];

    coinPositions.forEach(pos => {
        const coin = coins.create(pos.x, pos.y, 'coin');
        coin.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        coin.setScale(0.8);
    });

    this.physics.add.collider(coins, platforms);
    this.physics.add.overlap(player, coins, collectCoin, null, this);

    // Create enemies
    enemies = this.physics.add.group();

    // Add enemies positioned around the better-spaced platforms
    const enemyPositions = [
        // Left section (0-800) - Ground patrol and platform enemies
        { x: 400, y: 540, type: 'patrol', direction: 1 }, { x: 650, y: 540, type: 'patrol', direction: -1 },
        { x: 300, y: 440, type: 'platform', direction: 1, platformWidth: 200 },
        { x: 550, y: 380, type: 'platform', direction: -1, platformWidth: 200 },
        { x: 750, y: 440, type: 'platform', direction: 1, platformWidth: 200 },

        // Middle section (800-1600) - More challenging
        { x: 1000, y: 540, type: 'patrol', direction: 1 }, { x: 1300, y: 540, type: 'patrol', direction: -1 },
        { x: 950, y: 440, type: 'platform', direction: 1, platformWidth: 200 },
        { x: 1200, y: 360, type: 'platform', direction: -1, platformWidth: 200 },
        { x: 1450, y: 420, type: 'platform', direction: 1, platformWidth: 200 },

        // Right section (1600-2400) - Difficult
        { x: 1800, y: 540, type: 'patrol', direction: 1 }, { x: 2100, y: 540, type: 'patrol', direction: -1 },
        { x: 1700, y: 410, type: 'platform', direction: 1, platformWidth: 200 },
        { x: 2000, y: 340, type: 'platform', direction: -1, platformWidth: 200 },
        { x: 2250, y: 460, type: 'platform', direction: 1, platformWidth: 200 },

        // Far right section (2400-3200) - Final challenge
        { x: 2700, y: 540, type: 'patrol', direction: 1 }, { x: 3000, y: 540, type: 'patrol', direction: -1 },
        { x: 2600, y: 440, type: 'platform', direction: 1, platformWidth: 200 },
        { x: 2850, y: 360, type: 'platform', direction: -1, platformWidth: 200 },
        { x: 3100, y: 420, type: 'platform', direction: 1, platformWidth: 200 }
    ];

    enemyPositions.forEach(pos => {
        const enemy = enemies.create(pos.x, pos.y, 'enemy');
        enemy.setBounce(0.2);
        enemy.setCollideWorldBounds(true);

        // Set initial velocity for moving enemies
        const speed = pos.type === 'platform' ? 60 : 50;
        enemy.setVelocityX(pos.direction * speed);

        enemy.enemyType = pos.type;
        enemy.direction = pos.direction || 1;
        enemy.setScale(0.8);

        // Store platform boundaries for platform enemies
        if (pos.type === 'platform') {
            // Platform width is 200px (from platform creation)
            const platformWidth = 200;
            enemy.platformLeft = pos.x - platformWidth / 2;
            enemy.platformRight = pos.x + platformWidth / 2;
            enemy.initialY = pos.y;
            
            console.log(`Platform enemy at ${pos.x}: patrol range ${enemy.platformLeft} to ${enemy.platformRight}`);
        }

        // Add collision with platforms
        this.physics.add.collider(enemy, platforms);

        // Add collision with player
        this.physics.add.overlap(player, enemy, hitEnemy, null, this);
    });

    // Create goal area at the end of the world
    const goal = this.physics.add.sprite(WORLD_WIDTH - 50, 520, 'platform');
    goal.setTint(0x00FF00); // Make it green
    goal.setScale(0.5, 0.3);
    goal.body.setSize(100, 32);

    // Add goal text
    const goalText = this.add.text(WORLD_WIDTH - 50, 500, 'GOAL', {
        fontSize: '16px',
        fill: '#FFFFFF',
        fontStyle: 'bold'
    });
    goalText.setOrigin(0.5);

    // Check for goal collision (both goal object and right wall)
    this.physics.add.overlap(player, goal, reachGoal, null, this);

    // Input
    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ESC key for menu
    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => {
        console.log('ESC pressed - toggling menu');
        toggleInGameMenu();
    });

    // Game state
    gameStarted = false;
    gameTime = 0;
    score = 0;
    lives = 3;
    coinsCollected = 0;
    isGameOver = false;
    isInvulnerable = false;

    console.log('=== GAME INITIALIZATION ===');
    console.log('Initial values:');
    console.log('- gameTime:', gameTime);
    console.log('- coinsCollected:', coinsCollected);
    console.log('- score:', score);
    console.log('- lives:', lives);

    // Update HUD
    updateHUD();

    // Start game timer
    startTime = this.time.now;
    gameStarted = true;

    console.log('Game started at:', startTime);

    // Track game session
    if (window.authManager && window.authManager.isLoggedIn && window.adminPanel) {
        window.adminPanel.trackGameSession(window.authManager.currentUser.username);
    }

    // Start background music with user interaction
    if (this.backgroundMusic) {
        // Try to start music immediately
        try {
            this.backgroundMusic.start();
        } catch (error) {
            console.log('Music start failed, will try again on user interaction');
        }
    }

}

function update() {
    if (isGameOver) return;

    // Update game timer
    if (gameStarted) {
        const newGameTime = Math.floor((this.time.now - startTime) / 1000);
        if (newGameTime !== gameTime) {
            gameTime = newGameTime;
            updateTimer();

            // Debug timer every 10 seconds
            if (gameTime % 10 === 0 && gameTime > 0) {
                console.log('Game timer update:', gameTime, 'seconds');
            }
        }
    }

    // Player movement
    const isMovingLeft = cursors.left.isDown || (leftBtn && leftBtn.isDown);
    const isMovingRight = cursors.right.isDown || (rightBtn && rightBtn.isDown);

    if (isMovingLeft) {
        player.setVelocityX(-160);
        player.isWalking = true;
        console.log('Moving left');
    } else if (isMovingRight) {
        player.setVelocityX(160);
        player.isWalking = true;
        console.log('Moving right');
    } else {
        player.setVelocityX(0);
        player.isWalking = false;
    }

    // Walking animation
    if (player.isWalking) {
        player.walkTimer += 16; // Assume 60 FPS
        if (player.walkTimer > 300) { // Switch every 300ms
            if (player.texture.key === 'player-idle') {
                player.setTexture('player-walk');
            } else {
                player.setTexture('player-idle');
            }
            player.walkTimer = 0;
        }
    } else {
        player.setTexture('player-idle');
        player.walkTimer = 0;
    }

    // Jumping - Simplified logic
    const jumpPressed = cursors.up.isDown || spaceKey.isDown || (jumpBtn && jumpBtn.isDown);
    const onGround = player.body.touching.down;

    // Simple ground detection - if player is at bottom or on platform
    const atBottom = player.y >= 568; // At ground level
    const canJump = onGround || atBottom;

    // Debug: Show player position and ground status occasionally
    if (Math.random() < 0.01) { // 1% chance each frame
        console.log('Player Y:', player.y, 'On ground:', onGround, 'At bottom:', atBottom, 'Velocity Y:', player.body.velocity.y, 'Can jump:', canJump);
    }

    if (jumpPressed && canJump) {
        player.setVelocityY(-500);
        console.log('Jumping! Player Y:', player.y);

        // Play jump sound
        if (this.jumpSound) {
            this.jumpSound();
        }
    }

    // Check if player falls off the world
    if (player.y > 600) {
        loseLife();
    }

    // Check if player reaches the right edge of the world (goal)
    if (player.x >= WORLD_WIDTH - 32 && !isGameOver) {
        console.log('Player reached right wall - Level completed!');
        levelCompleted();
    }

    // Update enemy AI with improved patrol logic + DEBUG
    enemies.children.entries.forEach((enemy, index) => {
        // Debug: Log occasionally for first enemy only
        const shouldLog = index === 0 && Math.random() < 0.02; // 2% chance for first enemy
        
        if (enemy.enemyType === 'patrol') {
            // Ground patrol enemies - detect platform edges
            const enemyOnGround = enemy.body.touching.down;
            const currentVelocity = enemy.body.velocity.x;
            
            if (shouldLog) {
                console.log('🐛 [PATROL DEBUG]', {
                    x: Math.round(enemy.x),
                    y: Math.round(enemy.y),
                    direction: enemy.direction,
                    velocity: Math.round(currentVelocity),
                    onGround: enemyOnGround,
                    touching: {
                        left: enemy.body.touching.left,
                        right: enemy.body.touching.right,
                        down: enemy.body.touching.down
                    }
                });
            }
            
            if (enemyOnGround) {
                // Check for platform edge ahead using raycasting
                const checkDistance = 40; // Look 40px ahead
                const rayX = enemy.x + (enemy.direction * checkDistance);
                const rayY = enemy.y + 20; // Check slightly below enemy
                
                // Check if there's ground ahead
                let hasGroundAhead = false;
                
                // Check if we hit a platform
                platforms.children.entries.forEach(platform => {
                    const platformBounds = platform.getBounds();
                    if (rayX >= platformBounds.left && rayX <= platformBounds.right &&
                        rayY >= platformBounds.top && rayY <= platformBounds.bottom + 10) {
                        hasGroundAhead = true;
                    }
                });
                
                // Check if we're still on the main ground (y > 550)
                if (rayY >= 560) {
                    hasGroundAhead = true;
                }
                
                if (shouldLog) {
                    console.log('  ↪ Ray Check:', {
                        rayX: Math.round(rayX),
                        rayY: Math.round(rayY),
                        hasGroundAhead,
                        atWorldBounds: enemy.x <= 10 || enemy.x >= WORLD_WIDTH - 42
                    });
                }
                
                // Reverse direction at platform edge or world bounds
                // Only reverse if moving TOWARDS the problem to prevent constant flipping
                const atLeftEdge = enemy.x <= 10 && enemy.direction === -1;
                const atRightEdge = enemy.x >= WORLD_WIDTH - 42 && enemy.direction === 1;
                const shouldReverse = !hasGroundAhead || atLeftEdge || atRightEdge;
                
                if (shouldReverse) {
                    const oldDirection = enemy.direction;
                    enemy.direction *= -1;
                    
                    if (shouldLog || true) { // Always log direction changes
                        console.log('🔄 [PATROL] Direction changed!', {
                            x: Math.round(enemy.x),
                            oldDirection,
                            newDirection: enemy.direction,
                            reason: !hasGroundAhead ? 'NO_GROUND' : (atLeftEdge ? 'LEFT_EDGE' : 'RIGHT_EDGE')
                        });
                    }
                }
            } else if (shouldLog) {
                console.log('  ⚠️ Enemy not on ground!');
            }
            
            // Always flip sprite based on direction (worm head is on RIGHT in texture at x=24)
            // direction = 1 (moving right) → flipX = false (no mirror, head already faces right)
            // direction = -1 (moving left) → flipX = true (mirror so head faces left)
            enemy.flipX = enemy.direction === -1;
            
            // Always keep moving
            enemy.setVelocityX(enemy.direction * 50);
            
            // Debug: Check if enemy is stuck
            if (Math.abs(currentVelocity) < 5) {
                console.warn('⚠️ [PATROL] Enemy stuck!', {
                    x: Math.round(enemy.x),
                    y: Math.round(enemy.y),
                    velocity: currentVelocity,
                    direction: enemy.direction
                });
            }
            
        } else if (enemy.enemyType === 'platform') {
            // Platform enemies move back and forth within their platform bounds
            const currentVelocity = enemy.body.velocity.x;
            
            if (shouldLog) {
                console.log('🐛 [PLATFORM DEBUG]', {
                    x: Math.round(enemy.x),
                    direction: enemy.direction,
                    velocity: Math.round(currentVelocity),
                    bounds: {
                        left: enemy.platformLeft,
                        right: enemy.platformRight
                    },
                    distance: {
                        toLeft: Math.round(enemy.x - enemy.platformLeft),
                        toRight: Math.round(enemy.platformRight - enemy.x)
                    }
                });
            }
            
            // Reverse direction at platform boundaries
            // Only reverse if moving TOWARDS the boundary to prevent constant flipping
            const atLeftBoundary = enemy.x <= enemy.platformLeft + 16 && enemy.direction === -1;
            const atRightBoundary = enemy.x >= enemy.platformRight - 16 && enemy.direction === 1;
            
            if (atLeftBoundary || atRightBoundary) {
                const oldDirection = enemy.direction;
                enemy.direction *= -1;
                
                console.log('🔄 [PLATFORM] Direction changed!', {
                    x: Math.round(enemy.x),
                    oldDirection,
                    newDirection: enemy.direction,
                    atLeft: atLeftBoundary,
                    atRight: atRightBoundary
                });
            }
            
            // Always flip sprite based on direction (worm head is on RIGHT in texture at x=24)
            // direction = 1 (moving right) → flipX = false (no mirror, head already faces right)
            // direction = -1 (moving left) → flipX = true (mirror so head faces left)
            enemy.flipX = enemy.direction === -1;
            
            // Always keep moving in current direction with consistent speed
            enemy.setVelocityX(enemy.direction * 60);
            
            // Debug: Check if enemy is stuck
            if (Math.abs(currentVelocity) < 5) {
                console.warn('⚠️ [PLATFORM] Enemy stuck!', {
                    x: Math.round(enemy.x),
                    velocity: currentVelocity,
                    direction: enemy.direction
                });
            }
        }
    });

    // Level completion is now handled by reaching the goal
}

function collectCoin(player, coin) {
    console.log('Coin collected! Current coins:', coinsCollected);

    coin.disableBody(true, true);
    coinsCollected++;
    score += 10;

    console.log('After collection - Coins:', coinsCollected, 'Score:', score);

    // Add coins to total
    addCoins(1);

    updateHUD();

    // Add visual feedback for coin collection
    const coinText = player.scene.add.text(coin.x, coin.y, '+10', {
        fontSize: '16px',
        fill: '#FFD700',
        fontStyle: 'bold'
    });

    // Animate the score text
    player.scene.tweens.add({
        targets: coinText,
        y: coin.y - 50,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => coinText.destroy()
    });

    // Play coin sound effect (will be added in Phase 5)
    console.log('Coin collected! Total coins now:', coinsCollected);
}

function reachGoal(player, goal) {
    if (isGameOver) return;

    // Level completed!
    levelCompleted();
}

function hitEnemy(player, enemy) {
    if (isGameOver || isInvulnerable) return;

    // Check if player is jumping on enemy (from above)
    if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
        // Player jumped on enemy - destroy enemy and give points
        enemy.disableBody(true, true);
        score += 20;
        updateHUD();

        // Add visual feedback
        const killText = player.scene.add.text(enemy.x, enemy.y, '+20', {
            fontSize: '16px',
            fill: '#FF0000',
            fontStyle: 'bold'
        });

        player.scene.tweens.add({
            targets: killText,
            y: enemy.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => killText.destroy()
        });

        // Bounce player up
        player.setVelocityY(-300);
    } else {
        // Player hit enemy from side or below - lose life
        loseLife();

        // Add knockback effect
        const knockbackDirection = player.x < enemy.x ? -200 : 200;
        player.setVelocityX(knockbackDirection);
        player.setVelocityY(-100);

        // Start invulnerability frames
        startInvulnerability();
    }
}

function loseLife() {
    lives--;
    updateHUD();

    if (lives <= 0) {
        gameOver();
    } else {
        // Respawn player
        player.setPosition(100, 450);
        player.setVelocity(0, 0);
    }
}

function startInvulnerability() {
    isInvulnerable = true;

    // Flash player to indicate invulnerability
    const flashTween = player.scene.tweens.add({
        targets: player,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 10,
        onComplete: () => {
            player.setAlpha(1);
            isInvulnerable = false;
        }
    });
}

function levelCompleted() {
    console.log('=== LEVEL COMPLETED ===');
    console.log('Game time:', gameTime);
    console.log('Coins collected:', coinsCollected);

    // Calculate final score
    const timeBonus = Math.max(0, 180 - gameTime) * 5; // Bonus for completing quickly (3 minutes max)
    const coinBonus = coinsCollected * 10;
    const completionBonus = 100; // Bonus for completing the level
    const finalScore = timeBonus + coinBonus + completionBonus;

    console.log('Score calculation:');
    console.log('- Time bonus:', timeBonus, '(180 -', gameTime, ') * 5');
    console.log('- Coin bonus:', coinBonus, '(', coinsCollected, '* 10)');
    console.log('- Completion bonus:', completionBonus);
    console.log('- Final score:', finalScore);

    score = finalScore;
    updateHUD();

    // Show completion message
    const completionText = player.scene.add.text(400, 300, 'Level Completed!', {
        fontSize: '48px',
        fill: '#00FF00',
        fontStyle: 'bold'
    });
    completionText.setOrigin(0.5);

    const scoreText = player.scene.add.text(400, 350, `Final Score: ${finalScore}`, {
        fontSize: '24px',
        fill: '#FFFFFF',
        fontStyle: 'bold'
    });
    scoreText.setOrigin(0.5);

    // Submit score to leaderboard (only for successful completions!)
    if (window.authManager && window.authManager.isLoggedIn) {
        console.log('Level completed successfully! Submitting score to leaderboard:');
        console.log('- Score:', finalScore);
        console.log('- Coins:', coinsCollected);
        console.log('- Time:', gameTime);
        window.authManager.submitScore(finalScore, coinsCollected, gameTime);
    } else {
        console.log('Level completed but user not logged in, cannot submit score');
    }

    // Show level completed message for 2 seconds, then show restart option
    setTimeout(() => {
        // Hide completion text
        completionText.destroy();
        scoreText.destroy();

        // Show game over modal with restart option
        gameOver();
    }, 2000);
}

function gameOver() {
    isGameOver = true;

    // Stop background music
    if (game && game.backgroundMusic) {
        game.backgroundMusic.stop();
    }

    // Show game over modal
    const modal = document.getElementById('game-over-modal');
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-coins').textContent = coinsCollected;
    document.getElementById('final-time').textContent = formatTime(gameTime);
    modal.classList.remove('hidden');

    // Submit score to leaderboard even on Game Over
    if (window.authManager && window.authManager.isLoggedIn) {
        window.authManager.submitScore(score, gameTime, coinsCollected);
        console.log('Game Over! Score:', score, '- submitted to leaderboard');
    } else {
        console.log('Game Over! Score:', score, '- not logged in, score not saved');
    }
}

function updateHUD() {
    document.getElementById('score').textContent = score;

    // Coins display is no longer in HUD (removed for cleaner UI)
    // const coinsElement = document.getElementById('coins');
    // if (coinsElement) coinsElement.textContent = coinsCollected;

    // Update hearts
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        heart.style.color = index < lives ? '#ff4757' : '#ccc';
    });
}

function updateTimer() {
    document.getElementById('timer').textContent = formatTime(gameTime);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update version display with current build info
function updateVersionDisplay() {
    const versionDisplay = document.getElementById('version-display');
    if (versionDisplay) {
        // Get current commit hash from HTML comment or use default
        const buildInfo = getBuildInfo();
        versionDisplay.textContent = buildInfo;
        console.log('Version display updated:', buildInfo);
    }
}

function getBuildInfo() {
    // Try to extract build info from HTML comments
    const html = document.documentElement.outerHTML;
    const buildMatch = html.match(/<!-- Build Info: Commit ([a-f0-9]+) - (.+) -->/);

    if (buildMatch) {
        const commitHash = buildMatch[1];
        const description = buildMatch[2];
        const shortHash = commitHash.substring(0, 7);
        return `v2.1.0 (${shortHash}) - ${description}`;
    }

    // Fallback version info
    return 'v2.1.0 - iOS Safari Support';
}

// Fullscreen functionality - now integrated into home screen
function setupFullscreenButton() {
    console.log('=== SETTING UP FULLSCREEN BUTTON ===');
    const fullscreenBtn = document.getElementById('home-fullscreen-btn');
    console.log('Fullscreen button element:', fullscreenBtn);

    if (fullscreenBtn) {
        console.log('Adding click event listener to fullscreen button');
        fullscreenBtn.addEventListener('click', (event) => {
            console.log('=== FULLSCREEN BUTTON CLICKED ===');
            console.log('Event:', event);
            console.log('Current fullscreen element:', document.fullscreenElement);
            toggleFullscreen();
        });
        console.log('Event listener added successfully');
    } else {
        console.error('Fullscreen button not found!');
    }
}

function toggleFullscreen() {
    console.log('=== TOGGLING FULLSCREEN ===');
    console.log('Current fullscreen element:', document.fullscreenElement);
    console.log('User Agent:', navigator.userAgent);
    console.log('Is iOS:', /iPad|iPhone|iPod/.test(navigator.userAgent));

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    // iOS Safari doesn't support Fullscreen API properly
    if (isIOS && isSafari) {
        console.log('iOS Safari detected - using iOS-specific fullscreen method');
        handleIOSFullscreen();
        return;
    }

    const elem = document.documentElement;

    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
        console.log('Entering fullscreen mode...');

        // Try different fullscreen methods for browser compatibility
        if (elem.requestFullscreen) {
            console.log('Using requestFullscreen()');
            elem.requestFullscreen().then(() => {
                console.log('Successfully entered fullscreen');
                updateFullscreenButton(true);
            }).catch(err => {
                console.log('Fullscreen error:', err);
                handleFullscreenFallback();
            });
        } else if (elem.webkitRequestFullscreen) {
            console.log('Using webkitRequestFullscreen()');
            elem.webkitRequestFullscreen();
            updateFullscreenButton(true);
        } else if (elem.mozRequestFullScreen) {
            console.log('Using mozRequestFullScreen()');
            elem.mozRequestFullScreen();
            updateFullscreenButton(true);
        } else if (elem.msRequestFullscreen) {
            console.log('Using msRequestFullscreen()');
            elem.msRequestFullscreen();
            updateFullscreenButton(true);
        } else {
            console.log('Fullscreen API not supported, using fallback');
            handleFullscreenFallback();
        }
    } else {
        console.log('Exiting fullscreen mode...');

        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen().then(() => {
                console.log('Successfully exited fullscreen');
                updateFullscreenButton(false);
            }).catch(err => {
                console.log('Error exiting fullscreen:', err);
            });
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
            updateFullscreenButton(false);
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
            updateFullscreenButton(false);
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
            updateFullscreenButton(false);
        }
    }
}

function handleIOSFullscreen() {
    console.log('=== HANDLING iOS FULLSCREEN (Poki-Style) ===');

    // Simple approach: Just scroll to hide address bar
    // iOS Safari will auto-hide the bars when scrolling
    setTimeout(() => {
        window.scrollTo(0, 1);
    }, 100);

    // Short helpful message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 280px;
    `;
    message.innerHTML = `📱 Tipp: Wische nach oben um die Browser-Leiste zu verstecken`;
    document.body.appendChild(message);

    updateFullscreenButton(true);

    setTimeout(() => {
        if (document.body.contains(message)) {
            document.body.removeChild(message);
        }
    }, 3000);
}

function handleFullscreenFallback() {
    console.log('Using fullscreen fallback - hiding mobile UI');
    hideMobileUI();
    updateFullscreenButton(true);

    // Show user a message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 10000;
        text-align: center;
        font-family: Arial, sans-serif;
    `;
    message.innerHTML = `
        <h3>📱 Vollbild-Modus aktiviert!</h3>
        <p>Browser-UI wurde minimiert</p>
        <p>Für echten Vollbild-Modus bitte F11 drücken</p>
    `;
    document.body.appendChild(message);

    setTimeout(() => {
        document.body.removeChild(message);
    }, 3000);
}

function updateFullscreenButton(isFullscreen) {
    const fullscreenBtn = document.getElementById('home-fullscreen-btn');
    const fullscreenIcon = document.querySelector('.fullscreen-icon');
    const fullscreenText = document.querySelector('.fullscreen-text');

    if (fullscreenBtn && fullscreenIcon && fullscreenText) {
        if (isFullscreen) {
            fullscreenIcon.textContent = '⛶';
            fullscreenText.textContent = 'Fenster';
            fullscreenBtn.title = 'Vollbild verlassen';

            // For iOS, change the click handler to exit mode
            fullscreenBtn.onclick = () => {
                console.log('Exiting iOS fullscreen mode');
                exitIOSFullscreen();
            };
        } else {
            fullscreenIcon.textContent = '⛶';
            fullscreenText.textContent = 'Vollbild';
            fullscreenBtn.title = 'Vollbild aktivieren';

            // Reset click handler to normal fullscreen
            fullscreenBtn.onclick = () => {
                console.log('iOS fullscreen button clicked');
                toggleFullscreen();
            };
        }
    }
}

function exitIOSFullscreen() {
    console.log('=== EXITING iOS FULLSCREEN ===');

    updateFullscreenButton(false);

    // Simple message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
    `;
    message.innerHTML = `📱 Vollbild-Modus beendet`;
    document.body.appendChild(message);

    setTimeout(() => {
        if (document.body.contains(message)) {
            document.body.removeChild(message);
        }
    }, 2000);
}

function hideMobileUI() {
    // Poki-Style: Keep it simple, just scroll
    window.scrollTo(0, 1);

    console.log('Mobile UI minimized (simple approach)');
}

function setupMobileControls() {
    leftBtn = document.getElementById('left-btn');
    rightBtn = document.getElementById('right-btn');
    jumpBtn = document.getElementById('jump-btn');

    if (leftBtn && rightBtn && jumpBtn) {
        // Add touch event listeners
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            leftBtn.isDown = true;
        });

        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            leftBtn.isDown = false;
        });

        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            rightBtn.isDown = true;
        });

        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            rightBtn.isDown = false;
        });

        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            jumpBtn.isDown = true;
        });

        jumpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            jumpBtn.isDown = false;
        });

        // Add mouse event listeners for desktop testing
        leftBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            leftBtn.isDown = true;
        });

        leftBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            leftBtn.isDown = false;
        });

        rightBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            rightBtn.isDown = true;
        });

        rightBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            rightBtn.isDown = false;
        });

        jumpBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            jumpBtn.isDown = true;
        });

        jumpBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            jumpBtn.isDown = false;
        });
    }
}

// Restart game function
function restartGame() {
    console.log('=== RESTARTING GAME ===');
    const modal = document.getElementById('game-over-modal');
    modal.classList.add('hidden');

    // Reset game state
    gameStarted = false;
    gameTime = 0;
    score = 0;
    lives = 3;
    coinsCollected = 0;
    isGameOver = false;
    isInvulnerable = false;

    console.log('Game state reset:');
    console.log('- gameTime:', gameTime);
    console.log('- coinsCollected:', coinsCollected);
    console.log('- score:', score);
    console.log('- lives:', lives);

    // Restart the current game scene
    if (game) {
        game.scene.restart();
        console.log('Game restarted!');
    } else {
        console.log('No game to restart');
    }
}

// Back to menu function
function backToMenu() {
    const modal = document.getElementById('game-over-modal');
    if (modal) {
        modal.classList.add('hidden');
    }

    const inGameMenu = document.getElementById('in-game-menu');
    if (inGameMenu) {
        inGameMenu.classList.add('hidden');
    }

    // Reset game state
    gameStarted = false;
    gameTime = 0;
    score = 0;
    lives = 3;
    coinsCollected = 0;
    isGameOver = false;
    isInvulnerable = false;

    // Show home screen
    const homeScreen = document.getElementById('home-screen');
    if (homeScreen) {
        homeScreen.classList.remove('hidden');
        console.log('Home screen shown');
    }

    // Destroy the current game
    if (game) {
        game.destroy(true);
        game = null;
    }

    console.log('Back to menu! Showing home screen.');
}

// In-game menu functions
function toggleInGameMenu() {
    console.log('toggleInGameMenu called');
    const inGameMenu = document.getElementById('in-game-menu');
    console.log('inGameMenu element:', inGameMenu);

    if (inGameMenu) {
        if (inGameMenu.classList.contains('hidden')) {
            console.log('Opening menu...');
            inGameMenu.classList.remove('hidden');
            // Pause the game
            if (game && game.scene) {
                game.scene.pause();
                console.log('Game paused');
            }
            console.log('In-game menu opened');
        } else {
            console.log('Closing menu...');
            inGameMenu.classList.add('hidden');
            // Resume the game
            if (game && game.scene) {
                game.scene.resume();
                console.log('Game resumed');
            }
            console.log('In-game menu closed');
        }
    } else {
        console.error('In-game menu element not found!');
    }
}

function resumeGame() {
    const inGameMenu = document.getElementById('in-game-menu');
    if (inGameMenu) {
        inGameMenu.classList.add('hidden');
    }

    // Resume the game
    if (game && game.scene) {
        game.scene.resume();
    }

    console.log('Game resumed');
}

function restartLevel() {
    console.log('=== RESTARTING LEVEL ===');
    const inGameMenu = document.getElementById('in-game-menu');
    if (inGameMenu) {
        inGameMenu.classList.add('hidden');
    }

    // Reset game state
    gameStarted = false;
    gameTime = 0;
    score = 0;
    lives = 3;
    coinsCollected = 0;
    isGameOver = false;
    isInvulnerable = false;

    console.log('Level state reset:');
    console.log('- gameTime:', gameTime);
    console.log('- coinsCollected:', coinsCollected);
    console.log('- score:', score);
    console.log('- lives:', lives);

    // Restart the current game scene
    if (game) {
        game.scene.restart();
        console.log('Level restarted');
    } else {
        console.log('No game to restart');
    }
}

function openShop() {
    console.log('Shop opened');
    const shopModal = document.getElementById('shop-modal');
    if (shopModal) {
        shopModal.classList.remove('hidden');
        updateShopDisplay();
    }
}

// Shop System
let totalCoins = 0;
let ownedSkins = ['standard'];
let currentSkin = 'standard';

function openHomeShop() {
    console.log('Opening home shop...');
    const shopModal = document.getElementById('shop-modal');
    if (shopModal) {
        shopModal.classList.remove('hidden');
        updateShopDisplay();
    }
}

function updateShopDisplay() {
    // Load coins from localStorage
    const savedCoins = localStorage.getItem('jumpit_coins');
    if (savedCoins) {
        totalCoins = parseInt(savedCoins);
    }

    // Update coin display
    const shopCoinsElement = document.getElementById('shop-coins');
    if (shopCoinsElement) {
        shopCoinsElement.textContent = totalCoins;
    }

    // HUD coins display removed for cleaner UI
    // const hudCoinsElement = document.getElementById('coins');
    // if (hudCoinsElement) {
    //     hudCoinsElement.textContent = totalCoins;
    // }

    // Load owned skins from localStorage
    const savedSkins = localStorage.getItem('jumpit_skins');
    if (savedSkins) {
        ownedSkins = JSON.parse(savedSkins);
    }

    // Load current skin from localStorage
    const savedSkin = localStorage.getItem('jumpit_current_skin');
    if (savedSkin) {
        currentSkin = savedSkin;
    }

    // Update shop buttons
    updateShopButtons();
}

function updateShopButtons() {
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        const skin = button.getAttribute('data-skin');
        const price = getSkinPrice(skin);

        if (skin === 'standard') {
            button.disabled = true;
            button.textContent = currentSkin === 'standard' ? 'Ausgewählt' : 'Kostenlos';
        } else if (ownedSkins.includes(skin)) {
            button.disabled = false;
            button.textContent = currentSkin === skin ? 'Ausgewählt' : 'Auswählen';
            button.classList.add('owned');
        } else if (totalCoins >= price) {
            button.disabled = false;
            button.textContent = `Kaufen (${price})`;
            button.classList.remove('owned');
        } else {
            button.disabled = true;
            button.textContent = `Zu teuer (${price})`;
            button.classList.remove('owned');
        }
    });
}

function getSkinPrice(skin) {
    const prices = {
        'standard': 0,
        'werewolf': 50,
        'ghost': 100,
        'fire': 150
    };
    return prices[skin] || 0;
}

function buySkin(skin) {
    const price = getSkinPrice(skin);

    if (skin === 'standard') {
        currentSkin = 'standard';
        saveCurrentSkin();
        updateShopButtons();
        return;
    }

    if (ownedSkins.includes(skin)) {
        currentSkin = skin;
        saveCurrentSkin();
        updateShopButtons();
        return;
    }

    if (totalCoins >= price) {
        totalCoins -= price;
        ownedSkins.push(skin);
        currentSkin = skin;

        // Save to localStorage
        localStorage.setItem('jumpit_coins', totalCoins.toString());
        localStorage.setItem('jumpit_skins', JSON.stringify(ownedSkins));
        saveCurrentSkin();

        // Update display
        updateShopDisplay();

        console.log(`Skin ${skin} gekauft! Verbleibende Münzen: ${totalCoins}`);
    }
}

function saveCurrentSkin() {
    localStorage.setItem('jumpit_current_skin', currentSkin);
}

function addCoins(amount) {
    totalCoins += amount;
    localStorage.setItem('jumpit_coins', totalCoins.toString());

    // HUD coins display removed for cleaner UI
    // const hudCoinsElement = document.getElementById('coins');
    // if (hudCoinsElement) {
    //     hudCoinsElement.textContent = totalCoins;
    // }

    console.log(`${amount} Münzen hinzugefügt! Gesamt: ${totalCoins}`);
}

function createDynamicBackground() {
    console.log('Creating dynamic background...');

    // Select a random background theme
    const bg = backgrounds[currentBackgroundIndex];
    currentBackgroundIndex = (currentBackgroundIndex + 1) % backgrounds.length;

    console.log('Using background:', bg.name);

    // Create gradient background that covers the entire world
    const graphics = this.add.graphics();

    // Create vertical gradient across the entire world width
    const height = WORLD_HEIGHT;
    const steps = 100;
    const stepHeight = height / steps;

    for (let i = 0; i < steps; i++) {
        const ratio = i / steps;
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.HexStringToColor(bg.gradient[0]),
            Phaser.Display.Color.HexStringToColor(bg.gradient[1]),
            steps,
            i
        );

        graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
        graphics.fillRect(0, i * stepHeight, WORLD_WIDTH, stepHeight + 1);
    }

    // Add some decorative elements
    addClouds.call(this);

    graphics.destroy();
}

function addClouds() {
    // Add floating clouds for atmosphere across the entire world
    for (let i = 0; i < 12; i++) { // More clouds for the larger world
        const cloud = this.add.graphics();
        const x = Math.random() * (WORLD_WIDTH - 100) + 50;
        const y = Math.random() * 200 + 50;

        cloud.fillStyle(0xFFFFFF, 0.6);
        cloud.fillCircle(x, y, 20);
        cloud.fillCircle(x + 15, y, 25);
        cloud.fillCircle(x + 30, y, 20);
        cloud.fillCircle(x + 15, y - 15, 15);

        cloud.generateTexture('cloud-' + i, 60, 40);
        cloud.destroy();

        const cloudSprite = this.add.sprite(x, y, 'cloud-' + i);
        cloudSprite.setAlpha(0.6);
        cloudSprite.setDepth(-1); // Behind everything else

        // Gentle floating animation
        this.tweens.add({
            targets: cloudSprite,
            x: x + (Math.random() - 0.5) * 100, // Larger movement range
            y: y + (Math.random() - 0.5) * 30,
            duration: 3000 + Math.random() * 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}

// Event listeners for UI
document.addEventListener('DOMContentLoaded', () => {
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', restartGame);
    }

    // Back to menu button event listener
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', backToMenu);
    }

    // Play button event listener
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            console.log('Play button clicked');

            // Try to start music on first user interaction
            if (window.game && window.game.backgroundMusic) {
                try {
                    window.game.backgroundMusic.start();
                    console.log('Werewolf music started on button click');
                } catch (error) {
                    console.log('Music start failed:', error);
                }
            }

            // Start authentication flow
            if (window.authManager) {
                window.authManager.checkAuthStatus();
            } else {
                // Fallback: start game directly
                console.log('No auth manager found, starting game directly');
                startGame();
            }
        });
    }

    // In-game menu button event listener
    const menuBtn = document.getElementById('menu-btn');
    console.log('Menu button element:', menuBtn);
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            console.log('Menu button clicked!');
            toggleInGameMenu();
        });
    } else {
        console.error('Menu button not found!');
    }

    // Home shop button event listener
    const homeShopBtn = document.getElementById('home-shop-btn');
    console.log('Home shop button element:', homeShopBtn);
    if (homeShopBtn) {
        homeShopBtn.addEventListener('click', () => {
            console.log('Home shop button clicked!');
            openHomeShop();
        });
    } else {
        console.error('Home shop button not found!');
    }

    // Home leaderboard button event listener
    const homeLeaderboardBtn = document.getElementById('home-leaderboard-btn');
    console.log('Home leaderboard button element:', homeLeaderboardBtn);
    if (homeLeaderboardBtn) {
        homeLeaderboardBtn.addEventListener('click', (e) => {
            console.log('Home leaderboard button clicked!', e);
            console.log('showLeaderboard function exists:', typeof showLeaderboard);
            showLeaderboard();
        });
    } else {
        console.error('Home leaderboard button not found!');
    }

    // NOTE: Logout button is registered in auth.js to avoid conflicts

    // Shop modal event listeners
    const shopModal = document.getElementById('shop-modal');
    const closeShopBtn = document.getElementById('close-shop');

    if (closeShopBtn) {
        closeShopBtn.addEventListener('click', () => {
            if (shopModal) {
                shopModal.classList.add('hidden');
            }
        });
    }

    // Shop item buy buttons
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const skin = button.getAttribute('data-skin');
            if (skin) {
                buySkin(skin);
            }
        });
    });

    // In-game menu buttons
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', resumeGame);
    }

    const restartLevelBtn = document.getElementById('restart-level-btn');
    if (restartLevelBtn) {
        restartLevelBtn.addEventListener('click', restartLevel);
    }

    const mainMenuBtn = document.getElementById('main-menu-btn');
    if (mainMenuBtn) {
        mainMenuBtn.addEventListener('click', backToMenu);
    }

});
