/**
 * Core of the frontend. It is used to communicate with the backend.
 */
class Core {
    constructor() {
        if (Core.instance) {
            return Core.instance;
        }
        Core.instance = this;
        this.data = null;

        this.dataModified = false;

        return this;
    }

    selectFile(callBack = null) {
        eel.select_file()((filePath) => {
            if (filePath === null) {
                return;
            }
            callBack(filePath);
        });
    }

    selectFolder(callBack = null) {
        eel.select_folder()((folderPath) => {
            if (folderPath === null) {
                return;
            }
            callBack(folderPath);
        });
    }

    loadProject() {
        this.selectFile((filePath) => {
            if (filePath === null) {
                return;
            }

            eel.load_project(filePath)((galleryDataList) => {
                eel.get_current_data()((response) => {
                    // Update the category information
                    const categoryManager = new CategoryManager();
                    categoryManager.updateCategoryList(
                        response["category_info"]
                    );

                    const galleryPage = new GalleryPage();
                    galleryPage.updateGallery(galleryDataList);

                    const data = Data.parseResponse(response);
                    this.setData(data);
                    this.showData();

                    const navigationBar = new NavigationBar();
                    navigationBar.showPage(NavigationBar.ANNOTATION_PAGE);
                });
            });
        });
    }

    loadProjectFromPath(filePath, callBack = null) {
        eel.load_project(filePath)((galleryDataList) => {
            eel.get_current_data()((response) => {
                // Update the category information
                const categoryManager = new CategoryManager();
                categoryManager.updateCategoryList(response["category_info"]);
                categoryManager.updateStatus(response["status_info"]);

                const galleryPage = new GalleryPage();
                galleryPage.updateGallery(galleryDataList);

                const data = Data.parseResponse(response);
                this.setData(data);
                this.showData();

                const navigationBar = new NavigationBar();
                navigationBar.showPage(NavigationBar.ANNOTATION_PAGE);

                if (callBack != null) {
                    callBack();
                }
            });
        });
    }

    setData(data) {
        this.data = data;
    }

    getData() {
        return this.data;
    }

    /**
     * Save the current data
     * {
     *   "images": List[Dict]
     *   "annotations": List[Dict]
     *   "category_info": List[Dict]
     * }
     * @param {function} callBack
     */
    save(callBack = null) {
        const data = this.data.toJson();

        const categoryManager = new CategoryManager();
        const categoryInfo = categoryManager.toJson();

        data["category_info"] = categoryInfo;

        eel.save_data(data)(() => {
            this.setDataModified(false);
            if (callBack != null) {
                callBack();
            }
        });
    }

    nextData(callBack = null) {
        this.save(() => {
            eel.get_next_data()((response) => {
                if (response === null) {
                    alert("Failed to load next data");
                    return;
                }

                this.setData(Data.parseResponse(response));
                this.showData();

                if (callBack != null) {
                    callBack();
                }
            });
        });
    }

    prevData(callBack = null) {
        this.save(() => {
            eel.get_prev_data()((response) => {
                if (response === null) {
                    alert("Failed to load previous data");
                    return;
                }

                this.setData(Data.parseResponse(response));
                this.showData();

                if (callBack != null) {
                    callBack();
                }
            });
        });
    }

    jumpData(idx, callBack = null) {
        this.save(() => {
            eel.get_data_by_idx(idx)((response) => {
                if (response === null) {
                    alert("Failed to load data");
                    return;
                }

                this.setData(Data.parseResponse(response));
                this.showData();

                if (callBack != null) {
                    callBack();
                }
            });
        });
    }

    showData() {
        const canvas = new Canvas();
        canvas.showData(this.data);

        const labelPanel = new LabelPanel();
        labelPanel.updateCategoryButtons();

        const actionPanel = new ActionPanel();
        actionPanel.updateCategoryButtons();

        const topPanel = new TopPanel();
        topPanel.update();
    }

    saveDataset(output_dir, callBack = null) {
        eel.save_dataset(output_dir)(() => {
            if (callBack != null) {
                callBack();
            }
        });
    }

    createPromptedMask(prompts) {
        return eel.create_mask(prompts)();
    }

    setDataModified(modified) {
        this.dataModified = modified;
    }

    isDataModified() {
        return this.dataModified;
    }

    /**
     * Get the list of id of the images that
     * contain the category
     * @param {Category} category
     * @returns {Array} List of image ids that contain the category
     */
    async getImageIdsByCategory(category) {
        const imageIds = new Set();
        const categoryId = category.getCategoryId();

        // Check current data
        const data = this.getData();
        for (const mask of data.getMasks()) {
            if (mask.getCategory().getCategoryId() === categoryId) {
                imageIds.add(data.getIdx());
            }
        }

        const otherIds = await eel.get_data_ids_by_category_id(
            category.getCategoryId()
        )();
        for (const id of otherIds) {
            // Ignore the current data, since the data is not saved
            if (id === data.getIdx()) {
                continue;
            }
            imageIds.add(id);
        }

        return imageIds;
    }

    exportImages(outputDir, callBack = null) {
        eel.export_images(outputDir)(() => {
            if (callBack != null) {
                callBack();
            }
        });
    }

    exportAnnotatedImages(outputDir, callBack = null) {
        console.log("Exporting annotated images");
        this.getDataList(dataList, async () => {
            console.log("Data list", dataList);
            const annotatedDataInfoList = [];
            for (const data of dataList) {
                try {
                    console.log("Exporting", data.getImageName());
                    const annotationRenderer = new AnnotationRenderer();
                    await annotationRenderer.render(data);
                    const encodedImage = annotationRenderer.getEncodedImage();
                    const imageName = data.getImageName();
                    const annotatedDataInfo = {
                        image_name: imageName,
                        encoded_image: encodedImage,
                    };
                    annotatedDataInfoList.push(annotatedDataInfo);
                } catch (error) {
                    console.error("Failed to export", data.getImageName());
                    console.error(error);
                }
            }

            console.log(annotatedDataInfoList);
            eel.export_annotated_images(
                outputDir,
                annotatedDataInfoList
            )(() => {
                if (callBack != null) {
                    callBack();
                }
            });
        });
    }

    getDataList(callBack = null) {
        eel.get_data_list()((dataInfoList) => {
            const dataList = [];
            for (const dataInfo of dataInfoList) {
                dataList.push(Data.parseResponse(dataInfo));
            }

            if (callBack != null) {
                callBack(dataList);
            }
        });
    }
}
