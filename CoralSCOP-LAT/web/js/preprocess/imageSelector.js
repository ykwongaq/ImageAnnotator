class ImageSelector {
    constructor() {
        this.images = [];
        this.selectedImages = [];
        this.imageTags = {};
    }

    clearAllData() {
        this.images = [];
        this.selectedImages = [];
        this.imageTags = {};
    }

    clearUnselectedData() {
        // Remove the unselecte image and imageTag from the list
        this.images = this.images.filter((image) => {
            return this.selectedImages.includes(image);
        });
        let newImageTags = {};
        for (let image of this.images) {
            newImageTags[image] = this.imageTags[image];
        }
        this.imageTags = newImageTags;
    }

    addData(image, imageTag) {
        this.images.push(image);
        this.imageTags[image] = imageTag;
    }

    getImageTagByFilename(image) {
        return this.imageTags[image];
    }

    selectImage(image) {
        if (this.selectedImages.includes(image)) {
            return false;
        }
        this.selectedImages.push(image);
        return true;
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
