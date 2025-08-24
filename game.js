(() => {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    HUD.init(canvas, ctx);
    
    // Constants
    const W = canvas.width;
    const H = canvas.height;
    const FLOOR_Y = H - 30;
    const CEIL_Y = 30;
    const PLAYER_X = 80;
    const PLAYER_SIZE = 24;
    const GRAVITY = 1800;
    const FLIP_BOUNCE = -180;
    const SPEED_START = 220;
    const SPEED_RAMP = 22;
    const SPAWN_MIN = 1.0;
    const SPAWN_MAX = 1.4;
    const PILLAR_W = 26;
    const GAP_MIN = 100;
    const GAP_MAX = 150;
    const LIP = 12;

    // Game state
    let running = false;
    let paused = false;
    let over = false;
    let score = 0;
    let high = Number(localStorage.getItem("flip_high") || "0");
    
    const state = {
        speed: SPEED_START,
        spawnIn: Utils.rand(SPAWN_MIN, SPAWN_MAX),
        gravitySign: 1,
        player: { x: PLAYER_X, y: FLOOR_Y - PLAYER_SIZE, vy: 0 },
        pillars: []
    };

    // Game functions
    function spawnPillars() {
        const gap = Utils.rand(GAP_MIN, GAP_MAX);
        const gapTop = Utils.rand(CEIL_Y + LIP, FLOOR_Y - LIP - gap);
        const x = W + 40;
        
        // Top pillar
        if (gapTop > 0) {
            state.pillars.push({ x, y: 0, w: PILLAR_W, h: gapTop });
        }
        
        // Bottom pillar
        const bottomY = gapTop + gap;
        const bottomH = H - bottomY;
        if (bottomH > 0) {
            state.pillars.push({ x, y: bottomY, w: PILLAR_W, h: bottomH });
        }
    }

    function reset() {
        running = true;
        paused = false;
        over = false;
        score = 0;
        state.speed = SPEED_START;
        state.spawnIn = Utils.rand(SPAWN_MIN, SPAWN_MAX);
        state.gravitySign = 1;
        state.player.x = PLAYER_X;
        state.player.y = FLOOR_Y - PLAYER_SIZE;
        state.player.vy = 0;
        state.pillars.length = 0;
    }

    function flipGravity() {
        if (!running || paused || over) return;
        state.gravitySign *= -1;
        state.player.vy = FLIP_BOUNCE * state.gravitySign;
    }

    function gameOver() {
        over = true;
        running = false;
        high = Math.max(high, Math.floor(score));
        localStorage.setItem("flip_high", String(high));
    }

    function update(dt) {
        // Speed and score
        state.speed += SPEED_RAMP * dt;
        score += (state.speed / 160) * dt;

        // Player physics
        state.player.vy += GRAVITY * state.gravitySign * dt;
        state.player.y += state.player.vy * dt;

        // Clamp player to surfaces
        const floorY = FLOOR_Y - PLAYER_SIZE;
        if (state.gravitySign > 0 && state.player.y > floorY) {
            state.player.y = floorY;
            state.player.vy = 0;
        } else if (state.gravitySign < 0 && state.player.y < CEIL_Y) {
            state.player.y = CEIL_Y;
            state.player.vy = 0;
        }

        // Spawn and move pillars
        state.spawnIn -= dt;
        if (state.spawnIn <= 0) {
            spawnPillars();
            state.spawnIn = Utils.rand(SPAWN_MIN, SPAWN_MAX);
        }

        for (const p of state.pillars) {
            p.x -= state.speed * dt;
        }

        // Remove offscreen pillars and add score
        const before = state.pillars.length;
        state.pillars = state.pillars.filter(p => p.x + p.w > -5);
        if (state.pillars.length < before) score += 0.5;

        // Collision detection
        for (const p of state.pillars) {
            if (Utils.collide(state.player.x, state.player.y, PLAYER_SIZE, PLAYER_SIZE, p.x, p.y, p.w, p.h)) {
                gameOver();
                break;
            }
        }

        // Out of bounds check
        if (state.player.y < 0 || state.player.y > H - PLAYER_SIZE) {
            gameOver();
        }
    }

    function draw() {
        // Background and bounds
        HUD.drawBackground();
        HUD.drawBounds(CEIL_Y, FLOOR_Y);

        // Pillars
        ctx.fillStyle = "#49d";
        for (const p of state.pillars) {
            Utils.roundRect(ctx, p.x, p.y, p.w, p.h, 6);
            ctx.fill();
        }

        // Player
        ctx.fillStyle = "#eee";
        Utils.roundRect(ctx, state.player.x, state.player.y, PLAYER_SIZE, PLAYER_SIZE, 6);
        ctx.fill();
        
        // Player eye (shows gravity direction)
        ctx.fillStyle = "#111";
        const eyeY = state.gravitySign > 0 ? state.player.y + 6 : state.player.y + PLAYER_SIZE - 10;
        ctx.fillRect(state.player.x + 6, eyeY, 4, 4);

        // HUD
        HUD.drawScore(score, high);
        
        // Game state messages
        if (!running && !over) HUD.drawCenterText("Press Space or Start to Play");
        if (paused) HUD.drawCenterText("Paused");
        if (over) HUD.drawCenterText("Crashed — Press Space or R to Restart");
    }

    // Game loop
    let last = performance.now();
    function loop(now = performance.now()) {
        if (running && !paused) {
            const dt = Math.min((now - last) / 1000, 0.033);
            update(dt);
        }
        last = now;
        draw();
        requestAnimationFrame(loop);
    }

    // Input handling
    window.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();
        if (k === " ") {
            e.preventDefault();
            if (!running || over) reset();
            else flipGravity();
        } else if (k === "p" && running && !over) {
            paused = !paused;
        } else if (k === "r") {
            reset();
        }
    });

    canvas.addEventListener("pointerdown", () => {
        if (!running || over) reset();
        else flipGravity();
    });

    // Button controls
    document.getElementById("start").onclick = () => { if (!running || over) reset(); };
    document.getElementById("pause").onclick = () => { if (running && !over) paused = !paused; };
    document.getElementById("restart").onclick = () => reset();

    // Start the game loop
    requestAnimationFrame(loop);
})();