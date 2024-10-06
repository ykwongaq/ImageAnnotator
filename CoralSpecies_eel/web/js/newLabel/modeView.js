class Annotator {
    static LABEL_MASK = 0;
    static ADD_MASK = 1;
    static DELETE_MASK = 2;

    static currentMode = Annotator.LABEL_MASK;

    static selectedMasks = [];

    static selectMask(mask) {
        mask.setColor(LabelManager.selectedColor);
        this.selectedMasks.push(mask);
        const canvas = new Canvas(null);
        canvas.updateMasks();
    }

    static setMode(mode) {
        Annotator.currentMode = mode;
    }

    static getCurrentMode() {
        return Annotator.currentMode;
    }

    static deselectMask(mask) {
        const color = LabelManager.getColorById(mask.getCategoryId());
        mask.setColor(color);
        this.selectedMasks = this.selectedMasks.filter((m) => m !== mask);
        const canvas = new Canvas(null);
        canvas.updateMasks();
    }

    static clearSelection() {
        for (const mask of this.selectedMasks) {
            const color = LabelManager.getColorById(mask.getCategoryId());
            mask.setColor(color);
        }
        this.selectedMasks = [];

        const canvas = new Canvas();
        canvas.updateMasks();
    }

    static getSelectedMasks() {
        return this.selectedMasks;
    }

    static isMaskSelected(mask) {
        return this.selectedMasks.includes(mask);
    }
}

class ModeView {
    constructor() {
        this.modeRadios = document.querySelectorAll("input[name='editMode']");
        this.undoButton = document.getElementById("undo-button");
        this.resetButton = document.getElementById("reset-button");
        this.confirmButton = document.getElementById("confirm-button");
    }

    enable() {
        this.enableRadioButtons();
        this.enableUndoButton();
        this.enableConfirmButton();
        this.enableResetButton();
    }

    enableRadioButtons() {
        this.modeRadios.forEach((radio) => {
            radio.addEventListener("change", (event) => {
                const mode = parseInt(event.target.value);
                Annotator.setMode(mode);
                Annotator.clearSelection();
                this.clearEdittedMask();
                this.hideActionButtons();
                if (mode == Annotator.ADD_MASK) {
                    this.showActionButtons();
                } else if (mode == Annotator.DELETE_MASK) {
                    this.showConfirmButton();
                }
            });
        });
    }

    enableUndoButton() {
        this.undoButton.addEventListener("click", () => {
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
    }

    enableConfirmButton() {
        this.confirmButton.addEventListener("click", () => {
            if (Annotator.getCurrentMode() === Annotator.ADD_MASK) {
                eel.confirm_edit_mask_input()(() => {
                    const canvas = new Canvas(null);
                    const mask = canvas.getEdittingMask();
                    mask.setColorById();
                    mask.setConfidence(1);
                    const currentData = this.dataset.getCurrentData();
                    currentData.addMask(mask);
                    canvas.updateMasks();

                    this.clearEdittedMask();

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
    }

    enableResetButton() {
        this.resetButton.addEventListener("click", () => {
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
        this.confirmButton.style.display = "block";
    }

    showActionButtons() {
        this.undoButton.style.display = "block";
        this.resetButton.style.display = "block";
        this.confirmButton.style.display = "block";
    }

    hideActionButtons() {
        this.undoButton.style.display = "none";
        this.resetButton.style.display = "none";
        this.confirmButton.style.display = "none";
    }
}
