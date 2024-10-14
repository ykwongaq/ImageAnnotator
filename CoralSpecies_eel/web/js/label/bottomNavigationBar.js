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
