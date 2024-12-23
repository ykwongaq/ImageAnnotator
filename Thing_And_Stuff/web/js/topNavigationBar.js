class TopNavigationBar {
    constructor() {
        if (TopNavigationBar.instance instanceof TopNavigationBar) {
            return TopNavigationBar.instance;
        }

        TopNavigationBar.instance = this;

        this.fileButton = document.getElementById("file-button");

        this.dropDownMenu = document.getElementById("file-dropdown-menu");
        this.createProjectButton = document.getElementById("create-project-button");
        this.loadProjectButton = document.getElementById("load-project-button")
        this.exportResultButton = document.getElementById("export-result-button")

        return this;
    }

    enable() {
        this.enableFileDropdownMenu();
        this.enableCreateProjectButton(); 
        this.enableLoadProjectButton();
        this.enableExportResultButton();
    }

    enableFileDropdownMenu() {
        this.fileButton.addEventListener("click", () => {
            const rect = this.fileButton.getBoundingClientRect();
            this.dropDownMenu.style.display =
            this.dropDownMenu.style.display === "block" ? "none" : "block";
            this.dropDownMenu.style.left = `${rect.left + window.scrollY}px`;
            this.dropDownMenu.style.top = `${rect.bottom + window.scrollX}px`;
        });

        window.addEventListener("click", (event) => {
            if (!event.target.matches("#file-button")) {
                this.dropDownMenu.style.display = "none";
            }
        });
    }

    enableCreateProjectButton() {
        this.createProjectButton.addEventListener("click", () => {
            eel.select_folder("Select the data folder")((dataFolder) => {
                if (dataFolder) {
                    eel.select_folder("Select the output folder")((outputFolder) => { 
                        if (outputFolder) {
                            const core = new Core();
                            core.createProject(dataFolder, outputFolder);
                        }
                    });
                }
            })
        });
    }
    enableLoadProjectButton() {
        this.loadProjectButton.addEventListener("click", () => {
            eel.select_folder(null)((path) => {
                const core = new Core();
                core.loadProject(path);
            })
        });
    }

    enableExportResultButton() {
        this.exportResultButton.addEventListener("click", () => {
            const core = new Core();
            if (!core.isProjectLoaded()) {
                alert("Please load a project first!");
                return;
            }
            eel.select_folder(null)((path) => {
                if (path) {
                    const core = new Core();
                    core.exportResult(path);
                }
            });
        });
    }
}
