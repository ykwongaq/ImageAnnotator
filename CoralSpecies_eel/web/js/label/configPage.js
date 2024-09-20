class ConfigurationPage {
    constructor(page, toggleButton, mainPage) {
        this.page = page;
        this.toggleButton = toggleButton;
        this.saveButton = this.page.querySelector("#save-button");

        this.minConfidenceText = this.page.querySelector(
            "#min-confidence-text"
        );
        this.minConfidenceSilder = this.page.querySelector(
            "#min-confidence-slider"
        );

        this.maxOverlapText = this.page.querySelector("#max-overlap-text");
        this.maxOverlapSlider = this.page.querySelector("#max-overlap-slider");

        this.minAreaText = this.page.querySelector("#min-area-text");
        this.minAreaSlider = this.page.querySelector("#min-area-slider");

        this.mainPage = mainPage;
        this.config = new LabelConfig();
    }

    enable() {
        this.enableToggleButton();
        this.enableDocument();
        this.enableSaveButton();
        this.enableMinConfidenceSlider();
        this.enableMaxOverlapSlider();
        this.enableMinAreaSilder();

        this.updateViesBasedOnConfig(this.config);
    }

    updateViesBasedOnConfig(config) {
        this.minConfidenceSilder.value = config.minConfidence * 100;
        this.maxOverlapSlider.value = config.maxIOU * 100;
        this.minAreaSlider.value = config.minArea * 100;

        this.minConfidenceSilder.dispatchEvent(new Event("input"));
        this.maxOverlapSlider.dispatchEvent(new Event("input"));
        this.minAreaSlider.dispatchEvent(new Event("input"));
    }

    enableDocument() {
        document.addEventListener("click", (event) => {
            // Only close the sidebar if it is left click
            if (event.button === 0) {
                if (this.page.classList.contains("active")) {
                    if (
                        !this.page.contains(event.target) &&
                        !event.target.classList.contains("toggle-button")
                    ) {
                        this.page.classList.remove("active");
                        this.toggleButton.style.right = "20px";
                    }
                }
            }
        });
    }

    enableSaveButton() {
        this.saveButton.addEventListener("click", () => {
            // Let user to confirm before saving
            const userConfigrmed = window.confirm(
                "To avoid masks confilcts, current reuslts will be removed. Are you sure you want to continue?"
            );
            if (!userConfigrmed) {
                return;
            }

            const configJson = this.config.exportJson();
            eel.update_filter_config(configJson)(() => {
                this.mainPage.reload();
            });
        });
    }

    getConfig() {
        return this.config;
    }

    enableToggleButton() {
        this.toggleButton.addEventListener("click", () => {
            const isActive = this.page.classList.toggle("active");
            this.toggleButton.style.right = isActive ? "320px" : "20px";
        });
    }

    enableMinAreaSilder() {
        this.minAreaSlider.addEventListener("input", () => {
            const value = this.minAreaSlider.value;
            const minArea = value / 100;

            this.minAreaText.innerText = `Min Area: ${value}%`;
            this.config.setMinArea(minArea);
        });
    }
    enableMinConfidenceSlider() {
        this.minConfidenceSilder.addEventListener("input", () => {
            const value = this.minConfidenceSilder.value;
            const minConfidence = value / 100;

            this.minConfidenceText.innerText = `Min Confidence: ${value}%`;
            this.config.setMinConfidence(minConfidence);
        });
    }

    enableMaxOverlapSlider() {
        this.maxOverlapSlider.addEventListener("input", () => {
            const value = this.maxOverlapSlider.value;
            const maxOverlap = value / 100;

            this.maxOverlapText.innerText = `Max Overlap: ${value}%`;
            this.config.setMaxIOU(maxOverlap);
        });
    }

    getMinConfidence() {
        return this.minConfidenceSilder.value / 100;
    }

    getMaxOverlap() {
        return this.maxOverlapSlider.value / 100;
    }

    getMinArea() {
        return this.minAreaSlider.value / 100;
    }
}
