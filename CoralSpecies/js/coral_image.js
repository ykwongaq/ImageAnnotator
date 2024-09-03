class CoralImage {
    constructor(image_path, json_path, progressed_json_path, image_idx) {
        const path = require("path");
        this.filename = path.parse(image_path).name;

        this.image_path = image_path;
        this.image_idx = image_idx;

        this.json_data = this.read_json(json_path);
        this.processed_json_data = this.read_json(progressed_json_path);
        this.masks = [];
        let mask_id = 0;
        for (let annotation of this.processed_json_data["annotations"]) {
            const rle_mask = annotation["segmentation"]["counts"];
            const label_id = annotation["label_id"];
            const label_name = annotation["label_name"];
            const mask = new Mask(
                mask_id,
                this.image_idx,
                rle_mask,
                label_id,
                label_name
            );
            this.masks.push(mask);
            mask_id += 1;
        }
    }

    export_json() {
        for (let mask_idx = 0; mask_idx < this.masks.length; mask_idx++) {
            const mask = this.masks[mask_idx];
            const annotation = this.json_data["annotations"][mask_idx];
            annotation["label_id"] = mask.get_label_id();
            annotation["label_name"] = mask.get_label_name();
        }
        return this.json_data;
    }

    get_image_path() {
        return this.image_path;
    }

    get_image_idx() {
        return this.image_idx;
    }

    get_image_filename() {
        return this.filename;
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
