class TopNavigationBar {
    constructor() {
        if (TopNavigationBar.instance instanceof TopNavigationBar) {
            return TopNavigationBar.instance;
        }

        TopNavigationBar.instance = this;

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
        this.labelButton.addEventListener("click", () => {
            this.showPage("annotationPage");
            this.clearActiveState();
            this.labelButton.classList.add("active");
        });
        this.statisticButton.addEventListener("click", () => {
            this.showPage("statisticPage");
            this.clearActiveState();
            this.statisticButton.classList.add("active");
        });

        this.settingButton.addEventListener("click", () => {
            this.showPage("settingPage");
            this.clearActiveState();
            this.settingButton.classList.add("active");
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

    showPage(pageId) {
        const pages = document.querySelectorAll(".page");
        pages.forEach((page) => {
            page.classList.remove("active-page");
        });

        const page = document.getElementById(pageId);
        page.classList.add("active-page");
    }

    enableLoadProjectButton() {
        this.loadProjectButton.addEventListener("click", () => {
            const core = new Core();
            core.loadProject();
        });
    }

    enableExportCOCOButton() {
        this.exportCOCOButton.addEventListener("click", () => {
            console.error("Not implemented yet");
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
}
