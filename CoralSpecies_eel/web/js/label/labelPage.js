class LabelPage {
    constructor() {
        this.dropAreaDom = document.getElementById("drop-area");
        this.dropArea = new DropArea(this.dropAreaDom);

        this.categoryViewDom = document.getElementById("category-view");
        this.deleteContextMenuDom = document.getElementById(
            "delete-context-menu"
        );
        this.categoryView = new CategoryView(
            this.categoryViewDom,
            this.deleteContextMenuDom
        );

        this.dataset = new Dataset();

        const canvasDom = document.getElementById("canvas");
        this.canvas = new Canvas(canvasDom);

        this.loadDataFinished = false;

        this.editMaskUndoButton = document.getElementById(
            "edit-mask-undo-button"
        );
        this.editMaskResetButton = document.getElementById(
            "edit-mask-reset-button"
        );
        this.editMaskConfirmButton = document.getElementById(
            "edit-mask-confirm-button"
        );

        this.maskOpacitySilder = document.getElementById("mask-opacity-silder");

        this.statisticReport = new StatisticReport();
        this.statisticManager = new StatisticBoxManager(
            document.getElementById("statistic-box-container"),
            document.getElementById("statistic-box-template")
        );

        this.nextImageButton = document.getElementById("next-image-button");
        this.prevImageButton = document.getElementById("prev-image-button");
        this.resetViewpointButton = document.getElementById(
            "reset-viewpoint-button"
        );
    }

    run(totalImageCount) {
        this.dataset.setTotalImages(totalImageCount);
        this.setCurrentDataByIdx(0);
    }

    setCurrentDataByIdx(idx) {
        this.dataset.setCurrentDataIdx(idx);
        this.dataset.getData((response) => {
            const imageUrl = response["image"];
            const jsonItem = response["json_item"];
            const imageFileName = response["filename"];

            const data = new Data(imageUrl, jsonItem, imageFileName);
            this.dataset.setCurrentData(data);
            this.canvas.setData(data);
            this.canvas.draw();
            eel.set_editting_image_by_idx(idx);
            this.clearEdittedMask();

            this.statisticReport.setData(data);
            this.statisticReport.updateStatistic();
            this.statisticManager.updateStatistic(this.statisticReport);
        });
    }

    enableMaskModeButtons() {
        const maskModeRadios = document.querySelectorAll(
            'input[name="mask-mode"]'
        );
        maskModeRadios.forEach((radio) => {
            radio.addEventListener("change", (event) => {
                const mode = parseInt(event.target.value);
                Annotator.setMode(mode);
                Annotator.clearSelection();
                this.clearEdittedMask();
                this.hideEditActionButtons();
                if (mode == Annotator.ADD_MASK) {
                    this.showEditActionButtons();
                } else if (mode == Annotator.DELETE_MASK) {
                    this.showConfirmButton();
                }
            });
        });

        this.editMaskUndoButton.addEventListener("click", () => {
            eel.undo_edit_mask_input_point()((response) => {
                const annotation = response["annotation"];
                const selectedPoints = response["selected_points"];
                const labels = response["labels"];

                let mask = null;
                if (annotation) {
                    mask = new Mask(annotation);
                }
                const canvas = new Canvas(null);
                canvas.updateEditingResult(mask, selectedPoints, labels);
            });
        });

        this.editMaskConfirmButton.addEventListener("click", () => {
            if (Annotator.getCurrentMode() === Annotator.ADD_MASK) {
                eel.confirm_edit_mask_input()(() => {
                    const canvas = new Canvas(null);
                    const mask = canvas.getEdittingMask();
                    const currentData = this.dataset.getCurrentData();
                    currentData.addMask(mask);
                    canvas.updateEditingResult(null, [], []);
                    canvas.updateMasks();

                    this.statisticReport.updateStatistic();
                    this.statisticManager.updateStatistic(this.statisticReport);
                });
            } else if (Annotator.getCurrentMode() === Annotator.DELETE_MASK) {
                const selectedMasks = Annotator.getSelectedMasks();
                const currentData = this.dataset.getCurrentData();
                for (const mask of selectedMasks) {
                    currentData.removeMask(mask);
                }
                Annotator.clearSelection();
                const canvas = new Canvas(null);
                canvas.updateMasks();

                this.statisticReport.updateStatistic();
                this.statisticManager.updateStatistic(this.statisticReport);
            }
        });

        this.editMaskResetButton.addEventListener("click", () => {
            this.clearEdittedMask();
        });
    }

    clearEdittedMask() {
        eel.clear_edit_mask_input_points()(() => {
            const canvas = new Canvas(null);
            canvas.updateEditingResult(null, [], []);
            canvas.setEdittingLabel(null);

            this.categoryView.removeSelectedColor();
        });
    }

    showConfirmButton() {
        this.editMaskConfirmButton.style.display = "block";
    }

    showEditActionButtons() {
        this.editMaskUndoButton.style.display = "block";
        this.editMaskResetButton.style.display = "block";
        this.editMaskConfirmButton.style.display = "block";
    }

    hideEditActionButtons() {
        this.editMaskUndoButton.style.display = "none";
        this.editMaskResetButton.style.display = "none";
        this.editMaskConfirmButton.style.display = "none";
    }

    enableCategoryView() {
        this.categoryView.enable();
    }

    enableMaskOpacitySlider() {
        this.maskOpacitySilder.addEventListener("input", function (event) {
            const opacity = this.value / 100;
            const canvas = new Canvas(null);
            canvas.setMaskOpacity(opacity);
            // canvas.draw();
        });
    }

    saveData() {
        const currentData = this.dataset.getCurrentData();
        const currentDataIdx = this.dataset.currentDataIdx;
        const json_item = currentData.exportJson();
        const filename = currentData.imageFileName;
        eel.save_data(json_item, filename, currentDataIdx);
    }

    enableBottomButtons() {
        this.nextImageButton.addEventListener("click", () => {
            this.saveData();
            if (this.dataset.currentDataIdx < this.dataset.totalImages - 1) {
                this.setCurrentDataByIdx(this.dataset.currentDataIdx + 1);
            }
        });

        this.prevImageButton.addEventListener("click", () => {
            if (this.dataset.currentDataIdx > 0) {
                this.setCurrentDataByIdx(this.dataset.currentDataIdx - 1);
            }
        });

        this.resetViewpointButton.addEventListener("click", () => {
            const canvas = new Canvas(null);
            canvas.resetViewpoint();
        });
    }

    finishLoadingData(totalImageCount) {
        this.loadDataFinished = true;
        this.dataset.setTotalImages(totalImageCount);
    }

    enableDropArea() {
        const dropArea = new DropArea(this.dropAreaDom);
        dropArea.handleClick = (e) => {
            eel.clear_dataset();
            this.loadDataFinished = false;
            const files = dropArea.getFileInput().files;
            const totalFiles = files.length;
            let filesProcesssed = 0;
            for (const file of files) {
                const relativePath = file.webkitRelativePath || file.name;

                const reader = new FileReader();
                reader.onload = (event) => {
                    // Extract base64 dsata
                    const fileContent = event.target.result.split(",")[1];
                    console.log("relativePath: ", relativePath);
                    eel.receive_file(fileContent, relativePath);
                    filesProcesssed++;
                    if (filesProcesssed === totalFiles) {
                        eel.init_dataset()(this.run.bind(this));
                    }
                };
                reader.readAsDataURL(file);
            }
        };

        dropArea.handleDrop = (e) => {
            eel.clear_dataset();
            e.preventDefault();
            this.loadDataFinished = false;
            const items = e.dataTransfer.items;
            let promises = [];

            if (items) {
                // Use DataTransferItemList interface to access the items
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const entry = item.getAsEntry
                        ? item.getAsEntry()
                        : item.webkitGetAsEntry();

                    if (entry) {
                        promises.push(this.traverseFileTree(entry));
                    }
                }

                Promise.all(promises)
                    .then(() => {
                        // All files processed
                        console.log("All files have been processed.");
                        eel.init_dataset()(this.run.bind(this));
                    })
                    .catch(function (error) {
                        console.error("Error processing files:", error);
                    });
            }
        };
        dropArea.enable();
    }

    traverseFileTree(item, path = "") {
        return new Promise((resolve, reject) => {
            if (item.isFile) {
                item.file(
                    function (file) {
                        // Process the file here
                        console.log("File:", path + file.name);

                        const reader = new FileReader();
                        reader.onload = function (event) {
                            const data = event.target.result;

                            // Send data to Python-Eel
                            eel.receive_file(
                                data,
                                path + file.name
                            )(function () {
                                // File processing is done
                                resolve();
                            });
                        };
                        reader.onerror = function (error) {
                            reject(error);
                        };
                        reader.readAsDataURL(file);
                    },
                    function (error) {
                        reject(error);
                    }
                );
            } else if (item.isDirectory) {
                const dirReader = item.createReader();
                let entries = [];

                // Read all directory entries
                const readEntries = () => {
                    dirReader.readEntries(
                        (results) => {
                            if (results.length) {
                                entries = entries.concat(Array.from(results));
                                readEntries(); // Continue reading entries
                            } else {
                                // All entries have been read
                                let promises = entries.map((entry) =>
                                    this.traverseFileTree(
                                        entry,
                                        path + item.name + "/"
                                    )
                                );
                                Promise.all(promises)
                                    .then(() => resolve())
                                    .catch((error) => reject(error));
                            }
                        },
                        (error) => {
                            reject(error);
                        }
                    );
                };
                readEntries(); // Start reading entries
            } else {
                // Not a file or directory
                resolve();
            }
        });
    }
}

function main() {
    const labelPage = new LabelPage();
    labelPage.enableDropArea();
    labelPage.enableCategoryView();
    labelPage.enableMaskModeButtons();
    labelPage.enableMaskOpacitySlider();
    labelPage.enableBottomButtons();
}

main();