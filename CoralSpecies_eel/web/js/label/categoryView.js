class CategoryView {
    constructor(categoryView, deleteContextMenu) {
        this.categoryView = categoryView;
        this.searchInput = this.categoryView.querySelector(
            "#category-search-input"
        );
        this.buttonContainer = this.categoryView.querySelector(
            "#category-button-container"
        );
        this.addCategoryInput = this.categoryView.querySelector(
            "#add-category-input"
        );
        this.addCategoryButton = this.categoryView.querySelector(
            "#add-category-button"
        );
        this.deleteContextMenu = deleteContextMenu;
        this.deleteAction =
            this.deleteContextMenu.querySelector("#delete-action");
        this.selectedDeleteId = null;
    }

    getSearchInputDom() {
        return this.searchInput;
    }

    getAddCategoryInputDom() {
        return this.addCategoryInput;
    }

    enable() {
        this.updateButtons();
        this.enableSearch();
        this.enableAddCategory();
        this.enableDeleteAction();
        this.enableButtonContainerWheel();
    }

    enableButtonContainerWheel() {
        this.buttonContainer.addEventListener("wheel", (event) => {
            event.preventDefault();
            this.buttonContainer.scrollLeft += event.deltaY;
        });
    }

    enableDeleteAction() {
        this.deleteAction.addEventListener("click", () => {
            LabelManager.removeLabel(this.selectedDeleteId);
            this.updateButtons();
            this.deleteContextMenu.style.display = "none";
        });
    }

    enableSearch() {
        this.searchInput.addEventListener("keyup", () => {
            const searchValue = this.searchInput.value.toLowerCase();
            const buttons =
                this.buttonContainer.getElementsByClassName("button-2");

            for (const button of buttons) {
                const buttonValue = button.textContent.toLowerCase();
                if (buttonValue.includes(searchValue)) {
                    button.classList.remove("not_target");
                } else {
                    button.classList.add("not_target");
                }
            }
        });
    }

    enableAddCategory() {
        this.addCategoryButton.addEventListener("click", () => {
            const labelName = this.addCategoryInput.value;
            LabelManager.addLabel(labelName);
            this.updateButtons();
            this.addCategoryInput.value = "";
        });

        this.addCategoryInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                this.addCategoryButton.click();
            }
        });
    }

    updateButtons() {
        this.buttonContainer.innerHTML = "";
        for (const labelId in LabelManager.labels) {
            const labelName = LabelManager.labels[labelId];

            const button = document.createElement("button");
            button.innerHTML = labelName;
            button.classList.add("button-2");
            button.onclick = () => {
                if (Annotator.getCurrentMode() === Annotator.LABEL_MASK) {
                    this.markLabel(labelId, labelName);
                    const canvas = new Canvas(null);
                    canvas.updateMasks();
                } else if (Annotator.getCurrentMode() === Annotator.ADD_MASK) {
                    this.setEdittingLabel(labelId, labelName, button);
                }
            };

            const color = LabelManager.getColorById(labelId);
            button.style.borderColor = color;

            button.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                this.deleteContextMenu.style.display = "block";
                this.deleteContextMenu.style.left = event.pageX + "px";
                this.deleteContextMenu.style.top = event.pageY + "px";
                this.selectedDeleteId = labelId;
            });

            this.buttonContainer.appendChild(button);
        }

        const statisticReport = new StatisticReport();
        statisticReport.updateStatistic();
        const statisticBoxManager = new StatisticBoxManager();
        statisticBoxManager.updateStatistic(statisticReport);
    }

    markLabel(categoryId, categoryName) {
        const selectedMasks = Annotator.getSelectedMasks();
        for (const mask of selectedMasks) {
            mask.setCategoryId(categoryId);
            mask.setCategoryName(categoryName);
        }
        Annotator.clearSelection();

        const statisticReport = new StatisticReport();
        statisticReport.updateStatistic();
        const statisticBoxManager = new StatisticBoxManager();
        statisticBoxManager.updateStatistic(statisticReport);
    }

    setEdittingLabel(labelId, labelName, button) {
        this.removeSelectedColor();

        // For the button with labelId, add the selected-as-add-mask class
        button.classList.add("selected-as-add-mask");

        const label = new Label(labelId, labelName);
        const canvas = new Canvas(null);
        canvas.setEdittingLabel(label);
    }

    removeSelectedColor() {
        // Get all the buttons
        const buttons = this.buttonContainer.getElementsByClassName("button-2");

        // Remove the selected-as-add-mask class from all the button if it exists
        for (const button of buttons) {
            button.classList.remove("selected-as-add-mask");
        }
    }
}
