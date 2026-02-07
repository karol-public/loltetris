// SHAPES and Tetromino
const SHAPES = {
    I: {
        color: '#38bdf8', // Cyan
        matrix: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    J: {
        color: '#818cf8', // Indigo
        matrix: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    L: {
        color: '#fb923c', // Orange
        matrix: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    O: {
        color: '#facc15', // Yellow
        matrix: [
            [1, 1],
            [1, 1]
        ]
    },
    S: {
        color: '#4ade80', // Green
        matrix: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ]
    },
    T: {
        color: '#c084fc', // Purple
        matrix: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    Z: {
        color: '#f87171', // Red
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

    // Clone for collision testing
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

                    // Check bounds
                    if (x < 0 || x >= this.width || y >= this.height) {
                        return false;
                    }

                    // Check collision with locked pieces
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
                    // Only lock if within bounds (ignore top out for now, handled by game over)
                    if (y >= 0 && y < this.height) {
                        this.grid[y][x] = tetromino.color;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        for (let r = this.height - 1; r >= 0; r--) {
            if (this.grid[r].every(cell => cell !== null)) {
                this.grid.splice(r, 1);
                this.grid.unshift(Array(this.width).fill(null));
                linesCleared++;
                r++; // Check the same row index again as rows shifted down
            }
        }
        return linesCleared;
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

    draw(activeTetromino) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        if (activeTetromino) {
            this.drawTetromino(activeTetromino);
            this.drawGhost(activeTetromino);
        }
    }

    drawGrid() {
        for (let r = 0; r < this.grid.height; r++) {
            for (let c = 0; c < this.grid.width; c++) {
                if (this.grid.grid[r][c]) {
                    this.drawBlock(c, r, this.grid.grid[r][c]);
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
        ghost.y--; // Step back to valid position

        this.ctx.globalAlpha = 0.2;
        this.drawTetromino(ghost);
        this.ctx.globalAlpha = 1.0;
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);

        // Add inner shadow/highlight for 3D effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, 2);
        this.ctx.fillRect(x * this.blockSize, y * this.blockSize, 2, this.blockSize);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect((x + 1) * this.blockSize - 2, y * this.blockSize, 2, this.blockSize);
        this.ctx.fillRect(x * this.blockSize, (y + 1) * this.blockSize - 2, this.blockSize, 2);
    }
}

// Input
class Input {
    constructor(game) {
        this.game = game;
        this.setupListeners();
        this.setupSwipeControls();
    }

    setupListeners() {
        document.addEventListener('keydown', (event) => {
            if (this.game.isGameOver) return;

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

        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.game.start();
                startBtn.blur(); // Remove focus so spacebar doesn't trigger click
            });
        }
    }

    setupSwipeControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        const minSwipeDistance = 30; // Minimum distance for a swipe

        const handleGesture = () => {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal Swipe
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        // Right
                        this.game.move(1);
                    } else {
                        // Left
                        this.game.move(-1);
                    }
                }
            } else {
                // Vertical Swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        // Down - Hard Drop (instant bottom)
                        this.game.hardDrop();
                    } else {
                        // Up - Rotate
                        this.game.rotate();
                    }
                }
            }
        };

        const preventDefault = (e) => {
            if (e.target.id !== 'action-btn' && e.target.id !== 'restart-btn' && e.target.id !== 'resume-btn' && e.target.closest('#reward-container')) {
                e.preventDefault();
            }
        };

        document.addEventListener('touchstart', (e) => {
            preventDefault(e);
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            preventDefault(e);
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleGesture();
        }, { passive: false });
    }
}

// Game
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.grid = new Grid(10, 20);

        // Initial Resize to set dimensions before Renderer init
        this.resize();

        this.renderer = new Renderer(this.canvas, this.grid, this.blockSize);
        this.input = new Input(this);

        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.finalScoreElement = document.getElementById('final-score');

        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.actionBtn = document.getElementById('action-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.resumeBtn = document.getElementById('resume-btn');

        // Reward element
        this.rewardContainer = document.getElementById('reward-container');

        this.score = 0;
        this.level = 1;
        this.lines = 0;

        this.activeTetromino = null;
        this.isGameOver = false;
        this.isRunning = false;
        this.isPaused = false;
        this.isRewardActive = false; // New state for reward pause

        this.lastTime = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;

        this.loop = this.loop.bind(this);
        this.setupUIListeners();

        // Window Resize Listener
        window.addEventListener('resize', () => {
            this.resize();
            // Update renderer's block size and canvas size
            this.renderer.updateSize(this.blockSize);
            this.renderer.draw(this.activeTetromino);
        });
    }

    resize() {
        const padding = 40; // Space for headers/score
        const availableHeight = window.innerHeight - document.querySelector('.game-info').offsetHeight - padding;
        const availableWidth = window.innerWidth - padding;

        const maxBlockHeight = Math.floor(availableHeight / this.grid.height);
        const maxBlockWidth = Math.floor(availableWidth / this.grid.width);

        // Use the smaller dimension to fit within screen
        this.blockSize = Math.max(15, Math.min(30, maxBlockHeight, maxBlockWidth));

        // Update canvas dimensions
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

        // Combined Action Button Logic
        this.actionBtn.addEventListener('click', () => {
            if (!this.isRunning && !this.isGameOver) {
                // Initial Start
                this.start();
            } else if (this.isGameOver) {
                // Restart
                this.gameOverOverlay.classList.add('hidden');
                this.start();
            } else {
                // Toggle Pause
                this.togglePause();
            }
            this.actionBtn.blur();
        });

        this.resumeBtn.addEventListener('click', () => this.togglePause());

        // Reward Dismissal
        const dismissReward = (e) => {
            if (e.type === 'touchstart') e.preventDefault(); // Prevent ghost clicks
            if (this.isRewardActive) {
                this.isRewardActive = false;
                this.isPaused = false;
                this.rewardContainer.classList.remove('show');
                this.updateActionButton();

                // Resume loop
                this.lastTime = performance.now();
                requestAnimationFrame(this.loop);
            }
        };

        this.rewardContainer.addEventListener('click', dismissReward);
        this.rewardContainer.addEventListener('touchstart', dismissReward, { passive: false });

        // Handle visibility change to auto-pause
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
        this.updateScore();

        this.isGameOver = false;
        this.isRunning = true;
        this.isPaused = false;
        this.isRewardActive = false;
        this.updateActionButton();

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
        this.activeTetromino = getRandomTetromino();
        this.activeTetromino.x = Math.floor(this.grid.width / 2) - Math.floor(this.activeTetromino.matrix[0].length / 2);
        this.activeTetromino.y = 0;

        if (!this.grid.isValidPosition(this.activeTetromino)) {
            this.gameOver();
        }
    }

    move(dir) {
        if (!this.isRunning || this.isPaused) return;

        this.activeTetromino.x += dir;
        if (!this.grid.isValidPosition(this.activeTetromino)) {
            this.activeTetromino.x -= dir;
        }
    }

    rotate() {
        if (!this.isRunning || this.isPaused) return;

        const originalMatrix = this.activeTetromino.matrix;
        this.activeTetromino.rotate();

        // Wall kick (basic)
        if (!this.grid.isValidPosition(this.activeTetromino)) {
            // Try moving left
            this.activeTetromino.x -= 1;
            if (!this.grid.isValidPosition(this.activeTetromino)) {
                // Try moving right
                this.activeTetromino.x += 2;
                if (!this.grid.isValidPosition(this.activeTetromino)) {
                    // Revert
                    this.activeTetromino.x -= 1;
                    this.activeTetromino.matrix = originalMatrix;
                }
            }
        }
    }

    drop() {
        if (!this.isRunning || this.isPaused) return;

        this.activeTetromino.y++;
        if (!this.grid.isValidPosition(this.activeTetromino)) {
            this.activeTetromino.y--;
            this.lock();
            this.dropCounter = 0; // Reset drop counter
        }
    }

    hardDrop() {
        if (!this.isRunning || this.isPaused) return;
        while (this.grid.isValidPosition(this.activeTetromino)) {
            this.activeTetromino.y++;
        }
        this.activeTetromino.y--;
        this.lock();
        this.dropCounter = 0;
    }

    lock() {
        this.grid.lockTetromino(this.activeTetromino);
        const cleared = this.grid.clearLines();
        if (cleared > 0) {
            this.updateScore(cleared);
        }
        this.spawnTetromino();
    }

    updateScore(linesCleared = 0) {
        if (linesCleared > 0) {
            const points = [0, 40, 100, 300, 1200];
            this.score += points[linesCleared] * this.level;
            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10) + 1;

            // Speed up
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);

            // Show Reward Cat
            this.showRewardCat(linesCleared);
        }

        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
    }

    showRewardCat(lines) {
        const cats = [
            'assets/cat1.jpg',
            'assets/cat2.jpg',
            'assets/cat3.jpg',
            'assets/cat4.jpg',
            'assets/cat5.jpg',
            'assets/cat6.jpg',
            'assets/cat7.jpg',
            'assets/cat8.jpg'
        ];

        // Pick random cat
        const randomCat = cats[Math.floor(Math.random() * cats.length)];
        const rewardContainer = document.getElementById('reward-container');
        const rewardImage = document.getElementById('reward-image');

        rewardImage.src = randomCat;
        rewardContainer.classList.add('show');

        // Pause game logic
        this.isPaused = true;
        this.isRewardActive = true;
        this.updateActionButton();

        rewardImage.src = randomCat;
        rewardContainer.classList.add('show');

        // No timeout - wait for user click to dismiss in UI listener
    }

    gameOver() {
        this.isRunning = false;
        this.isGameOver = true;
        this.updateActionButton();

        // Show grumpy cat on game over
        const rewardContainer = document.getElementById('reward-container');
        const rewardImage = document.getElementById('reward-image');
        rewardImage.src = 'assets/lolcat_grumpy_no.svg';
        rewardContainer.classList.add('show');
        setTimeout(() => rewardContainer.classList.remove('show'), 3000);

        this.finalScoreElement.textContent = this.score;
        this.gameOverOverlay.classList.remove('hidden');
    }

    loop(time = 0) {
        if (!this.isRunning || this.isPaused) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.drop();
            this.dropCounter = 0;
        }

        this.renderer.draw(this.activeTetromino);
        requestAnimationFrame(this.loop);
    }
}

// Initialize Game
const game = new Game();
// Initial draw
game.renderer.draw(null);
