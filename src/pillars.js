const Pillars = {
    PILLAR_W: 26,
    GAP_MIN: 120,
    GAP_MAX: 150,
    LIP: 12,
    CEIL_Y: 30,

    pillarBodies: [],
    pillarCaps: [],
    pillarsReady: false,

    init() {
        this.pillarBodies.length = 0;
        this.pillarCaps.length = 0;
        this.pillarsReady = false;

        const botImageFiles = [
            "assets/Pillars/Bot/Bot_01.png",
            "assets/Pillars/Bot/Bot_02.png"
        ];
        const topImageFiles = [
            "assets/Pillars/Top/Top.png"
        ];

        let count = 0;
        const need = botImageFiles.length + topImageFiles.length;
        const done = () => { if (++count === need) this.pillarsReady = true; };

        botImageFiles.forEach(src => {
            const img = new Image();
            img.src = src;
            img.onload = done;
            img.onerror = done;
            this.pillarBodies.push(img);
        });

        topImageFiles.forEach(src => {
            const img = new Image();
            img.src = src;
            img.onload = done;
            img.onerror = done;
            this.pillarCaps.push(img);
        });
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

            // green glow
            ctx.shadowColor = "#00ff66";
            ctx.shadowBlur = 15;

            Utils.roundRect(ctx, Math.round(p.x), Math.round(p.y), Math.round(p.w), Math.round(p.h), 6);
            ctx.fill();

            // reset glow
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";

            ctx.imageSmoothingEnabled = prevSmoothing;
            return;
        }

        // Assign a bot image index and top image index to each pillar if not already set
        if (typeof p.botImageIdx === "undefined") {
            p.botImageIdx = Math.floor(Math.random() * this.pillarBodies.length);
        }
        if (typeof p.topImageIdx === "undefined") {
            p.topImageIdx = Math.floor(Math.random() * this.pillarCaps.length);
        }
        const bodyA = this.pillarBodies[p.botImageIdx];
        const bodyB = this.pillarBodies[(p.botImageIdx + 1) % this.pillarBodies.length];
        const cap   = this.pillarCaps[p.topImageIdx];

        const srcBodyW = bodyA.width  || p.w;
        const srcBodyH = bodyA.height || p.h;
        const srcCapH  = cap.height   || p.h;

        const scale = p.w / srcBodyW;
        const segH  = srcBodyH * scale;
        const capH  = srcCapH  * scale;

        ctx.save();
        ctx.translate(Math.round(p.x), Math.round(p.isTop ? (p.y + p.h) : p.y));
        if (p.isTop) ctx.scale(1, -1);

        // green glow for textured pillars
        ctx.shadowColor = "#00ff66";
        ctx.shadowBlur = 15;

        this.drawPillarBodyAndCap(ctx, bodyA, bodyB, cap, p, segH, capH);

        // reset glow
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";

        ctx.restore();

        ctx.imageSmoothingEnabled = prevSmoothing;
    }

};

Pillars.init();
