// game.js — Gravity Flip Runner (fixed ceiling/floor safe-lane with LIP)

(() => {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    // World constants
    const W = canvas.width;
    const H = canvas.height;
    const FLOOR_Y = H - 30;
    const CEIL_Y  = 30;
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
        tPrev: 0,
        speed: SPEED_START,
        spawnIn: rand(SPAWN_MIN, SPAWN_MAX),
        gravitySign: +1,
        player: {
            x: PLAYER_X,
            y: FLOOR_Y - PLAYER_SIZE,
            vy: 0
        },
        pillars: []
    };

    // Helpers
    function rand(a, b) { return Math.random() * (b - a) + a; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function collide(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    // Spawning pillars: one from top, one from bottom, with a gap that
    // never hugs the ceiling/floor thanks to LIP.
    function spawnPillars() {
        const gap = rand(GAP_MIN, GAP_MAX);

        const innerTop = CEIL_Y + LIP;
        const innerBottom = FLOOR_Y - LIP;

        const gapTop = rand(innerTop, innerBottom - gap);

        const topH = gapTop;
        const bottomY = gapTop + gap;
        const bottomH = H - bottomY;

        const x = W + 40;
        if (topH > 0)    state.pillars.push({ x, y: 0, w: PILLAR_W, h: topH });
        if (bottomH > 0) state.pillars.push({ x, y: bottomY, w: PILLAR_W, h: bottomH });
    }

    function reset() {
        running = true;
        paused = false;
        over = false;
        score = 0;
        state.tPrev = performance.now();
        state.speed = SPEED_START;
        state.spawnIn = rand(SPAWN_MIN, SPAWN_MAX);
        state.gravitySign = +1;
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
        // Speed ramps up slowly
        state.speed += SPEED_RAMP * dt;
        score += (state.speed / 160) * dt;

        // Player physics (gravity toward selected surface)
        state.player.vy += GRAVITY * state.gravitySign * dt;
        state.player.y += state.player.vy * dt;

        // Clamp to surfaces
        const floorY = FLOOR_Y - PLAYER_SIZE;
        const ceilY = CEIL_Y;
        if (state.gravitySign > 0 && state.player.y > floorY) {
            state.player.y = floorY;
            state.player.vy = 0;
        } else if (state.gravitySign < 0 && state.player.y < ceilY) {
            state.player.y = ceilY;
            state.player.vy = 0;
        }

        // Spawn pillars
        state.spawnIn -= dt;
        if (state.spawnIn <= 0) {
            spawnPillars();
            state.spawnIn = rand(SPAWN_MIN, SPAWN_MAX);
        }

        // Move pillars
        for (const p of state.pillars) p.x -= state.speed * dt;

        // Remove offscreen and award a tiny bonus per pair
        const before = state.pillars.length;
        state.pillars = state.pillars.filter(p => p.x + p.w > -5);
        if (state.pillars.length < before) {
            score += 0.5;
        }

        // Collisions
        for (const p of state.pillars) {
            if (collide(state.player.x, state.player.y, PLAYER_SIZE, PLAYER_SIZE, p.x, p.y, p.w, p.h)) {
                gameOver();
                break;
            }
        }

        // Safety out of bounds
        if (state.player.y < 0 || state.player.y > H - PLAYER_SIZE) {
            gameOver();
        }
    }

    function draw() {
        // background
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#101010");
        g.addColorStop(1, "#191919");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // ceiling & floor lines
        ctx.strokeStyle = "#2c2c2c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, CEIL_Y + 0.5);
        ctx.lineTo(W, CEIL_Y + 0.5);
        ctx.moveTo(0, FLOOR_Y + 0.5);
        ctx.lineTo(W, FLOOR_Y + 0.5);
        ctx.stroke();

        // pillars
        ctx.fillStyle = "#49d";
        for (const p of state.pillars) {
            roundRect(ctx, p.x, p.y, p.w, p.h, 6);
            ctx.fill();
        }

        // player (square with a tiny “eye” showing up/down)
        ctx.fillStyle = "#eee";
        roundRect(ctx, state.player.x, state.player.y, PLAYER_SIZE, PLAYER_SIZE, 6);
        ctx.fill();
        ctx.fillStyle = "#111";
        const eyeY = state.gravitySign > 0 ? state.player.y + 6 : state.player.y + PLAYER_SIZE - 10;
        ctx.fillRect(state.player.x + 6, eyeY, 4, 4);

        // HUD
        ctx.fillStyle = "#ddd";
        ctx.font = "16px ui-monospace, Consolas, monospace";
        ctx.fillText(`Score: ${Math.floor(score)}`, 12, 22);
        ctx.fillText(`High:  ${high}`, 12, 42);

        if (!running && !over) centerText("Press Space or Start to Play");
        if (paused) centerText("Paused");
        if (over) centerText("Crashed — Press Space or R to Restart");
    }

    function centerText(t) {
        ctx.save();
        ctx.fillStyle = "#ddd";
        ctx.font = "bold 20px system-ui, Segoe UI, Roboto, Arial";
        ctx.textAlign = "center";
        ctx.fillText(t, W / 2, H / 2);
        ctx.restore();
    }

    function roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + w - rr, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
        ctx.lineTo(x + w, y + h - rr);
        ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
        ctx.lineTo(x + rr, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
        ctx.lineTo(x, y + rr);
        ctx.quadraticCurveTo(x, y, x + rr, y);
        ctx.closePath();
    }

    // Loop
    let last = performance.now();
    function loop(now = performance.now()) {
        if (!running || paused) {
            draw();
            requestAnimationFrame(loop);
            return;
        }
        const dt = Math.min((now - last) / 1000, 0.033);
        last = now;

        update(dt);
        draw();
        requestAnimationFrame(loop);
    }

    // Input (Space flips or restarts; P pauses; R restarts)
    window.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();
        if (k === " ") {
            e.preventDefault();
            if (!running && !over) {
                reset();          // start from idle
            } else if (over) {
                reset();          // restart after crash
            } else {
                flipGravity();    // normal flip during play
            }
        } else if (k === "p") {
            if (running && !over) paused = !paused;
        } else if (k === "r") {
            reset();
        }
    });

    // Pointer (click/tap flips; also starts from idle)
    canvas.addEventListener("pointerdown", () => {
        if (!running && !over) reset();
        else if (!over) flipGravity();
    });

    // Buttons
    document.getElementById("start").onclick = () => { if (!running || over) reset(); };
    document.getElementById("pause").onclick = () => { if (running && !over) paused = !paused; };
    document.getElementById("restart").onclick = () => reset();

    // Kick off render loop
    requestAnimationFrame(loop);
})();
