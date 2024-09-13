class CoralImage {
    constructor(image_path, image_embedding_path, json_path, image_idx) {
        const path = require("path");
        this.filename = path.parse(image_path).name;

        this.image_path = image_path;
        this.image_idx = image_idx;

        this.image_embedding_path = image_embedding_path;

        this.json_data = this.read_json(json_path);
        // this.processed_json_data = this.read_json(progressed_json_path);
        this.masks = [];
        let mask_id = 0;

        for (let annotation of this.json_data["annotations"]) {
            const mask = new Mask(annotation, mask_id, image_idx);
            this.masks.push(mask);
            mask_id += 1;
        }
    }

    export_json() {
        const output_annotations = [];
        for (let mask_idx = 0; mask_idx < this.masks.length; mask_idx++) {
            const mask = this.masks[mask_idx];
            // const annotation = this.json_data["annotations"][mask_idx];
            const annotation = mask.get_annotation();

            const output_annotation = structuredClone(annotation);
            output_annotation["label_id"] = mask.get_label_id();
            output_annotation["label_name"] = mask.get_label_name();
            delete output_annotation["segmentation"]["counts_number"];
            output_annotations.push(output_annotation);
        }
        this.json_data["annotations"] = output_annotations;
        return this.json_data;
    }

    remove_mask(mask) {
        const mask_idx = this.masks.indexOf(mask);
        if (mask_idx > -1) {
            this.masks.splice(mask_idx, 1);
        }
    }
    get_image_path() {
        return this.image_path;
    }

    get_image_idx() {
        return this.image_idx;
    }

    get_latest_mask_id() {
        let maskId = 0;
        for (let mask of this.masks) {
            maskId = Math.max(maskId, mask.get_mask_id());
        }
        return maskId;
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

    get_image_embedding_path() {
        return this.image_embedding_path;
    }

    add_mask(mask) {
        this.masks.push(mask);
    }
}
