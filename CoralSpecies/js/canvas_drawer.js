class CanvasDrawer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        console.log("ctx", this.ctx);

        this.image = null;

        this.imageCache = new Image();
        this.maskCache = new Image();

        this.scale = 1.0;
        this.origin = { x: 0, y: 0 };

        this.imageWidth = 0;
        this.imageHeight = 0;

        self.zoomIntensity = 0.2;

        this.showAnnotation = true;
        this.enableWheel();
    }

    setShowAnnotation(showAnnotation) {
        this.showAnnotation = showAnnotation;
    }

    setData(image) {
        this.image = image;
        const sizeOf = require("image-size");
        let dimension = sizeOf(this.image.get_image_path());
        this.imageWidth = dimension.width;
        this.imageHeight = dimension.height;
        this.canvas.width = this.imageWidth;
        this.canvas.height = this.imageHeight;
        this.updateMasks();
    }

    updateMasks() {
        const maskCanvas = document.createElement("canvas");
        const maskCtx = maskCanvas.getContext("2d");
        maskCanvas.width = this.imageWidth;
        maskCanvas.height = this.imageHeight;

        const masks = this.image.get_masks();
        const imageData = maskCtx.getImageData(
            0,
            0,
            this.imageWidth,
            this.imageHeight
        );
        const data = imageData.data; // This is a flat array of [r, g, b, a, r, g, b, a, ...]

        for (const mask of masks) {
            const color = mask.get_color();
            const maskData = mask.get_mask();
            const [r, g, b] = this.hexToRGB(color);

            for (let i = 0; i < maskData.length; i++) {
                if (maskData[i] === 1) {
                    const x = i % this.imageWidth;
                    const y = Math.floor(i / this.imageWidth);
                    const index = (y * this.imageWidth + x) * 4;

                    // Set pixel color with alpha transparency
                    data[index] = r; // Red
                    data[index + 1] = g; // Green
                    data[index + 2] = b; // Blue
                    data[index + 3] = 128; // Alpha (0.5 transparency -> 128)
                }
            }
        }

        // Put the modified image data back to the canvas
        maskCtx.putImageData(imageData, 0, 0);

        // Draw the text labels after the masks are applied
        for (const mask of masks) {
            const middle_pixel = mask.get_middle_pixel();
            const label_id = mask.get_label_id();
            if (label_id !== null) {
                const fontSize = Math.floor(
                    Math.max(this.imageWidth, this.imageHeight) * 0.05
                );
                maskCtx.font = `${fontSize}px Arial`;
                maskCtx.fillStyle = "red";
                maskCtx.fillText(label_id, middle_pixel[0], middle_pixel[1]);
            }
        }
        this.maskCache = new Image();
        this.maskCache.src = maskCanvas.toDataURL();
    }

    // Helper function to convert hex color to RGB
    hexToRGB(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }

    // updateMasks() {
    //     const maskCanvas = document.createElement("canvas");
    //     const maskCtx = maskCanvas.getContext("2d");
    //     maskCanvas.width = this.imageWidth;
    //     maskCanvas.height = this.imageHeight;

    //     const masks = this.image.get_masks();

    //     maskCtx.globalAlpha = 0.5;
    //     for (const mask of masks) {
    //         maskCtx.fillStyle = mask.get_color();
    //         const maskData = mask.get_mask();
    //         for (let i = 0; i < maskData.length; i++) {
    //             const x = i % this.imageWidth;
    //             const y = Math.floor(i / this.imageHeight);

    //             if (maskData[i] === 1) {
    //                 maskCtx.fillRect(x, y, 1, 1);
    //             }
    //         }
    //     }

    //     this.maskCache = new Image();
    //     this.maskCache.src = maskCanvas.toDataURL();
    // }

    draw = () => {
        this.imageCache.onload = () => {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset the transform matrix
            this.ctx.clearRect(
                this.origin.x,
                this.origin.y,
                this.canvas.width / this.scale,
                this.canvas.height / this.scale
            );
            this.ctx.scale(this.scale, this.scale);
            this.ctx.translate(-this.origin.x, -this.origin.y);

            this.ctx.drawImage(this.imageCache, 0, 0);
            if (this.showAnnotation) {
                this.ctx.drawImage(this.maskCache, 0, 0);
            }
            window.requestAnimationFrame(this.draw);
        };
        this.imageCache.src = this.image.get_image_path();
    };

    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (event.clientY - rect.top) * (this.canvas.height / rect.height),
        };
    }

    enableWheel() {
        this.canvas.onwheel = (event) => {
            event.preventDefault();

            // Get mouse offset.
            const { x: mouseX, y: mouseY } = this.getMousePos(event);

            // Normalize mouse wheel movement to +1 or -1 to avoid unusual jumps.
            const wheel = event.deltaY < 0 ? 1 : -1;

            // Compute zoom factor.
            const zoom = Math.exp(wheel * self.zoomIntensity);

            // Translate so the visible origin is at the context's origin.
            this.ctx.translate(this.origin.x, this.origin.y);

            this.origin.x -= mouseX / (this.scale * zoom) - mouseX / this.scale;
            this.origin.y -= mouseY / (this.scale * zoom) - mouseY / this.scale;

            // Scale it (centered around the mouse offset).
            this.ctx.scale(zoom, zoom);

            // Offset the visible origin to it's correct position.
            this.ctx.translate(-this.origin.x, -this.origin.y);

            this.scale *= zoom;
        };
    }

    canvasPixelToImagePixel(canvasX, canvasY) {
        const unscaledX = canvasX / this.scale - this.origin.x;
        const unscaledY = canvasY / this.scale - this.origin.y;
        return [unscaledX, unscaledY];
    }

    resetViewpoint() {
        this.scale = 1.0;
        this.origin = { x: 0, y: 0 };
    }
}
