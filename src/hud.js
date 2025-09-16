const HUD = {
    canvas: null,
    ctx: null,
    bgImg: null,
    bgLoaded: false,

    init(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        if (!this.bgImg) {
            this.bgImg = new Image();
            this.bgImg.src = "assets/background.png";
            this.bgImg.onload = () => { this.bgLoaded = true; };
        }
    },

    drawBackground(scrollX = 0) {
        const { ctx, canvas, bgImg, bgLoaded } = this;
        if (bgLoaded) {
            const imgW = bgImg.width;
            const imgH = bgImg.height;

            let sx = Math.floor(scrollX) % imgW;
            if (sx < 0) sx += imgW;

            // Draw first part
            ctx.drawImage(
                bgImg,
                sx, 0, imgW - sx, imgH,
                0, 0, canvas.width * ((imgW - sx) / imgW), canvas.height
            );
            // Draw wrapped part if needed
            if (sx > 0) {
                ctx.drawImage(
                    bgImg,
                    0, 0, sx, imgH,
                    canvas.width * ((imgW - sx) / imgW), 0, canvas.width * (sx / imgW), canvas.height
                );
            }
        } else {
            const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
            g.addColorStop(0, "#101010");
            g.addColorStop(1, "#191919");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    },
    
    drawBounds(ceilY, floorY) {
        const { ctx, canvas } = this;
        ctx.strokeStyle = "#a64dff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#c77dff";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, ceilY + 0.5);
        ctx.lineTo(canvas.width, ceilY + 0.5);
        ctx.moveTo(0, floorY + 0.5);
        ctx.lineTo(canvas.width, floorY + 0.5);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
    },
    
    drawScore(score, high) {
        const { ctx } = this;
        ctx.fillStyle = "#8bf763";
        ctx.font = "16px ui-monospace, Consolas, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.shadowColor = "#b0ff95";
        ctx.shadowBlur = 8;
        ctx.fillText(`Score: ${Math.floor(score)}`, 12, 22);
        ctx.fillText(`High:  ${high}`, 12, 42);
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
    },

    drawCenterText(text) {
        const { ctx, canvas } = this;
        ctx.fillStyle = "#8bf763";
        ctx.font = "bold 20px system-ui, Segoe UI, Roboto, Arial";
        ctx.textAlign = "center";
        ctx.shadowColor = "#b0ff95";
        ctx.shadowBlur = 12;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
    }
};
