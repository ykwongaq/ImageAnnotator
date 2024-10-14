const gallery = document.getElementById("gallery");
const fileInput = document.getElementById("file-input");
const selectFolder = document.getElementById("select-folder");

class PreprocessPage {
    constructor() {
        this.imageSelector = new ImageSelector();
        this.annotationProcessor = new AnnotationProcesser();

        this.deselectedGallery = document.getElementById("deselected-gallery");
        this.selectedGallery = document.getElementById("selected-gallery");

        this.dropAreaDom = document.getElementById("deselected-gallery");

        this.selectAllButton = document.getElementById("select-all-button");
        this.deselectAllButton = document.getElementById("deselect-all-button");

        this.processButton = document.getElementById("process-button");

        this.loadingIcon = document.getElementById("loading-icon");
        let loadingIconManager = new LoadingIconManager();
        loadingIconManager.setLoadingIcon(this.loadingIcon);
        loadingIconManager.hideLoadingIcon();

        this.imageCountText = document.getElementById(
            "selected-image-count-text"
        );
        this.progressBar = document.getElementById("image-progress-bar");
        this.progressText = document.getElementById("progress-text");
        this.processedCount = 0;

        this.continueButton = document.getElementById("continue-button");
        this.backMainPageButton = document.getElementById(
            "back-to-main-page-button"
        );
        this.galleryItems = [];

        // this.projectPathInput = document.getElementById("project-path-input");
    }

    enableChangeInGallery() {
        // Create a MutationObserver instance
        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === "childList") {
                    const childCount = this.getSelectedImagesCount();
                    this.imageCountText.textContent = `Selected Images: ${childCount}`;
                }
            }
        });

        // Configure the observer to listen for changes in the child nodes
        observer.observe(this.selectedGallery, { childList: true });
    }

    getSelectedImagesCount() {
        return this.selectedGallery.childElementCount;
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
            // this.clearUnselectedItem();
            const files = e.target.files;
            Array.from(files).forEach((file) => {
                if (file.type.startsWith("image/")) {
                    this.loadImage(file);
                }
            });
            dropArea.getDropText().style.display = "none";
        };

        dropArea.handleDrop = (e) => {
            e.preventDefault();

            // this.clearUnselectedItem();

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
            dropArea.getDropText().style.display = "none";
        };
        dropArea.enable();
    }

    clearUnselectedItem() {
        this.imageSelector.clearUnselectedData();
        this.deselectedGallery.innerHTML = "";

        // Remove the item in gallyItems
        this.galleryItems = this.galleryItems.filter((galleryItem) => {
            return this.selectedGallery.contains(galleryItem);
        });
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

    disableProcessButton() {
        this.processButton.disabled = true;
        this.processButton.style.borderColor = "gray";
        this.processButton.style.color = "gray";
        this.processButton.style.cursor = "not-allowed";
    }

    reEnableProcessButton() {
        this.processButton.disabled = false;
        this.processButton.style.borderColor = "black";
        this.processButton.style.color = "black";
        this.processButton.style.cursor = "pointer";
    }

    disableContinueButton() {
        this.continueButton.disabled = true;
        this.continueButton.style.borderColor = "gray";
        this.continueButton.style.color = "gray";
        this.continueButton.style.cursor = "not-allowed";
    }

    reEnableContinueButton() {
        this.continueButton.disabled = false;
        this.continueButton.style.borderColor = "black";
        this.continueButton.style.color = "black";
        this.continueButton.style.cursor = "pointer";
    }

    disableBackMainPageButton() {
        this.backMainPageButton.disabled = true;
        this.backMainPageButton.style.borderColor = "gray";
        this.backMainPageButton.style.color = "gray";
        this.backMainPageButton.style.cursor = "not-allowed";
    }

    reEnableBackMainPageButton() {
        this.backMainPageButton.disabled = false;
        this.backMainPageButton.style.borderColor = "black";
        this.backMainPageButton.style.color = "black";
        this.backMainPageButton.style.cursor = "pointer";
    }

    enableProcessButton() {
        this.processButton.addEventListener("click", () => {
            this.disableProcessButton();
            this.disableContinueButton();
            this.disableBackMainPageButton();

            const selectedImages = this.imageSelector.getSelectedImages();
            // Sort the selected images by filename
            selectedImages.sort((a, b) => {
                return a.localeCompare(b);
            });

            // const projectPath = this.projectPathInput.value;

            eel.select_folder()((projectPath) => {
                if (projectPath === null) {
                    console.log("No folder selected");
                    this.reEnableProcessButton();
                    return;
                }

                eel.check_valid_folder(projectPath)((response) => {
                    let isValid = response["success"];
                    let error_message = response["error_message"];

                    if (isValid) {
                        const imageSrc = [];
                        const imageFiles = [];

                        this.processedCount = 0;
                        this.progressBar.style.width = "0%";
                        this.progressText.textContent = "Process: (0 %)";

                        selectedImages.forEach((imageFile) => {
                            const imageTag =
                                this.imageSelector.getImageTagByFilename(
                                    imageFile
                                );
                            const data_url = imageTag.src;
                            this.annotationProcessor.process(
                                data_url,
                                imageFile,
                                projectPath,
                                (result) => {
                                    this.processedCount++;
                                    const percentage =
                                        (this.processedCount /
                                            selectedImages.length) *
                                        100;
                                    this.progressBar.style.width = `${percentage}%`;
                                    this.progressText.textContent = `Process: ${percentage.toFixed(
                                        2
                                    )} %`;

                                    if (
                                        this.processedCount ===
                                        selectedImages.length
                                    ) {
                                        this.reEnableProcessButton();
                                        this.reEnableContinueButton();
                                        this.reEnableBackMainPageButton();
                                        const topNav =
                                            new PreprocessTopNavigationBar();
                                        topNav.restoreIcon();
                                    }
                                }
                            );
                        });
                    } else {
                        alert(
                            "Invalid project path: " +
                                projectPath +
                                " with error: " +
                                error_message
                        );
                        this.reEnableProcessButton();
                        this.reEnableContinueButton();
                        this.reEnableBackMainPageButton();
                        return;
                    }
                });
            });
        });
    }

    loadImage(imageFile) {
        // Check if the imageFile added already
        const fileName = imageFile.name;
        if (this.imageSelector.images.includes(fileName)) {
            return;
        }

        const galleryItem = document.createElement("div");
        galleryItem.classList.add("gallery-item");

        const imgElement = document.createElement("img");
        const reader = new FileReader();
        reader.onload = (e) => {
            imgElement.src = e.target.result;
        };
        reader.readAsDataURL(imageFile);

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
        const success = this.imageSelector.selectImage(imageFile);
        if (success) {
            // Add it to the selected gallery
            this.selectedGallery.appendChild(galleryItem);
        }

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
    const preprocessPage = new PreprocessPage();
    preprocessPage.enableDropArea();
    preprocessPage.enableSelectAllButton();
    preprocessPage.enableDeselectAllButton();
    preprocessPage.enableProcessButton();
    // preprocessPage.configPage.enable();
    preprocessPage.enableChangeInGallery();
}

main();
