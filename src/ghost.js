const Ghost = {
    canvas: null,
    ctx: null,
    PLAYER_SIZE: 48,
    ANIM_DELAY: 100,
    PLAYER_X: 80,
    ghostFrames: [],
    loadedCount: 0,
    TOTAL_FRAMES: 6,
    ghostReady: false,
    animFrame: 0,
    animAccMs: 0,

    init(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ghostFrames.length = 0;
        this.loadedCount = 0;
        this.ghostReady = false;
        for (let i = 0; i < this.TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = `assets/LittleGhost/frame_${i}.png`;
            img.onload = () => {
                this.loadedCount++;
                if (this.loadedCount === this.TOTAL_FRAMES) this.ghostReady = true;
            };
            img.onerror = () => {
                this.loadedCount++;
                if (this.loadedCount === this.TOTAL_FRAMES) this.ghostReady = true;
            };
            this.ghostFrames.push(img);
        }
        this.animFrame = 0;
        this.animAccMs = 0;
    },

    draw(player, gravitySign) {
        const ctx = this.ctx;
        const x = player.x;
        const y = player.y;

        if (this.ghostReady) {
            const img = this.ghostFrames[this.animFrame];
            const t = Date.now() * 0.005;
            const pulse = (Math.sin(t) + 1) / 2;
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = 5 + pulse * 15;

            if (gravitySign < 0) {
                ctx.save();
                ctx.translate(x + this.PLAYER_SIZE / 2, y + this.PLAYER_SIZE / 2);
                ctx.scale(1, -1);
                ctx.drawImage(
                    img,
                    -this.PLAYER_SIZE / 2, -this.PLAYER_SIZE / 2,
                    this.PLAYER_SIZE, this.PLAYER_SIZE
                );
                ctx.restore();
            } else {
                ctx.drawImage(img, x, y, this.PLAYER_SIZE, this.PLAYER_SIZE);
            }

            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";

        } else {
            ctx.fillStyle = "#eee";
            Utils.roundRect(ctx, x, y, this.PLAYER_SIZE, this.PLAYER_SIZE, 6);
            ctx.fill();
        }
    },

    updateAnim(dt, running, paused, over) {
        if (running && !paused && !over && this.ghostReady) {
            this.animAccMs += dt * 1000;
            while (this.animAccMs >= this.ANIM_DELAY) {
                this.animAccMs -= this.ANIM_DELAY;
                this.animFrame = (this.animFrame + 1) % this.TOTAL_FRAMES;
            }
        }
    }
};
