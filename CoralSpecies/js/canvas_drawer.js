class CanvasDrawer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");

        this.scaleFactor = 1.0;
        this.image = null;
        this.maskCache = null;

        this.translatePos = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };

        this.image_top_left_on_canvas = { x: 0, y: 0 };
        this.image_bottom_right_on_canvas = { x: 0, y: 0 };

        this.initEvents();
    }

    redrawCanvas() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear canvas before drawing

        // Apply transformation: scale and translate
        this.ctx.save();
        this.ctx.translate(this.translatePos.x, this.translatePos.y);
        this.ctx.scale(this.scaleFactor, this.scaleFactor);

        if (this.image) {
            this.ctx.drawImage(this.image, 0, 0);
        }

        if (this.maskCache) {
            this.ctx.drawImage(this.maskCache, 0, 0);
        }

        this.ctx.restore();
    }

    initEvents() {
        this.canvas.addEventListener("wheel", (event) =>
            this.handleZoom(event)
        );
        this.canvas.addEventListener("mousemove", (event) =>
            this.handleMouseMove(event)
        );
    }

    handleMouseMove(event) {
        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        this.lastMousePos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    handleZoom(event) {
        const zoomSpeed = 0.1;
        const delta = Math.sign(event.deltaY); // Scroll direction
        const zoomFactor = 1 - delta * zoomSpeed;

        // Update the scale factor
        const newScaleFactor = this.scaleFactor * zoomFactor;

        // Calculate new translation to keep zoom focused at the mouse
        this.translatePos.x -=
            (this.lastMousePos.x - this.translatePos.x) * (zoomFactor - 1);
        this.translatePos.y -=
            (this.lastMousePos.y - this.translatePos.y) * (zoomFactor - 1);

        this.scaleFactor = newScaleFactor;

        // Adjust the image corner positions
        this.image_top_left_on_canvas = {
            x: this.translatePos.x,
            y: this.translatePos.y,
        };
        this.image_bottom_right_on_canvas = {
            x: this.canvas.width * this.scaleFactor + this.translatePos.x,
            y: this.canvas.height * this.scaleFactor + this.translatePos.y,
        };

        console.log(
            "image_top_left_on_canvas: ",
            this.image_top_left_on_canvas,
            " image_bottom_right_on_canvas: ",
            this.image_bottom_right_on_canvas
        );

        // Redraw the canvas after zooming
        this.redrawCanvas();
    }
    showData(image_, showAnnotations = true) {
        const imagePath = image_.get_image_path();
        this.image = new Image();

        this.image.onload = () => {
            this.canvas.width = this.image.width;
            this.canvas.height = this.image.height;

            this.image_bottom_right_on_canvas = {
                x: this.canvas.width,
                y: this.canvas.height,
            };
            this.image_top_left_on_canvas = { x: 0, y: 0 };
            this.redrawCanvas();

            if (showAnnotations) {
                // Create a separate canvas to store mask rendering (cache)
                const maskCanvas = document.createElement("canvas");
                const maskCtx = maskCanvas.getContext("2d");
                maskCanvas.width = this.image.width;
                maskCanvas.height = this.image.height;

                const masks = image_.get_masks();

                maskCtx.globalAlpha = 0.5;
                for (const mask_ of masks) {
                    maskCtx.fillStyle = mask_.get_color();
                    const mask = mask_.get_mask();
                    for (let i = 0; i < mask.length; i++) {
                        const x = i % this.image.width;
                        const y = Math.floor(i / this.image.height);

                        if (mask[i] === 1) {
                            maskCtx.fillRect(x, y, 1, 1);
                        }
                    }
                }

                // Store the rendered mask as an image
                this.maskCache = new Image();
                this.maskCache.src = maskCanvas.toDataURL();
                this.redrawCanvas(); // Redraw with mask
            }
        };

        this.image.src = imagePath;
    }

    canvasPixelToImagePixel(x, y) {
        let output_x = (x - this.translatePos.x) / this.scaleFactor;
        let output_y = (y - this.translatePos.y) / this.scaleFactor;

        const image_width = this.image.width;
        const image_height = this.image.height;
        const canvas_width = this.canvas.clientWidth;
        const canvas_height = this.canvas.clientHeight;

        output_x = (output_x / canvas_width) * image_width;
        output_y = (output_y / canvas_height) * image_height;

        console.log(
            "input: ",
            x,
            y,
            "translate: ",
            this.translatePos.x,
            this.translatePos.y,
            "scale: ",
            this.scaleFactor,
            "image: ",
            image_width,
            image_height,
            "canvas: ",
            canvas_width,
            canvas_height,
            "output: ",
            output_x,
            output_y
        );

        return [Math.floor(output_x), Math.floor(output_y)];
    }
}
