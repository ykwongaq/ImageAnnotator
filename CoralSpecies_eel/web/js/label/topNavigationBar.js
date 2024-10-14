class TopNavigationBar {
    constructor() {
        if (TopNavigationBar.instance instanceof TopNavigationBar) {
            return TopNavigationBar.instance;
        }

        TopNavigationBar.instance = this;
        this.iconContainer = document.getElementById("icon");

        this.backToMainPageButton = document.getElementById(
            "back-to-main-page-button"
        );

        this.labelButton = document.getElementById("label-button");
        this.statisticButton = document.getElementById("statistic-button");
        this.settingButton = document.getElementById("setting-button");

        this.loadProjectButton = document.getElementById("load-project-button");
        this.exportCOCOButton = document.getElementById("export-coco-button");
        this.exportExcelButton = document.getElementById("export-excel-button");
        this.exportGraphButton = document.getElementById("export-graph-button");
        this.exportAllButton = document.getElementById("export-all-button");

        this.buttons = [
            this.labelButton,
            this.statisticButton,
            this.settingButton,
        ];

        return this;
    }

    enable() {
        this.enableButtons();
        this.enableFileDropdownMenu();
        this.enableLoadProjectButton();
        this.enableExportCOCOButton();
        this.enableExportExcelButton();
        this.enableExportGraphButton();
        this.enableExportAllButton();
    }

    clearActiveState() {
        for (const button of this.buttons) {
            button.classList.remove("active");
        }
    }

    enableButtons() {
        const core = new Core();
        this.labelButton.addEventListener("click", () => {
            core.showPage("annotationPage");
            this.clearActiveState();
            this.labelButton.classList.add("active");
        });
        this.statisticButton.addEventListener("click", () => {
            core.showPage("statisticPage");
            this.clearActiveState();
            this.statisticButton.classList.add("active");
        });

        this.settingButton.addEventListener("click", () => {
            core.showPage("settingPage");
            this.clearActiveState();
            this.settingButton.classList.add("active");
        });
        this.backToMainPageButton.addEventListener("click", () => {
            core.setProjectLoaded(false);
        });
    }

    enableFileDropdownMenu() {
        const fileButton = document.getElementById("file-button");
        const dropDownMenu = document.getElementById("file-dropdown-menu");

        fileButton.addEventListener("click", () => {
            const rect = fileButton.getBoundingClientRect();
            dropDownMenu.style.display =
                dropDownMenu.style.display === "block" ? "none" : "block";
            dropDownMenu.style.left = `${rect.left + window.scrollY}px`;
            dropDownMenu.style.top = `${rect.bottom + window.scrollX}px`;
        });

        window.addEventListener("click", (event) => {
            if (!event.target.matches("#file-button")) {
                dropDownMenu.style.display = "none";
            }
        });
    }

    enableLoadProjectButton() {
        this.loadProjectButton.addEventListener("click", () => {
            const core = new Core();
            core.loadProject();
        });
    }

    enableExportCOCOButton() {
        this.exportCOCOButton.addEventListener("click", () => {
            eel.select_folder()((path) => {
                if (path) {
                    const core = new Core();
                    core.saveData(() => {
                        console.log("Exporting COCO format... to", path);
                        eel.export_json(path);
                    });
                }
            });
        });
    }

    enableExportExcelButton() {
        this.exportExcelButton.addEventListener("click", () => {
            console.error("Not implemented yet");
        });
    }

    enableExportGraphButton() {
        this.exportGraphButton.addEventListener("click", () => {
            console.error("Not implemented yet");
        });
    }

    enableExportAllButton() {
        this.exportAllButton.addEventListener("click", () => {
            console.error("Not implemented yet");
        });
    }

    showLoadingIcon() {
        const loadingDiv = document.createElement("div");
        loadingDiv.classList.add("loading-animation");

        this.iconContainer.innerHTML = "";
        this.iconContainer.appendChild(loadingDiv);
    }

    restoreIcon() {
        this.iconContainer.innerHTML = "";

        const image = document.createElement("img");
        image.src = "images/coralscan_icon.png";
        image.alt = "icon";

        this.iconContainer.appendChild(image);
    }
}
