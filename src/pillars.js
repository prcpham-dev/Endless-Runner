const Pillars = {
    PILLAR_W: 26,
    GAP_MIN: 120,
    GAP_MAX: 150,
    LIP: 12,
    CEIL_Y: 30,

    pillarBodies: [],
    pillarCap: null,
    pillarsReady: false,

    init() {
        this.pillarBodies.length = 0;
        this.pillarCap = new Image();
        this.pillarsReady = false;

        const body1 = new Image();
        const body2 = new Image();
        body1.src = "assets/Pillars/Bot_01.png";
        body2.src = "assets/Pillars/Bot_02.png";
        this.pillarCap.src = "assets/Pillars/Top.png";

        let count = 0;
        const need = 3;
        const done = () => { if (++count === need) this.pillarsReady = true; };

        body1.onload = done; body1.onerror = done;
        body2.onload = done; body2.onerror = done;
        this.pillarCap.onload = done; this.pillarCap.onerror = done;

        this.pillarBodies.push(body1, body2);
    },

    drawPillarBodyAndCap(ctx, bodyA, bodyB, cap, p, segHf, capHf) {
        const capH  = Math.max(1, Math.round(capHf));
        const segH  = Math.max(1, Math.round(segHf));
        const W     = Math.round(p.w);
        const bodyH = Math.max(0, Math.round(p.h) - capH);

        ctx.drawImage(cap, 0, 0, W, capH);

        let yOff = capH;
        const endY = capH + bodyH;
        let i = 0;

        while (yOff + segH <= endY) {
            ctx.drawImage((i & 1) ? bodyB : bodyA, 0, yOff, W, segH);
            yOff += segH; i++;
        }

        const remain = endY - yOff;
        if (remain > 0) {
            const lastH = Math.max(1, Math.round(remain));
            ctx.drawImage((i & 1) ? bodyB : bodyA, 0, yOff, W, lastH);
        }
    },

    draw(ctx, p) {
        const prevSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;

        if (!this.pillarsReady) {
            ctx.fillStyle = "#49d";
            Utils.roundRect(ctx, Math.round(p.x), Math.round(p.y), Math.round(p.w), Math.round(p.h), 6);
            ctx.fill();
            ctx.imageSmoothingEnabled = prevSmoothing;
            return;
        }

        const bodyA = this.pillarBodies[0];
        const bodyB = this.pillarBodies[1];
        const cap   = this.pillarCap;

        const srcBodyW = bodyA.width  || p.w;
        const srcBodyH = bodyA.height || p.h;
        const srcCapH  = cap.height   || p.h;

        const scale = p.w / srcBodyW;
        const segH  = srcBodyH * scale;
        const capH  = srcCapH  * scale;

        ctx.save();
        ctx.translate(Math.round(p.x), Math.round(p.isTop ? (p.y + p.h) : p.y));
        if (p.isTop) ctx.scale(1, -1);
        this.drawPillarBodyAndCap(ctx, bodyA, bodyB, cap, p, segH, capH);
        ctx.restore();

        ctx.imageSmoothingEnabled = prevSmoothing;
    }
};

Pillars.init();
