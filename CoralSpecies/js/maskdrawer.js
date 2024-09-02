class MaskDrawer {
    constructor() {
        this.image_view = document.getElementById("image-view");
        this.canvas = document.getElementById("canvas");
    }

    show_data(data, show_annotations = true) {
        const image_path = data.get_image_path();

        const image = new Image();
        const ctx = this.canvas.getContext("2d");

        // const masks = data.get_masks();

        image.onload = () => {
            const imgWidth = image.width;
            const imgHeight = image.height;

            this.canvas.width = imgWidth;
            this.canvas.height = imgHeight;

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            // Draw the image on the canvas
            ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear canvas before drawing
            ctx.drawImage(image, 0, 0, imgWidth, imgHeight);

            if (show_annotations) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = "green";

                const mask = data.get_mask(0);
                for (let i = 0; i < mask.length; i++) {
                    const x = i % imgWidth;
                    const y = Math.floor(i / imgHeight);

                    if (mask[i] === 1) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
                ctx.globalAlpha = 1.0;
            }
        };
        image.src = image_path;
    }
}
