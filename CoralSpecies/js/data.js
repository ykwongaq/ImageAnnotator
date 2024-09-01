class Data {
    constructor(image_path, json_path) {
        this.image_path = image_path;
        this.json_data = this.read_json(json_path);
        // this.width = this.json_data["annotations"]["width"];
        // this.height = this.json_data["image"]["height"];

        this.rle_masks = [];
        for (let annotation of this.json_data["annotations"]) {
            this.rle_masks.push(annotation["segmentation"]["counts"]);
            this.width = annotation["segmentation"]["size"][1];
            this.height = annotation["segmentation"]["size"][0];
        }

        this.labels = [];
        for (let mask of this.rle_masks) {
            this.labels.push(-1);
        }
    }

    get_image_path() {
        return this.image_path;
    }

    get_rle_masks() {
        return this.rle_masks;
    }

    get_masks() {
        const masks = [];
        for (let rle_mask of this.rle_masks) {
            masks.push(this.decode_rle_mask(rle_mask));
        }
        return masks;
    }

    decode_rle_mask(rle_mask) {
        let flattenArray = [];
        let value = false;
        for (const length of rle_mask) {
            const newArray = Array(length).fill(value);
            flattenArray = flattenArray.concat(newArray);
            value = !value;
        }

        const mask = [];
        for (let i = 0; i < flattenArray.length; i += 1) {
            let element = flattenArray[i];
            if (element) {
                mask.push(1);
            } else {
                mask.push(0);
            }
        }
        return mask;
    }

    get_width() {
        return this.width;
    }

    get_height() {
        return this.height;
    }

    get_labels() {
        return this.labels;
    }

    read_json(json_path) {
        const fs = require("fs");
        const json = fs.readFileSync(json_path, "utf8");
        const data = JSON.parse(json);
        return data;
    }
}
