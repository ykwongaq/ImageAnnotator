class BottomNavigationBar {
    constructor() {
        this.prevImageButton = document.getElementById("prev-image-button");
        this.nextImageButton = document.getElementById("next-image-button");
        this.resetViewPoint = document.getElementById("reset-viewpoint-button");
        this.toogleMaskButton = document.getElementById("toogle-mask-button");
    }

    enable() {
        this.enablePrevImageButton();
        this.enableNextImageButton();
        this.enableResetViewPointButton();
        this.enableToogleMaskButton();
    }

    disable() {
        this.disablePrevImageButton();
        this.disableNextImageButton();
        this.disableResetViewPointButton();
        this.disableToogleMaskButton();
    }

    reEnable() {
        this.reEnablePrevImageButton();
        this.reEnableNextImageButton();
        this.reEnableResetViewPointButton();
        this.reEnableToogleMaskButton();
    }

    disablePrevImageButton() {
        this.prevImageButton.disabled = true;
        this.prevImageButton.style.color = "gray";
        this.prevImageButton.style.cursor = "not-allowed";
    }

    reEnablePrevImageButton() {
        this.prevImageButton.disabled = false;
        this.prevImageButton.style.color = "black";
        this.prevImageButton.style.cursor = "pointer";
    }

    disableNextImageButton() {
        this.nextImageButton.disabled = true;
        this.nextImageButton.style.color = "gray";
        this.nextImageButton.style.cursor = "not-allowed";
    }

    reEnableNextImageButton() {
        this.nextImageButton.disabled = false;
        this.nextImageButton.style.color = "black";
        this.nextImageButton.style.cursor = "pointer";
    }

    disableResetViewPointButton() {
        this.resetViewPoint.disabled = true;
        this.resetViewPoint.style.color = "gray";
        this.resetViewPoint.style.cursor = "not-allowed";
    }

    reEnableResetViewPointButton() {
        this.resetViewPoint.disabled = false;
        this.resetViewPoint.style.color = "black";
        this.resetViewPoint.style.cursor = "pointer";
    }

    disableToogleMaskButton() {
        this.toogleMaskButton.disabled = true;
        this.toogleMaskButton.style.color = "gray";
        this.toogleMaskButton.style.cursor = "not-allowed";
    }

    reEnableToogleMaskButton() {
        this.toogleMaskButton.disabled = false;
        this.toogleMaskButton.style.color = "black";
        this.toogleMaskButton.style.cursor = "pointer";
    }

    enablePrevImageButton() {
        this.prevImageButton.addEventListener("click", () => {
            const core = new Core();
            core.saveData();

            const dataset = new Dataset();
            if (dataset.currentDataIdx > 0) {
                core.setCurrentDataByIdx(dataset.currentDataIdx - 1);
            }
        });

        const labelView = new LabelView();
        const searchInput = labelView.searchInput;
        const addCategoryInput = labelView.addCategoryInput;

        document.addEventListener("keydown", (event) => {
            if (
                searchInput !== document.activeElement &&
                addCategoryInput !== document.activeElement
            ) {
                const inputKey = event.key.toLowerCase();
                if (inputKey === "a") {
                    this.prevImageButton.click();
                }
            }
        });
    }

    enableNextImageButton() {
        this.nextImageButton.addEventListener("click", () => {
            const core = new Core();
            core.saveData();

            const dataset = new Dataset();
            if (dataset.currentDataIdx < dataset.totalImages - 1) {
                core.setCurrentDataByIdx(dataset.currentDataIdx + 1);
            }
        });

        const labelView = new LabelView();
        const searchInput = labelView.searchInput;
        const addCategoryInput = labelView.addCategoryInput;

        document.addEventListener("keydown", (event) => {
            if (
                searchInput !== document.activeElement &&
                addCategoryInput !== document.activeElement
            ) {
                const inputKey = event.key.toLowerCase();
                if (inputKey === "d") {
                    this.nextImageButton.click();
                }
            }
        });
    }

    enableResetViewPointButton() {
        this.resetViewPoint.addEventListener("click", () => {
            const canvas = new Canvas(null);
            canvas.resetViewpoint();
        });

        const labelView = new LabelView();
        const searchInput = labelView.searchInput;
        const addCategoryInput = labelView.addCategoryInput;

        document.addEventListener("keydown", (event) => {
            if (
                searchInput !== document.activeElement &&
                addCategoryInput !== document.activeElement
            ) {
                if (event.key.toLowerCase() === "w") {
                    this.resetViewPoint.click();
                }
            }
        });
    }

    enableToogleMaskButton() {
        this.toogleMaskButton.addEventListener("click", () => {
            const canvas = new Canvas(null);
            const isShowMask = canvas.isShowingMask();
            if (isShowMask) {
                canvas.setShowMask(false);
                this.toogleMaskButton.textContent = "Show Mask (S)";
            } else {
                canvas.setShowMask(true);
                this.toogleMaskButton.textContent = "Hide Mask (S)";
            }
        });

        document.addEventListener("keydown", (event) => {
            const labelView = new LabelView();
            const searchInput = labelView.searchInput;
            const addCategoryInput = labelView.addCategoryInput;

            if (
                searchInput !== document.activeElement &&
                addCategoryInput !== document.activeElement
            ) {
                if (event.key.toLowerCase() === "s") {
                    this.toogleMaskButton.click();
                }
            }
        });
    }
}
