class Core {
    constructor() {
        if (Core.instance instanceof Core) {
            return Core.instance;
        }

        Core.instance = this;
        return this;
    }

    setCurrentDataByIdx(idx) {
        const dataset = new Dataset();
        dataset.setCurrentDataIdx(idx);

        dataset.getData((response) => {
            console.log(response);
            const imageUrl = response["image"];
            const jsonItem = response["json_item"];
            const imageFileName = response["filename"];
            const filteredIndics = response["filtered_indices"];

            if ("filter_config" in response) {
                const filter_config = response["filter_config"];

                // TODO: Update setting page
            }

            const data = new Data(imageUrl, jsonItem, imageFileName);

            // Decide which mask to display based on the filtered indices
            let maskIdx = 0;
            for (const mask of data.getMasks()) {
                if (filteredIndics.includes(maskIdx)) {
                    mask.setShouldDisplay(true);
                } else {
                    mask.setShouldDisplay(false);
                }
                maskIdx++;
            }

            dataset.setCurrentData(data);

            const canvas = new Canvas();
            canvas.setData(data);
            canvas.draw();

            eel.set_editting_image_by_idx(idx);

            this.clearEdittedMask();

            // TODO: Update statistic report

            this.updateProgressInfo(imageFileName, idx, dataset.totalImages);
        });
    }

    autoStart() {
        eel.get_dataset_size()((size) => {
            if (size > 0) {
                const dataset = new Dataset();
                dataset.setTotalImages(size);
                eel.get_current_image_idx()((idx) => {
                    this.setCurrentDataByIdx(idx);
                });

                eel.get_label_list()((labelList) => {
                    if (labelList.size === 0) {
                        return;
                    }
                    LabelManager.labels = labelList;

                    const labelView = new LabelView();
                    labelView.updateButtons();
                });
            }
        });
    }

    clearEdittedMask() {
        eel.clear_edit_mask_input_points()(() => {
            const canvas = new Canvas(null);
            canvas.updateEditingResult(null, [], []);
            canvas.setEdittingLabel(null);

            // TODO: Update Label View
        });
    }

    updateProgressInfo(imageName, currentIdx, totalIdx) {
        const progressInfoView = new ProgressInfoView();
        progressInfoView.setProgressInfo(imageName, currentIdx + 1, totalIdx);
        progressInfoView.setProgressBar(currentIdx + 1, totalIdx);
    }

    loadProject() {
        eel.select_folder()((folder_path) => {
            if (folder_path === null) {
                return;
            }

            eel.is_valid_project_folder(folder_path)((response) => {
                const success = response["success"];
                if (success) {
                    eel.load_project(folder_path)((errorMessage) => {
                        if (errorMessage != null) {
                            alert(errorMessage);
                            return;
                        }

                        this.autoStart();
                    });
                } else {
                    const errorMessage = response["error_message"];
                    alert(errorMessage);
                }
            });
        });
    }

    saveData() {
        const dataset = new Dataset();
        const currentData = dataset.getCurrentData();
        const currentDataIdx = dataset.currentDataIdx;
        const json_item = currentData.exportJson();
        const filename = currentData.imageFileName;
        eel.save_data(json_item, currentDataIdx, LabelManager.labels);
    }
}
