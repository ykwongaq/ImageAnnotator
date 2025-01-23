class AnnotationRenderer {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");

        this.data = null;
        this.imageCache = new Image();
        this.maskCache = new Image();
        this.textCache = new Image();

        // View control
        this.scale = 1.0;
        this.origin = { x: 0, y: 0 };
        this.zoomIntensity = 0.2;
        this.zoomStep = 0.4;
        this.image_top_left = { x: 0, y: 0 };
        this.image_bottom_right = { x: 0, y: 0 };
        this.isDragging = false;
        this.lastRightMousePos = { x: 0, y: 0 };

        const canvas = new Canvas();
        this.maskOpacity = canvas.getMaskOpacity();

        this.imageWidth = 0;
        this.imageHeight = 0;
    }

    render(data, callback = null) {
        return new Promise((resolve, reject) => {
            this.data = data;
            const imagePath = this.data.getImagePath();
            if (!imagePath) {
                console.error("Image path is not valid: ", imagePath);
                return;
            }

            this.imageCache.src = imagePath;
            console.log("Loading image", this.data.getImageName());
            this.imageCache.onload = () => {
                console.log("Image loaded", this.data.getImageName());
                this.imageWidth = this.data.getImageWidth();
                this.imageHeight = this.data.getImageHeight();
                this.canvas.width = this.imageWidth;
                this.canvas.height = this.imageHeight;
                this.resetViewpoint();
                this.updateMasks();
                this.draw();

                resolve();
            };
            this.imageCache.onerror = (err) => {
                reject(`Failed to load image: ${imagePath}`);
            };
        });
    }

    resetViewpoint() {
        this.canvas.width = this.imageWidth;
        this.canvas.height = this.imageHeight;

        // Compute the scale and origin
        const scaleX = this.canvas.width / this.imageWidth;
        const scaleY = this.canvas.height / this.imageHeight;
        this.scale = Math.min(scaleX, scaleY);

        const scaledImageWidth = this.imageWidth * this.scale;
        const scaledImageHeight = this.imageHeight * this.scale;

        const offsetX = (this.canvas.width - scaledImageWidth) / 2;
        const offsetY = (this.canvas.height - scaledImageHeight) / 2;

        this.origin.x = -offsetX / this.scale;
        this.origin.y = -offsetY / this.scale;
    }

    getEncodedImage() {
        return this.canvas.toDataURL("image/png");
    }

    // Helper function to convert hex color to RGB
    hexToRGB(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }

    draw = () => {
        if (!this.data || !this.imageCache.src) {
            return;
        }

        // this.ctx.clearRect(
        //     this.origin.x,
        //     this.origin.y,
        //     this.canvas.width / this.scale,
        //     this.canvas.height / this.scale
        // );
        // this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset the transform matrix
        // this.ctx.scale(this.scale, this.scale);
        // this.ctx.translate(-this.origin.x, -this.origin.y);

        // this.resetImageBoundary();
        this.image_top_left = {
            x: Math.floor(-this.origin.x * this.scale),
            y: Math.floor(-this.origin.y * this.scale),
        };
        this.image_bottom_right = {
            x: Math.floor(
                -this.origin.x * this.scale + this.imageWidth * this.scale
            ),
            y: Math.floor(
                -this.origin.y * this.scale + this.imageHeight * this.scale
            ),
        };

        this.ctx.drawImage(this.imageCache, 0, 0);

        this.ctx.globalAlpha = this.maskOpacity;
        console.log("Drawing masks with mask opacity", this.maskOpacity);
        this.ctx.drawImage(this.maskCache, 0, 0);
        this.ctx.globalAlpha = 1.0;
        this.ctx.drawImage(this.textCache, 0, 0);
    };

    updateMasks() {
        this.drawMasks();
        this.drawTexts();
    }

    drawMasks() {
        const maskCanvas = document.createElement("canvas");
        const maskCtx = maskCanvas.getContext("2d");
        maskCanvas.width = this.imageWidth;
        maskCanvas.height = this.imageHeight;

        const masks = this.data.getMasks();
        console.log("Updateing masks", this.data.getImageName());
        console.log("Masks", masks);
        const imageData = maskCtx.getImageData(
            0,
            0,
            this.imageWidth,
            this.imageHeight
        );
        const data_ = imageData.data; // This is a flat array of [r, g, b, a, r, g, b, a, ...]

        for (const mask of masks) {
            if (!mask.shouldDisplay()) {
                continue;
            }
            const color = mask.getMaskColor();
            const [r, g, b] = this.hexToRGB(color);
            const maskData = mask.getDecodedMask();

            let count = 0;
            for (let i = 0; i < maskData.length; i++) {
                if (maskData[i] === 1) {
                    count++;
                    const x = i % this.imageWidth;
                    const y = Math.floor(i / this.imageWidth);
                    const index = (y * this.imageWidth + x) * 4;
                    // Set pixel color with alpha transparency
                    data_[index] = r; // Red
                    data_[index + 1] = g; // Green
                    data_[index + 2] = b; // Blue
                    data_[index + 3] = 255; // Alpha (0.5 transparency -> 128)
                }
            }
            console.log("Mask count", count);
        }

        // Put the modified image data back to the canvas
        maskCtx.putImageData(imageData, 0, 0);

        const radius = Math.min(this.imageWidth, this.imageHeight) * 0.003;
        // Draw the border
        for (const mask of masks) {
            if (!mask.shouldDisplay()) {
                continue;
            }

            if (!mask.getCategory().isBleached()) {
                continue;
            }

            const maskData = mask.getDecodedMask();

            for (let i = 0; i < maskData.length; i++) {
                if (maskData[i] === 1) {
                    const x = i % this.imageWidth;
                    const y = Math.floor(i / this.imageWidth);

                    // Check if this pixel is on the border by checking its neighbors
                    const isBorder = [
                        maskData[i - 1], // Left
                        maskData[i + 1], // Right
                        maskData[i - this.imageWidth], // Top
                        maskData[i + this.imageWidth], // Bottom
                    ].some(
                        (neighbor) => neighbor === 0 || neighbor === undefined
                    );

                    if (isBorder) {
                        maskCtx.beginPath();
                        maskCtx.arc(x, y, radius, 0, 2 * Math.PI); // 2.5 radius for 5px diameter
                        maskCtx.fillStyle = mask.getCategory().getBorderColor();
                        maskCtx.fill();
                    }
                }
            }
        }
        this.maskCache = new Image();
        this.maskCache.src = maskCanvas.toDataURL();
    }

    drawTexts() {
        // Draw the text labels after the masks are applied
        const textCanvas = document.createElement("canvas");
        const textCtx = textCanvas.getContext("2d");
        textCanvas.width = this.imageWidth;
        textCanvas.height = this.imageHeight;

        const masks = this.data.getMasks();
        for (const mask of masks) {
            if (!mask.shouldDisplay()) {
                continue;
            }

            const middle_pixel = mask.getMiddlePoint();
            const category = mask.getCategory();
            const label_id = category.getCategoryId();
            const color = category.getMaskColor();
            // const color = CategoryManager.getColorByCategoryId(label_id);
            const fontColor = category.getTextColor();
            // CategoryManager.getTextColorByCategoryId(label_id);

            if (label_id !== -1) {
                const fontSize = Math.min(
                    Math.floor(
                        Math.min(this.imageWidth, this.imageHeight) * 0.04
                    ),
                    40
                );

                const display_id = category.getIconName();
                const fontBgRadius = fontSize * 0.7;

                textCtx.beginPath();
                textCtx.arc(
                    middle_pixel[0] + fontBgRadius / 2,
                    middle_pixel[1] - fontBgRadius / 2,
                    fontBgRadius,
                    0,
                    Math.PI * 2
                );
                textCtx.strokeStyle = "#fff";
                textCtx.lineWidth = 1;
                textCtx.fillStyle = color; // Fill color
                textCtx.fill(); // Fills the circle
                textCtx.stroke();
                textCtx.closePath();

                textCtx.font = `${fontSize / display_id.length}px Arial`;
                // maskCtx.fillStyle = `rgba(255, 0, 0, ${this.maskOpacity})`;
                textCtx.fillStyle = fontColor;
                textCtx.fillText(display_id, middle_pixel[0], middle_pixel[1]);
            }
        }

        this.textCache = new Image();
        this.textCache.src = textCanvas.toDataURL();
    }

    resetImageBoundary() {
        this.image_top_left = { x: 0, y: 0 };
        this.image_bottom_right = { x: this.imageWidth, y: this.imageHeight };
    }
}
