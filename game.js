// SHAPES and Tetromino
const SHAPES = {
    I: {
        color: '#38bdf8',
        matrix: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    J: {
        color: '#818cf8',
        matrix: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    L: {
        color: '#fb923c',
        matrix: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    O: {
        color: '#facc15',
        matrix: [
            [1, 1],
            [1, 1]
        ]
    },
    S: {
        color: '#4ade80',
        matrix: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ]
    },
    T: {
        color: '#c084fc',
        matrix: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    Z: {
        color: '#f87171',
        matrix: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ]
    }
};

class Tetromino {
    constructor(shapeKey) {
        this.shapeKey = shapeKey;
        this.definition = SHAPES[shapeKey];
        this.matrix = this.definition.matrix.map(row => [...row]);
        this.color = this.definition.color;
        this.x = 0;
        this.y = 0;
    }

    rotate() {
        const N = this.matrix.length;
        const rotated = this.matrix.map((row, i) =>
            row.map((val, j) => this.matrix[N - 1 - j][i])
        );
        this.matrix = rotated;
    }

    clone() {
        const clone = new Tetromino(this.shapeKey);
        clone.matrix = this.matrix.map(row => [...row]);
        clone.x = this.x;
        clone.y = this.y;
        return clone;
    }
}

function getRandomTetromino() {
    const keys = Object.keys(SHAPES);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return new Tetromino(randomKey);
}

// Grid
class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = Array(height).fill().map(() => Array(width).fill(null));
    }

    isValidPosition(tetromino) {
        for (let r = 0; r < tetromino.matrix.length; r++) {
            for (let c = 0; c < tetromino.matrix[r].length; c++) {
                if (tetromino.matrix[r][c]) {
                    const x = tetromino.x + c;
                    const y = tetromino.y + r;
                    if (x < 0 || x >= this.width || y >= this.height) {
                        return false;
                    }
                    if (y >= 0 && this.grid[y][x]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    lockTetromino(tetromino) {
        for (let r = 0; r < tetromino.matrix.length; r++) {
            for (let c = 0; c < tetromino.matrix[r].length; c++) {
                if (tetromino.matrix[r][c]) {
                    const x = tetromino.x + c;
                    const y = tetromino.y + r;
                    if (y >= 0 && y < this.height) {
                        this.grid[y][x] = tetromino.color;
                    }
                }
            }
        }
    }

    findFullLines() {
        const fullLines = [];
        for (let r = this.height - 1; r >= 0; r--) {
            if (this.grid[r].every(cell => cell !== null)) {
                fullLines.push(r);
            }
        }
        return fullLines;
    }

    removeLines(lines) {
        lines.sort((a, b) => b - a);
        for (const r of lines) {
            this.grid.splice(r, 1);
            this.grid.unshift(Array(this.width).fill(null));
        }
        return lines.length;
    }

    reset() {
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(null));
    }
}

// Renderer
class Renderer {
    constructor(canvas, grid, blockSize = 30) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = grid;
        this.updateSize(blockSize);
    }

    updateSize(blockSize) {
        this.blockSize = blockSize;
        this.canvas.width = this.grid.width * this.blockSize;
        this.canvas.height = this.grid.height * this.blockSize;
    }

    draw(activeTetromino, flashingRows = [], flashOn = false, dropTrails = [], particles = []) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGridLines();
        this.drawGrid(flashingRows, flashOn);
        this.drawDropTrails(dropTrails);

        if (activeTetromino) {
            this.drawGhost(activeTetromino);
            this.drawTetromino(activeTetromino);
        }

        this.drawParticles(particles);
    }

    drawGridLines() {
        this.ctx.strokeStyle = 'rgba(219, 39, 119, 0.1)';
        this.ctx.lineWidth = 1;
        for (let c = 1; c < this.grid.width; c++) {
            this.ctx.beginPath();
            this.ctx.moveTo(c * this.blockSize + 0.5, 0);
            this.ctx.lineTo(c * this.blockSize + 0.5, this.canvas.height);
            this.ctx.stroke();
        }
        for (let r = 1; r < this.grid.height; r++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, r * this.blockSize + 0.5);
            this.ctx.lineTo(this.canvas.width, r * this.blockSize + 0.5);
            this.ctx.stroke();
        }
    }

    drawGrid(flashingRows = [], flashOn = false) {
        for (let r = 0; r < this.grid.height; r++) {
            for (let c = 0; c < this.grid.width; c++) {
                if (this.grid.grid[r][c]) {
                    if (flashingRows.includes(r) && flashOn) {
                        this.drawBlock(c, r, '#ffffff');
                    } else {
                        this.drawBlock(c, r, this.grid.grid[r][c]);
                    }
                }
            }
        }
    }

    drawTetromino(tetromino) {
        for (let r = 0; r < tetromino.matrix.length; r++) {
            for (let c = 0; c < tetromino.matrix[r].length; c++) {
                if (tetromino.matrix[r][c]) {
                    this.drawBlock(tetromino.x + c, tetromino.y + r, tetromino.color);
                }
            }
        }
    }

    drawGhost(tetromino) {
        const ghost = tetromino.clone();
        while (this.grid.isValidPosition(ghost)) {
            ghost.y++;
        }
        ghost.y--;

        this.ctx.globalAlpha = 0.2;
        this.drawTetromino(ghost);
        this.ctx.globalAlpha = 1.0;
    }

    drawBlock(x, y, color) {
        const bs = this.blockSize;
        const gap = 1;
        const radius = Math.min(4, bs * 0.15);
        const px = x * bs + gap;
        const py = y * bs + gap;
        const size = bs - gap * 2;

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.roundRect(px, py, size, size, radius);
        this.ctx.fill();

        // Highlight top
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(px + 2, py + 2, size - 4, Math.max(2, size * 0.15));

        // Shadow bottom-right
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(px + size - 2, py + 2, 2, size - 4);
        this.ctx.fillRect(px + 2, py + size - 2, size - 4, 2);
    }

    drawPreview(canvas, tetromino) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!tetromino) return;

        const matSize = tetromino.matrix.length;
        const previewBlockSize = Math.floor(Math.min(canvas.width, canvas.height) / (matSize + 0.5));
        const offsetX = (canvas.width - matSize * previewBlockSize) / 2;
        const offsetY = (canvas.height - matSize * previewBlockSize) / 2;

        for (let r = 0; r < matSize; r++) {
            for (let c = 0; c < matSize; c++) {
                if (tetromino.matrix[r][c]) {
                    const gap = 1;
                    const radius = Math.min(4, previewBlockSize * 0.15);
                    const px = offsetX + c * previewBlockSize + gap;
                    const py = offsetY + r * previewBlockSize + gap;
                    const size = previewBlockSize - gap * 2;

                    ctx.fillStyle = tetromino.color;
                    ctx.beginPath();
                    ctx.roundRect(px, py, size, size, radius);
                    ctx.fill();

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.fillRect(px + 2, py + 2, size - 4, Math.max(2, size * 0.15));
                }
            }
        }
    }

    drawDropTrails(trails) {
        for (const trail of trails) {
            const alpha = (trail.timer / trail.maxTimer) * 0.4;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = trail.color;
            const bs = this.blockSize;
            for (let y = trail.startY; y < trail.endY; y++) {
                this.ctx.fillRect(trail.x * bs + 2, y * bs, bs - 4, bs);
            }
            this.ctx.globalAlpha = 1.0;
        }
    }

    drawParticles(particles) {
        for (const p of particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        this.ctx.globalAlpha = 1.0;
    }
}

// Particle
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 1) * 6;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
        this.size = 3 + Math.random() * 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15;
        this.life -= this.decay;
    }

    get alive() {
        return this.life > 0;
    }
}

// Sound Manager
class SoundManager {
    constructor() {
        this.sounds = {
            clear1: 'assets/meow_short.mp3',
            clear2: 'assets/meow_excited.mp3',
            clear4: 'assets/purr_celebration.mp3',
            gameOver: 'assets/sad_meow.mp3'
        };
        this.muted = localStorage.getItem('loltetris-muted') === 'true';
        this.audioCache = {};
    }

    preload() {
        for (const [key, src] of Object.entries(this.sounds)) {
            const audio = new Audio(src);
            audio.preload = 'auto';
            this.audioCache[key] = audio;
        }
    }

    play(key) {
        if (this.muted || !this.audioCache[key]) return;
        const sound = this.audioCache[key].cloneNode(true);
        sound.volume = 0.6;
        sound.play().catch(() => {});
    }

    playClear(lines) {
        if (lines >= 4) this.play('clear4');
        else if (lines >= 2) this.play('clear2');
        else this.play('clear1');
    }

    playGameOver() {
        this.play('gameOver');
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('loltetris-muted', this.muted);
        return this.muted;
    }
}

// Haptic feedback helper
function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

// Input
class Input {
    constructor(game) {
        this.game = game;
        this.lastSwipeTime = 0;
        this.setupListeners();
        this.setupSwipeControls();
    }

    setupListeners() {
        document.addEventListener('keydown', (event) => {
            // Prevent arrow key / space page scrolling
            if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(event.code)) {
                event.preventDefault();
            }

            // Escape toggles pause anytime
            if (event.code === 'Escape') {
                this.game.togglePause();
                return;
            }

            if (this.game.isGameOver || !this.game.isRunning || this.game.isPaused) return;

            switch (event.code) {
                case 'ArrowLeft':
                    this.game.move(-1);
                    break;
                case 'ArrowRight':
                    this.game.move(1);
                    break;
                case 'ArrowDown':
                    this.game.drop();
                    break;
                case 'ArrowUp':
                    this.game.rotate();
                    break;
                case 'Space':
                    this.game.hardDrop();
                    break;
            }
        });
    }

    setupSwipeControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        const minSwipeDistance = 30;

        const handleGesture = () => {
            const now = Date.now();
            if (now - this.lastSwipeTime < 150) return;
            this.lastSwipeTime = now;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance < minSwipeDistance) {
                this.game.rotate();
                return;
            }

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) this.game.move(1);
                    else this.game.move(-1);
                }
            } else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) this.game.hardDrop();
                    else this.game.rotate();
                }
            }
        };

        const preventDefault = (e) => {
            if (e.target.id !== 'action-btn' && e.target.id !== 'restart-btn' &&
                e.target.id !== 'resume-btn' && e.target.id !== 'mute-btn' &&
                !e.target.closest('#reward-container')) {
                e.preventDefault();
            }
        };

        document.addEventListener('touchstart', (e) => {
            preventDefault(e);
            touchStartX = e.changedTouches[0].clientX;
            touchStartY = e.changedTouches[0].clientY;
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            preventDefault(e);
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
            handleGesture();
        }, { passive: false });
    }

}

// Game
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.grid = new Grid(10, 20);

        this.resize();

        this.renderer = new Renderer(this.canvas, this.grid, this.blockSize);
        this.input = new Input(this);
        this.soundManager = new SoundManager();
        this.soundManager.preload();

        // UI elements
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.finalScoreElement = document.getElementById('final-score');
        this.highScoreElement = document.getElementById('high-score');
        this.highScoreOverlayElement = document.getElementById('high-score-overlay');

        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.actionBtn = document.getElementById('action-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.resumeBtn = document.getElementById('resume-btn');
        this.muteBtn = document.getElementById('mute-btn');

        this.rewardContainer = document.getElementById('reward-container');
        this.previewCanvas = document.getElementById('preview-canvas');

        // Game state
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.highScore = parseInt(localStorage.getItem('loltetris-highscore')) || 0;

        this.activeTetromino = null;
        this.nextTetromino = null;
        this.combo = 0;

        this.isGameOver = false;
        this.isRunning = false;
        this.isPaused = false;
        this.isRewardActive = false;

        this.lastTime = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;

        // Lock delay
        this.lockTimer = 500;
        this.lockDelay = 500;

        // Clear animation
        this.isClearAnimating = false;
        this.clearingLines = [];
        this.clearAnimTimer = 0;
        this.clearAnimDuration = 400;

        // Particles & trails
        this.particles = [];
        this.maxParticles = 200;
        this.dropTrails = [];

        this.loop = this.loop.bind(this);
        this.setupUIListeners();
        this.updateHighScoreDisplay();
        this.preloadImages();

        window.addEventListener('resize', () => {
            this.resize();
            this.renderer.updateSize(this.blockSize);
            this.renderer.draw(this.activeTetromino);
        });
    }

    resize() {
        const gameInfo = document.querySelector('.game-info');
        const isMobile = window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches;

        let availableHeight, availableWidth;

        if (isMobile) {
            const sidebarW = gameInfo ? gameInfo.offsetWidth : 0;
            availableHeight = window.innerHeight - 8;
            availableWidth = window.innerWidth - sidebarW - 8;
        } else {
            const sidebarW = gameInfo ? gameInfo.offsetWidth : 0;
            availableHeight = window.innerHeight - 120;
            availableWidth = window.innerWidth - sidebarW - 120;
        }

        const maxBlockHeight = Math.floor(availableHeight / this.grid.height);
        const maxBlockWidth = Math.floor(availableWidth / this.grid.width);

        this.blockSize = Math.max(12, Math.min(50, maxBlockHeight, maxBlockWidth));

        if (this.canvas) {
            this.canvas.width = this.grid.width * this.blockSize;
            this.canvas.height = this.grid.height * this.blockSize;
        }
    }

    setupUIListeners() {
        this.restartBtn.addEventListener('click', () => {
            this.gameOverOverlay.classList.add('hidden');
            this.start();
        });

        this.actionBtn.addEventListener('click', () => {
            if (!this.isRunning && !this.isGameOver) {
                this.start();
            } else if (this.isGameOver) {
                this.gameOverOverlay.classList.add('hidden');
                this.start();
            } else {
                this.togglePause();
            }
            this.actionBtn.blur();
        });

        this.resumeBtn.addEventListener('click', () => this.togglePause());

        if (this.muteBtn) {
            this.muteBtn.textContent = this.soundManager.muted ? '🔇' : '🔊';
            this.muteBtn.addEventListener('click', () => {
                const muted = this.soundManager.toggleMute();
                this.muteBtn.textContent = muted ? '🔇' : '🔊';
            });
        }

        // Reward dismissal
        const dismissReward = (e) => {
            if (e.type === 'touchstart') e.preventDefault();
            if (this.isRewardActive) {
                this.isRewardActive = false;
                this.isPaused = false;
                this.rewardContainer.classList.remove('show');
                this.updateActionButton();
                this.lastTime = performance.now();
                requestAnimationFrame(this.loop);
            }
        };

        this.rewardContainer.addEventListener('click', dismissReward);
        this.rewardContainer.addEventListener('touchstart', dismissReward, { passive: false });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning && !this.isPaused && !this.isRewardActive) {
                this.togglePause();
            }
        });
    }

    start() {
        if (this.isRunning && !this.isGameOver) return;

        this.grid.reset();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.updateScoreDisplay();

        this.isGameOver = false;
        this.isRunning = true;
        this.isPaused = false;
        this.isRewardActive = false;
        this.isClearAnimating = false;
        this.particles = [];
        this.dropTrails = [];
        this.updateActionButton();

        // Generate first next piece and spawn
        this.nextTetromino = getRandomTetromino();
        this.spawnTetromino();

        this.lastTime = 0;
        this.dropCounter = 0;
        requestAnimationFrame(this.loop);
    }

    togglePause() {
        if (!this.isRunning || this.isGameOver) return;

        this.isPaused = !this.isPaused;
        this.updateActionButton();

        if (this.isPaused) {
            this.pauseOverlay.classList.remove('hidden');
        } else {
            this.pauseOverlay.classList.add('hidden');
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop);
        }
    }

    updateActionButton() {
        if (this.isGameOver) {
            this.actionBtn.textContent = "PLZ PLAY AGAIN?";
        } else if (this.isPaused || this.isRewardActive) {
            this.actionBtn.textContent = "RESUME";
        } else if (this.isRunning) {
            this.actionBtn.textContent = "PAUSE";
        } else {
            this.actionBtn.textContent = "I CAN HAS GAME?";
        }
    }

    spawnTetromino() {
        this.activeTetromino = this.nextTetromino;
        this.nextTetromino = getRandomTetromino();

        this.activeTetromino.x = Math.floor(this.grid.width / 2) - Math.floor(this.activeTetromino.matrix[0].length / 2);
        this.activeTetromino.y = 0;
        this.lockTimer = this.lockDelay;

        // Update preview
        if (this.previewCanvas) this.renderer.drawPreview(this.previewCanvas, this.nextTetromino);

        if (!this.grid.isValidPosition(this.activeTetromino)) {
            this.gameOver();
        }
    }

    move(dir) {
        if (!this.isRunning || this.isPaused || this.isClearAnimating) return;

        this.activeTetromino.x += dir;
        if (!this.grid.isValidPosition(this.activeTetromino)) {
            this.activeTetromino.x -= dir;
        } else {
            this.lockTimer = this.lockDelay;
            vibrate(10);
        }
    }

    rotate() {
        if (!this.isRunning || this.isPaused || this.isClearAnimating) return;

        const originalMatrix = this.activeTetromino.matrix;
        this.activeTetromino.rotate();

        if (!this.grid.isValidPosition(this.activeTetromino)) {
            this.activeTetromino.x -= 1;
            if (!this.grid.isValidPosition(this.activeTetromino)) {
                this.activeTetromino.x += 2;
                if (!this.grid.isValidPosition(this.activeTetromino)) {
                    this.activeTetromino.x -= 1;
                    this.activeTetromino.matrix = originalMatrix;
                    return;
                }
            }
        }
        this.lockTimer = this.lockDelay;
    }

    drop() {
        if (!this.isRunning || this.isPaused || this.isClearAnimating) return;

        this.activeTetromino.y++;
        if (!this.grid.isValidPosition(this.activeTetromino)) {
            this.activeTetromino.y--;
            // Lock delay handles locking, not here
        }
        this.dropCounter = 0;
    }

    hardDrop() {
        if (!this.isRunning || this.isPaused || this.isClearAnimating) return;

        const startY = this.activeTetromino.y;
        while (this.grid.isValidPosition(this.activeTetromino)) {
            this.activeTetromino.y++;
        }
        this.activeTetromino.y--;

        // Create drop trail
        const endY = this.activeTetromino.y;
        if (endY > startY) {
            for (let r = 0; r < this.activeTetromino.matrix.length; r++) {
                for (let c = 0; c < this.activeTetromino.matrix[r].length; c++) {
                    if (this.activeTetromino.matrix[r][c]) {
                        this.dropTrails.push({
                            x: this.activeTetromino.x + c,
                            startY: startY + r,
                            endY: endY + r,
                            color: this.activeTetromino.color,
                            timer: 200,
                            maxTimer: 200
                        });
                    }
                }
            }
        }

        vibrate(30);
        this.lock(); // Hard drop bypasses lock delay
        this.dropCounter = 0;
    }

    lock() {
        this.grid.lockTetromino(this.activeTetromino);
        vibrate(30);

        const fullLines = this.grid.findFullLines();

        if (fullLines.length > 0) {
            // Start clear animation
            this.isClearAnimating = true;
            this.clearingLines = fullLines;
            this.clearAnimTimer = this.clearAnimDuration;
            this.activeTetromino = null; // Don't draw locked piece twice

            this.spawnClearParticles(fullLines);

            // Screen shake for Tetris (4 lines)
            if (fullLines.length === 4) {
                this.canvas.classList.add('shake');
                setTimeout(() => this.canvas.classList.remove('shake'), 300);
            }
        } else {
            // No lines cleared - reset combo
            this.combo = 0;
            this.spawnTetromino();
        }
    }

    finishClearAnimation() {
        this.isClearAnimating = false;
        const cleared = this.grid.removeLines(this.clearingLines);
        this.clearingLines = [];

        this.combo++;
        this.updateScore(cleared);

        this.spawnTetromino();
    }

    spawnClearParticles(rows) {
        for (const r of rows) {
            for (let c = 0; c < this.grid.width; c++) {
                const color = this.grid.grid[r][c] || '#ffffff';
                const baseX = c * this.blockSize + this.blockSize / 2;
                const baseY = r * this.blockSize + this.blockSize / 2;
                const perCell = Math.ceil(30 / this.grid.width);
                for (let i = 0; i < perCell; i++) {
                    if (this.particles.length >= this.maxParticles) return;
                    this.particles.push(new Particle(baseX, baseY, color));
                }
            }
        }
    }

    updateScore(linesCleared = 0) {
        if (linesCleared > 0) {
            const points = [0, 40, 100, 300, 1200];
            this.score += points[linesCleared] * this.level;

            // Combo bonus
            if (this.combo > 1) {
                this.score += 50 * this.combo * this.level;
            }

            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);

            // Update high score
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('loltetris-highscore', this.highScore);
            }

            // Haptic
            if (linesCleared === 4) {
                vibrate([50, 30, 50, 30, 50]);
            } else {
                vibrate(50);
            }

            this.showRewardCat(linesCleared);
        }

        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.updateHighScoreDisplay();
    }

    updateHighScoreDisplay() {
        if (this.highScoreElement) {
            this.highScoreElement.textContent = this.highScore;
        }
    }

    preloadImages() {
        const images = [];
        for (let i = 1; i <= 18; i++) images.push(`assets/cat${i}.jpg`);
        images.push('assets/lolcat_laser_eyes.svg', 'assets/lolcat_surprised_wow.svg',
            'assets/lolcat_happy_burger.svg', 'assets/lolcat_grumpy_no.svg');
        for (const src of images) {
            const img = new Image();
            img.src = src;
        }
    }

    showRewardCat(lines) {
        const CAT_COUNT = 18;
        const cats = [];
        for (let i = 1; i <= CAT_COUNT; i++) cats.push(`assets/cat${i}.jpg`);

        let src;
        if (lines === 4) {
            src = 'assets/lolcat_laser_eyes.svg';
        } else if (lines >= 2) {
            src = 'assets/lolcat_surprised_wow.svg';
        } else {
            src = Math.random() < 0.5
                ? 'assets/lolcat_happy_burger.svg'
                : cats[Math.floor(Math.random() * cats.length)];
        }

        const rewardImage = document.getElementById('reward-image');
        rewardImage.src = src;
        this.rewardContainer.classList.add('show');
        this.soundManager.playClear(lines);

        this.isPaused = true;
        this.isRewardActive = true;
        this.updateActionButton();
    }

    gameOver() {
        this.isRunning = false;
        this.isGameOver = true;
        this.updateActionButton();
        vibrate(200);
        this.soundManager.playGameOver();

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('loltetris-highscore', this.highScore);
        }

        const rewardImage = document.getElementById('reward-image');
        rewardImage.src = 'assets/lolcat_grumpy_no.svg';
        this.rewardContainer.classList.add('show');
        setTimeout(() => this.rewardContainer.classList.remove('show'), 3000);

        this.finalScoreElement.textContent = this.score;
        if (this.highScoreOverlayElement) {
            this.highScoreOverlayElement.textContent = this.highScore;
        }
        this.updateHighScoreDisplay();
        this.gameOverOverlay.classList.remove('hidden');
    }

    loop(time = 0) {
        if (!this.isRunning || this.isPaused) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        // Update particles
        this.particles = this.particles.filter(p => {
            p.update();
            return p.alive;
        });

        // Update drop trails
        this.dropTrails = this.dropTrails.filter(t => {
            t.timer -= deltaTime;
            return t.timer > 0;
        });

        // Clear animation in progress
        if (this.isClearAnimating) {
            this.clearAnimTimer -= deltaTime;
            if (this.clearAnimTimer <= 0) {
                this.finishClearAnimation();
                if (!this.isRunning) return; // Game over during spawn
            } else {
                const progress = 1 - (this.clearAnimTimer / this.clearAnimDuration);
                const flashOn = Math.floor(progress * 6) % 2 === 0;
                this.renderer.draw(this.activeTetromino, this.clearingLines, flashOn, this.dropTrails, this.particles);
                requestAnimationFrame(this.loop);
                return;
            }
        }

        // Gravity
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.drop();
            this.dropCounter = 0;
        }

        // Lock delay
        if (this.activeTetromino && !this.isClearAnimating) {
            const test = this.activeTetromino.clone();
            test.y++;
            if (!this.grid.isValidPosition(test)) {
                this.lockTimer -= deltaTime;
                if (this.lockTimer <= 0) {
                    this.lock();
                    if (!this.isRunning) return; // Game over
                }
            } else {
                this.lockTimer = this.lockDelay;
            }
        }

        this.renderer.draw(this.activeTetromino, [], false, this.dropTrails, this.particles);
        requestAnimationFrame(this.loop);
    }
}

// Initialize Game
const game = new Game();
game.renderer.draw(null);
