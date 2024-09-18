class ImageSelector {
    constructor() {
        this.images = [];
        this.selectedImages = [];
        this.imageTags = {};
    }

    clearData() {
        this.images = [];
        this.selectedImages = [];
        this.imageTags = {};
    }

    addData(image, imageTag) {
        this.images.push(image);
        this.imageTags[image] = imageTag;
    }

    getImageTagByFilename(image) {
        return this.imageTags[image];
    }

    selectImage(image) {
        this.selectedImages.push(image);
    }

    deselectImage(image) {
        this.selectedImages = this.selectedImages.filter((selectedImage) => {
            return selectedImage !== image;
        });
    }

    getSelectedImages() {
        return this.selectedImages;
    }

    isSelected(image) {
        return this.selectedImages.includes(image);
    }
}
