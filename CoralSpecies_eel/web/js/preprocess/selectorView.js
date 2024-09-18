const gallery = document.getElementById("gallery");
const fileInput = document.getElementById("file-input");
const selectFolder = document.getElementById("select-folder");

class SelectorView {
    constructor() {
        this.imageSelector = new ImageSelector();
        this.annotationProcessor = new AnnotationProcesser();

        this.deselectedGallery = document.getElementById("deselected-gallery");
        this.selectedGallery = document.getElementById("selected-gallery");

        this.dropAreaDom = document.getElementById("drop-area");

        this.selectAllButton = document.getElementById("select-all-button");
        this.deselectAllButton = document.getElementById("deselect-all-button");

        this.processButton = document.getElementById("process-button");

        this.galleryItems = [];
    }

    enableDropArea() {
        function readDirectory(directoryEntry) {
            const dirReader = directoryEntry.createReader();
            dirReader.readEntries((entries) => {
                for (let entry of entries) {
                    if (entry.isDirectory) {
                        readDir(entry);
                    } else if (entry.isFile) {
                        processFileEntry(entry);
                    }
                }
            });
        }

        const processFileEntry = (fileEntry) => {
            fileEntry.file((file) => {
                if (file.type.startsWith("image/")) {
                    this.loadImage(file);
                }
            });
        };

        const dropArea = new DropArea(this.dropAreaDom);

        dropArea.handleClick = (e) => {
            e.preventDefault();
            this.imageSelector.clearData();
            this.deselectedGallery.innerHTML = "";
            this.selectedGallery.innerHTML = "";
            const files = e.target.files;
            Array.from(files).forEach((file) => {
                if (file.type.startsWith("image/")) {
                    this.loadImage(file);
                }
            });
        };

        dropArea.handleDrop = (e) => {
            e.preventDefault();
            this.imageSelector.clearData();
            this.deselectedGallery.innerHTML = "";
            this.selectedGallery.innerHTML = "";

            let dt = e.dataTransfer;
            let items = dt.items;

            for (let i = 0; i < items.length; i++) {
                let itemEntry = items[i].webkitGetAsEntry(); // Get the entry
                if (itemEntry) {
                    if (itemEntry.isDirectory) {
                        // Read directory contents
                        readDirectory(itemEntry);
                    } else if (itemEntry.isFile) {
                        // Process file
                        processFileEntry(itemEntry);
                    }
                }
            }
        };
        dropArea.enable();
    }

    enableSelectAllButton() {
        this.selectAllButton.addEventListener("click", () => {
            this.galleryItems.forEach((galleryItem) => {
                const imageFile =
                    galleryItem.querySelector("div").firstChild.textContent;
                this.selectImage(imageFile, galleryItem);
            });
        });
    }

    enableDeselectAllButton() {
        this.deselectAllButton.addEventListener("click", () => {
            this.galleryItems.forEach((galleryItem) => {
                const imageFile =
                    galleryItem.querySelector("div").firstChild.textContent;
                this.deselectImage(imageFile, galleryItem);
            });
        });
    }

    enableProcessButton() {
        this.processButton.addEventListener("click", () => {
            const selectedImages = this.imageSelector.getSelectedImages();

            const imageSrc = [];
            const imageFiles = [];

            selectedImages.forEach((imageFile) => {
                const imageTag =
                    this.imageSelector.getImageTagByFilename(imageFile);
                const data_url = imageTag.src;
                this.annotationProcessor.process(data_url, imageFile);
            });
        });
    }

    loadImage(imageFile) {
        const galleryItem = document.createElement("div");
        galleryItem.classList.add("gallery-item");

        const imgElement = document.createElement("img");
        const reader = new FileReader();
        reader.onload = (e) => {
            imgElement.src = e.target.result;
        };
        reader.readAsDataURL(imageFile);

        const fileName = imageFile.name;
        const filenameElement = document.createElement("div");
        filenameElement.textContent = fileName;

        galleryItem.appendChild(imgElement);
        galleryItem.appendChild(filenameElement);

        // When the gallery item is double clicked,
        // check is it selected or not. If selected, deselect it.
        // If not selected, select it.
        galleryItem.addEventListener("dblclick", () => {
            if (this.imageSelector.isSelected(fileName)) {
                this.deselectImage(fileName, galleryItem);
            } else {
                this.selectImage(fileName, galleryItem);
            }
        });

        this.imageSelector.addData(fileName, imgElement);
        this.deselectedGallery.appendChild(galleryItem);
        this.galleryItems.push(galleryItem);
    }

    selectImage(imageFile, galleryItem) {
        this.imageSelector.selectImage(imageFile);

        // Add it to the selected gallery
        this.selectedGallery.appendChild(galleryItem);

        // Remove it from the deselected gallery
        if (this.deselectedGallery.contains(galleryItem)) {
            this.deselectedGallery.removeChild(galleryItem);
        }
    }

    deselectImage(imageFile, galleryItem) {
        this.imageSelector.deselectImage(imageFile);

        // Add it to the deselected gallery
        this.deselectedGallery.appendChild(galleryItem);

        // Remove it from the selected gallery
        if (this.selectedGallery.contains(galleryItem)) {
            this.selectedGallery.removeChild(galleryItem);
        }
    }

    addSelectedImageToGallery(imageFile) {
        const container = document.createElement("div");
        container.classList.add("gallery-item");

        const imgElement = document.createElement("img");
        imgElement.src = URL.createObjectURL(imageFile);

        const filenameElement = document.createElement("div");
        filenameElement.textContent = imageFile.name;

        container.appendChild(imgElement);
        container.appendChild(filenameElement);

        this.selectedGallery.appendChild(container);
    }
}

function main() {
    const selectorView = new SelectorView();
    selectorView.enableDropArea();
    selectorView.enableSelectAllButton();
    selectorView.enableDeselectAllButton();
    selectorView.enableProcessButton();
}

main();