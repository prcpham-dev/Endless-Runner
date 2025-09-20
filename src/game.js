(() => {
    const canvas = document.getElementById("game");
    if (!canvas) {
        console.error("Canvas #game not found");
        return;
    }
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    HUD.init(canvas, ctx);
    Ghost.init(canvas, ctx);
    Pillars.init(canvas, ctx);


    // Constants
    const W = canvas.width;
    const H = canvas.height;
    const FLOOR_Y = H - 30;
    const CEIL_Y = 30;

    // Physics & tuning
    const GRAVITY = 1800;
    const FLIP_BOUNCE = -180;
    const SPEED_START = 220;
    const SPEED_RAMP  = 60;
    const SCORE_SPEED = 4;
    const SPAWN_MIN = 1.0;
    const SPAWN_MAX = 1.4;
    const SPAWN_RATE_K   = 1.6;
    const SPAWN_RATE_TAU = 60.0;
    const SPAWN_RATE_MAX = 4.0;

    // Visual pillar width (art will be scaled to this)
    const PILLAR_W = Pillars.PILLAR_W;
    const GAP_MIN = Pillars.GAP_MIN;
    const GAP_MAX = Pillars.GAP_MAX;
    const LIP = Pillars.LIP;

    // Game state
    let running = false;
    let paused = false;
    let over = false;
    let score = 0;
    let high = Number(localStorage.getItem("flip_high") || "0");
    let crashCooldown = 0;
    let nextScoreThreshold = 50;

    // Sound
    const passSound = new Audio("assets/Sounds/50.wav");
    passSound.volume = 0.5;

    const flipSound = new Audio("assets/Sounds/flip.wav");
    flipSound.volume = 0.25;

    const state = {
        speed: SPEED_START,
        elapsed: 0,
        spawnIn: Utils.rand(SPAWN_MIN, SPAWN_MAX),
        gravitySign: 1,
        player: { x: Ghost.PLAYER_X, y: FLOOR_Y - Ghost.PLAYER_SIZE, vy: 0 },
        pillars: []
    };

    // Spawning
    function spawnPillars() {
        const gap = Utils.rand(GAP_MIN, GAP_MAX);
        const gapTop = Utils.rand(CEIL_Y + LIP, FLOOR_Y - LIP - gap);
        const x = W + 40;

        const xI = Math.round(x);
        const wI = Math.round(PILLAR_W);

        const gapTopI = Math.round(gapTop);
        const bottomYI = Math.round(gapTop + gap);

        const topH = Math.max(0, gapTopI);
        if (topH > 0) {
            state.pillars.push({ x: xI, y: 0, w: wI, h: topH, isTop: true });
        }

        const bottomH = Math.max(0, Math.round(H - bottomYI));
        if (bottomH > 0) {
            state.pillars.push({ x: xI, y: bottomYI, w: wI, h: bottomH, isTop: false });
        }
    }

    // Lifecycle / control
    function reset() {
        running = true;
        paused = false;
        over = false;
        score = 0;
        nextScoreThreshold = 50;
        state.speed = SPEED_START;
        state.elapsed = 0;
        state.spawnIn = Utils.rand(SPAWN_MIN, SPAWN_MAX);
        state.gravitySign = 1;
        state.player.x = Ghost.PLAYER_X;
        state.player.y = FLOOR_Y - Ghost.PLAYER_SIZE;
        state.player.vy = 0;
        state.pillars.length = 0;
        Ghost.animFrame = 0;
        Ghost.animAccMs = 0;
    }

    function flipGravity() {
        if (!running || paused || over) return;
        state.gravitySign *= -1;
        state.player.vy = FLIP_BOUNCE * state.gravitySign;
        passSound.currentTime = 0;
        flipSound.play();
    }

    function gameOver() {
        over = true;
        running = false;
        crashCooldown = 1.0;
        high = Math.max(high, Math.floor(score));
        localStorage.setItem("flip_high", String(high));
    }


    // Update
    function update(dt) {
        if (crashCooldown > 0) crashCooldown -= dt;

        state.elapsed += dt;
        state.speed = SPEED_START + SPEED_RAMP * Math.sqrt(state.elapsed);

        score += SCORE_SPEED * dt;
        if (score >= nextScoreThreshold) {
            passSound.currentTime = 0;
            passSound.play();
            nextScoreThreshold += 50;
        }

        state.player.vy += GRAVITY * state.gravitySign * dt;
        state.player.y  += state.player.vy * dt;

        const floorY = FLOOR_Y - Ghost.PLAYER_SIZE;
        if (state.gravitySign > 0 && state.player.y > floorY) {
            state.player.y = floorY;
            state.player.vy = 0;
        } else if (state.gravitySign < 0 && state.player.y < CEIL_Y) {
            state.player.y = CEIL_Y;
            state.player.vy = 0;
        }

        if (HUD.bgLoaded && HUD.bgImg) {
            const imgW = HUD.bgImg.width;
            bgScrollX += state.speed * dt * (imgW / canvas.width);
            if (bgScrollX >= imgW) bgScrollX -= imgW;
        }

        let accel = 1 + SPAWN_RATE_K * Math.log1p(state.elapsed / SPAWN_RATE_TAU);
        if (accel > SPAWN_RATE_MAX) accel = SPAWN_RATE_MAX;
        state.spawnIn -= dt * accel;

        if (state.spawnIn <= 0) {
            spawnPillars();
            state.spawnIn = Utils.rand(SPAWN_MIN, SPAWN_MAX);
        }

        for (const p of state.pillars) {
            p.x -= state.speed * dt;
        }

        const before = state.pillars.length;
        state.pillars = state.pillars.filter(p => p.x + p.w > -5);
        if (state.pillars.length < before) score += 0.5;

        for (const p of state.pillars) {
            if (Utils.collide(
                state.player.x, state.player.y, Ghost.PLAYER_SIZE, Ghost.PLAYER_SIZE,
                p.x, p.y, p.w, p.h
            )) {
                gameOver();
                break;
            }
        }

        if (state.player.y < 0 || state.player.y > H - Ghost.PLAYER_SIZE) gameOver();
        Ghost.updateAnim(dt, running, paused, over);
    }


    // Background scroll state
    let bgScrollX = 0;

    // Draw
    function draw() {
        HUD.drawBackground(bgScrollX);
        HUD.drawBounds(CEIL_Y, FLOOR_Y);

        for (const p of state.pillars) Pillars.draw(ctx, p);

        Ghost.draw(state.player, state.gravitySign);
        HUD.drawScore(score, high);

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

    // Input
    window.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();
        if (k === " ") {
            e.preventDefault();
            if (!running || (over && crashCooldown <= 0)) reset();
            else if (running && !over) flipGravity();
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

    requestAnimationFrame(loop);
})();
