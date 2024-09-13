class Mask {
    constructor(annotation, mask_id, image_idx) {
        this.mask_id = mask_id;
        this.annotation = annotation;
        this.rle_mask = annotation["segmentation"]["counts_number"];
        this.height = annotation["segmentation"]["size"][0];
        this.width = annotation["segmentation"]["size"][1];
        this.image_idx = image_idx;
        this.mask = null;

        let label_id = annotation["label_id"];
        let label_name = annotation["label_name"];
        this.label = new Label(label_id, label_name);
    }

    get_label_id() {
        return this.label.get_label_id();
    }

    get_label_name() {
        return this.label.get_label_name();
    }

    set_label_id(label_id) {
        this.label.set_label_id(label_id);
    }

    set_label_name(label_name) {
        this.label.set_label_name(label_name);
    }

    get_mask_idx() {
        return this.mask_id;
    }

    get_annotation() {
        return this.annotation;
    }

    get_image_idx() {
        return this.image_idx;
    }

    set_color(color) {
        this.label.set_color(color);
    }

    get_mask() {
        if (this.mask === null) {
            this.mask = this.decode_rle_mask(this.rle_mask);
        }
        return this.mask;
    }

    get_color() {
        return this.label.get_color();
    }

    contain_pixel(x, y) {
        const mask = this.get_mask();
        return mask[y * this.width + x] === 1;
    }

    set_color_by_id() {
        this.label.set_color_by_id();
    }

    decode_rle_mask(rle_mask) {
        const totalLength = rle_mask.reduce((sum, len) => sum + len, 0);
        const mask = new Uint8Array(totalLength); // Use Uint8Array for better performance

        let index = 0;
        let value = 0;

        for (let i = 0; i < rle_mask.length; i++) {
            const length = rle_mask[i];
            mask.fill(value, index, index + length);
            index += length;
            value = 1 - value; // Toggle between 0 and 1
        }

        return mask;
    }

    get_middle_pixel() {
        const mask = this.get_mask();
        let x_sum = 0;
        let y_sum = 0;
        let count = 0;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (mask[y * this.width + x] === 1) {
                    x_sum += x;
                    y_sum += y;
                    count++;
                }
            }
        }

        let middle_x = Math.floor(x_sum / count);
        let middle_y = Math.floor(y_sum / count);
        return [middle_x, middle_y];
    }
}
