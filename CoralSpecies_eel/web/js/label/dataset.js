class Mask {
    constructor(annotation) {
        this.annotation = annotation;
        this.categoryId = annotation["category_id"];
        this.categoryName = annotation["category_name"];
        this.maskId = annotation["id"];
        this.decodeMask = null;

        this.width = annotation["segmentation"]["size"][1];
        this.height = annotation["segmentation"]["size"][0];

        this.maskColor = LabelManager.getColorById(this.categoryId);

        this.area = annotation["area"];
    }

    exportJson() {
        return {
            id: this.maskId,
            category_id: parseInt(this.categoryId),
            segmentation: {
                size: [this.height, this.width],
                counts: this.annotation["segmentation"]["counts"],
            },
            area: this.area,
            bbox: this.annotation["bbox"],
        };
    }

    getArea() {
        return this.area;
    }

    setColor(color) {
        this.maskColor = color;
    }

    getColor() {
        return this.maskColor;
    }

    setCategoryId(categoryId) {
        this.categoryId = categoryId;
    }

    setCategoryName(categoryName) {
        this.categoryName = categoryName;
    }

    getCategoryId() {
        return this.categoryId;
    }

    getCategoryName() {
        return this.categoryName;
    }

    getAnnotation() {
        return this.annotation;
    }

    getMaskId() {
        return this.maskId;
    }

    getDecodedMask() {
        if (this.decodeMask === null) {
            this.decodeMask = this.decodeRleMask(
                this.annotation["segmentation"]["counts_number"]
            );
        }
        return this.decodeMask;
    }

    containPixel(x, y) {
        const mask = this.getDecodedMask();
        return mask[y * this.width + x] === 1;
    }

    getMiddlePoint() {
        const mask = this.getDecodedMask();
        let x_sum = 0;
        let y_sum = 0;
        let count = 0;

        for (let i = 0; i < mask.length; i++) {
            if (mask[i] === 1) {
                const x = i % this.width;
                const y = Math.floor(i / this.width);
                x_sum += x;
                y_sum += y;
                count++;
            }
        }

        if (count === 0) return null; // Handle the case where no points are found

        const middle_x = Math.floor(x_sum / count);
        const middle_y = Math.floor(y_sum / count);
        return [middle_x, middle_y];
    }

    decodeRleMask(rle_mask) {
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
}

class Data {
    constructor(imageDataUrl, jsonItem, imageFileName) {
        this.imageDataUrl = imageDataUrl;
        this.json_item = jsonItem;
        this.masks = [];
        for (const annotation of jsonItem["annotations"]) {
            this.masks.push(new Mask(annotation));
        }
        this.imageFileName = imageFileName;
        this.imageId = jsonItem["image"]["image_id"];
    }

    getImageUrl() {
        return this.imageDataUrl;
    }

    getAnnotations() {
        return this.annotations;
    }

    getImageFileName() {
        return this.imageFileName;
    }

    getImageHeight() {
        return this.json_item["image"]["height"];
    }

    getImageWidth() {
        return this.json_item["image"]["width"];
    }

    getMasks() {
        return this.masks;
    }

    getMaskCount() {
        return this.masks.length;
    }

    addMask(mask) {
        mask["id"] = this.masks.length;
        mask["image_id"] = this.imageId;

        this.masks.push(mask);
    }

    removeMask(mask) {
        this.masks = this.masks.filter((m) => m !== mask);
    }

    exportJson() {
        const jsonItem = {};
        jsonItem["image"] = this.json_item["image"];

        const annotations = [];
        for (const mask of this.masks) {
            const maskJson = mask.exportJson();
            maskJson["image_id"] = this.imageId;
            annotations.push(maskJson);
        }
        jsonItem["annotations"] = annotations;
        jsonItem["categories"] = this.extractCategoryJson();

        return jsonItem;
    }

    extractCategoryJson() {
        const categoryDict = {};
        for (const mask of this.masks) {
            const categoryId = mask.getCategoryId();
            const categoryName = mask.getCategoryName();

            if (!(categoryId in categoryDict)) {
                categoryDict[categoryId] = categoryName;
            }
        }

        const categoryJson = [];
        for (const categoryId in categoryDict) {
            categoryJson.push({
                id: categoryId,
                name: categoryDict[categoryId],
                supercategory: categoryDict[categoryId],
            });
        }

        return categoryJson;
    }
}

class Dataset {
    constructor() {
        if (Dataset.instance) {
            return Dataset.instance;
        }

        Dataset.instance = this;
        this.currentDataIdx = 0;
        this.currentData = null;
        this.totalImages = 0;

        return this;
    }

    setTotalImages(totalImages) {
        console.log("Total images: ", totalImages);
        this.totalImages = totalImages;
    }

    setCurrentDataIdx(idx) {
        this.currentDataIdx = idx;
    }

    setCurrentData(data) {
        this.currentData = data;
    }

    getCurrentData() {
        return this.currentData;
    }

    getData(callbackFunction = null) {
        eel.get_data(this.currentDataIdx)(callbackFunction);
    }
}