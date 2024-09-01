class MaskDrawer {
    constructor() {
        this.image_view = document.getElementById("image-view");
        this.canvas = document.getElementById("canvas");
    }

    show_data(data, show_annotations = true) {
        const width = data.get_width();
        const height = data.get_height();

        console.log("Width:", width);
        console.log("Height:", height);

        this.canvas.width = width;
        this.canvas.height = height;

        const ctx = this.canvas.getContext("2d");
        const imageData = ctx.createImageData(width, height);

        const masks = data.get_masks();
        for (const mask of masks) {
            for (let i = 0; i < mask.length; i++) {
                const x = i % width;
                const y = Math.floor(i / width);

                const index = (y * width + x) * 4; // Get the corresponding index in the ImageData array

                if (mask[i] === 1) {
                    // Set the color to red (RGBA)
                    imageData.data[index] = 0; // R
                    imageData.data[index + 1] = 255; // G
                    imageData.data[index + 2] = 0; // B
                    imageData.data[index + 3] = 255; // A (opacity)
                } else {
                    // Set the pixel to transparent
                    imageData.data[index + 3] = 0; // A (opacity)
                }
            }

            // Draw the ImageData to the canvas
            ctx.putImageData(imageData, 0, 0);
        }
    }
    // show_data(data, show_annotations = true) {
    //     const image_path = data.get_image_path();

    //     this.canvas.width = 1024;
    //     this.canvas.height = 1024;

    //     const image = new Image();

    //     const ctx = this.canvas.getContext("2d");

    //     const masks = data.get_masks();

    //     image.onload = () => {
    //         const imgWidth = image.width;
    //         const imgHeight = image.height;
    //         const canvasWidth = canvas.width;
    //         const canvasHeight = canvas.height;

    //         // Calculate aspect ratio
    //         const imgAspectRatio = imgWidth / imgHeight;
    //         const canvasAspectRatio = canvasWidth / canvasHeight;

    //         let drawWidth, drawHeight;

    //         if (imgAspectRatio > canvasAspectRatio) {
    //             // Image is wider than canvas
    //             drawWidth = canvasWidth;
    //             drawHeight = canvasWidth / imgAspectRatio;
    //         } else {
    //             // Image is taller than canvas or perfectly fits
    //             drawHeight = canvasHeight;
    //             drawWidth = canvasHeight * imgAspectRatio;
    //         }

    //         // Center the image on the canvas
    //         const x = (canvasWidth - drawWidth) / 2;
    //         const y = (canvasHeight - drawHeight) / 2;

    //         // Draw the image on the canvas
    //         ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear canvas before drawing
    //         ctx.drawImage(image, x, y, drawWidth, drawHeight);

    //         if (show_annotations) {
    //             // mask = masks[0];
    //             // const mask_image_data = this.createMaskImageData(
    //             //     mask,
    //             //     drawWidth,
    //             //     drawHeight
    //             // );
    //             // ctx.putImageData(mask_image_data, x, y);
    //             masks.forEach((mask) => {
    //                 const mask_image_data = this.createMaskImageData(
    //                     mask,
    //                     imgWidth,
    //                     imgHeight,
    //                     drawWidth,
    //                     drawHeight,
    //                     x,
    //                     y
    //                 );
    //                 ctx.putImageData(mask_image_data, 0, 0);
    //             });
    //         }
    //     };
    //     image.src = image_path;
    // }

    // Create ImageData object from binary mask data
    createMaskImageData(
        maskData,
        maskWidth,
        maskHeight,
        drawWidth,
        drawHeight,
        offsetX,
        offsetY
    ) {
        const imageData = new ImageData(drawWidth, drawHeight);
        const data = imageData.data;

        for (let row = 0; row < maskHeight; row++) {
            for (let col = 0; col < maskWidth; col++) {
                const value = maskData[row * maskWidth + col]; // Flattened index
                const index = (row * drawWidth + col) * 4; // ImageData index

                if (value === 1) {
                    data[index] = 0; // Red
                    data[index + 1] = 255; // Green
                    data[index + 2] = 0; // Blue
                    data[index + 3] = 128; // Alpha (semi-transparent)
                } else {
                    data[index + 3] = 0; // Fully transparent
                }
            }
        }

        return imageData;
    }
}
