class CoralImage {
    constructor(image_path, json_path, image_idx) {
        const path = require("path");
        this.filename = path.parse(image_path).name;
        console.log("Image filename:", this.filename);

        this.image_path = image_path;
        this.image_idx = image_idx;

        this.json_data = this.read_json(json_path);
        this.masks = [];
        let mask_id = 0;
        for (let annotation of this.json_data["annotations"]) {
            const rle_mask = annotation["segmentation"]["counts"];
            const mask = new Mask(mask_id, this.image_idx, rle_mask, -1);
            this.masks.push(mask);
            mask_id += 1;
        }
    }

    get_image_path() {
        return this.image_path;
    }

    get_image_idx() {
        return this.image_idx;
    }

    get_masks_count() {
        return this.masks.length;
    }

    get_mask(mask_id) {
        return this.masks[mask_id];
    }

    get_masks() {
        return this.masks;
    }

    read_json(json_path) {
        const fs = require("fs");
        const json = fs.readFileSync(json_path, "utf8");
        const data = JSON.parse(json);
        return data;
    }
}
