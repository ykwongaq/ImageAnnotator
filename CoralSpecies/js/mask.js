class Mask {
    constructor(
        mask_idx,
        image_idx,
        rle_mask,
        label_id = null,
        label_name = null
    ) {
        this.mask_id = mask_idx;
        this.image_idx = image_idx;
        this.rle_mask = rle_mask;
        this.label_id = label_id;
        this.label_name = label_name;
    }

    get_label_id() {
        return this.label_id;
    }

    get_label_name() {
        return this.label_name;
    }

    set_label_id(label_id) {
        this.label_id = label_id;
    }

    set_label_name(label_name) {
        this.label_name = label_name;
    }

    get_mask_idx() {
        return this.mask_id;
    }

    get_image_idx() {
        return this.image_idx;
    }

    get_mask() {
        return this.decode_rle_mask(this.rle_mask);
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
}
