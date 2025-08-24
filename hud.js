const HUD = {
    canvas: null,
    ctx: null,
    
    init(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    },
    
    drawBackground() {
        const { ctx, canvas } = this;
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
        g.addColorStop(0, "#101010");
        g.addColorStop(1, "#191919");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    
    drawBounds(ceilY, floorY) {
        const { ctx, canvas } = this;
        ctx.strokeStyle = "#2c2c2c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, ceilY + 0.5);
        ctx.lineTo(canvas.width, ceilY + 0.5);
        ctx.moveTo(0, floorY + 0.5);
        ctx.lineTo(canvas.width, floorY + 0.5);
        ctx.stroke();
    },
    
    drawScore(score, high) {
        const { ctx } = this;
        ctx.fillStyle = "#ddd";
        ctx.font = "16px ui-monospace, Consolas, monospace";
        ctx.fillText(`Score: ${Math.floor(score)}`, 12, 22);
        ctx.fillText(`High:  ${high}`, 12, 42);
    },
    
    drawCenterText(text) {
        const { ctx, canvas } = this;
        ctx.save();
        ctx.fillStyle = "#ddd";
        ctx.font = "bold 20px system-ui, Segoe UI, Roboto, Arial";
        ctx.textAlign = "center";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }
};