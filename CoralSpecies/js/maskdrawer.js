class MaskDrawer {
    constructor() {
        this.image_view = document.getElementById("image-view");
        this.canvas = document.getElementById("canvas");
    }

    show_data(image_, show_annotations = true) {
        const image_path = image_.get_image_path();
        const image = new Image();
        const ctx = this.canvas.getContext("2d");

        image.onload = () => {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear canvas before drawing

            const imgWidth = image.width;
            const imgHeight = image.height;

            const font_size = Math.floor(Math.max(imgWidth, imgHeight) * 0.05);
            this.canvas.width = imgWidth;
            this.canvas.height = imgHeight;

            // Draw the image on the canvas
            ctx.drawImage(image, 0, 0, imgWidth, imgHeight);
            // this.clear_all_text();
            if (show_annotations) {
                ctx.globalAlpha = 0.5;

                const masks = image_.get_masks();

                for (const mask_ of masks) {
                    ctx.fillStyle = mask_.get_color();
                    const mask = mask_.get_mask();
                    for (let i = 0; i < mask.length; i++) {
                        const x = i % imgWidth;
                        const y = Math.floor(i / imgHeight);

                        if (mask[i] === 1) {
                            ctx.fillRect(x, y, 1, 1);
                        }
                    }

                    const middle_pixel = mask_.get_middle_pixel();
                    const label_id = mask_.get_label_id();
                    if (label_id !== null) {
                        ctx.font = `${font_size}px Arial`;
                        ctx.fillStyle = "red";
                        ctx.fillText(
                            label_id,
                            middle_pixel[0],
                            middle_pixel[1]
                        );
                    }
                }
                ctx.globalAlpha = 1.0;
            }
        };
        image.src = image_path;
    }

    add_text(content, x, y) {
        const textElement = document.createElement("div");
        textElement.classList.add("mask_id_text");
        textElement.innerHTML = content;
        textElement.style.left = `${x}px`;
        textElement.style.top = `${y}px`;
        textElement.style.color = "red";
        textElement.style.fontSize = "12px";

        this.canvas.appendChild(textElement);
    }

    clear_all_text() {
        const textElements = document.getElementsByClassName("mask_id_text");
        for (const textElement of textElements) {
            textElement.remove();
        }
    }
}
