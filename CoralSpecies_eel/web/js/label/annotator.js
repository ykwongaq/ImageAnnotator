class Annotator {
    static LABEL_MASK = 0;
    static ADD_MASK = 1;
    static DELETE_MASK = 2;

    static currentMode = Annotator.LABEL_MASK;

    static selectedMasks = [];

    // static selectedMasksToBeDeleted = [];

    // static selectMaskToBeDeleted(mask) {
    //     mask.setColor(LabelManager.removeColor);
    //     this.selectedMasksToBeDeleted.push(mask);
    //     const canvas = new Canvas(null);
    //     canvas.updateMasks();
    // }

    // static deselectMaskToBeDeleted(mask) {
    //     const color = LabelManager.getColorById(mask.getCategoryId());
    //     mask.setColor(color);
    //     this.selectedMasksToBeDeleted = this.selectedMasksToBeDeleted.filter(
    //         (m) => m !== mask
    //     );
    //     const canvas = new Canvas(null);
    //     canvas.updateMasks();
    // }

    // static clearSelectionToBeDeleted() {
    //     for (const mask of this.selectedMasksToBeDeleted) {
    //         const color = LabelManager.getColorById(mask.getCategoryId());
    //         mask.setColor(color);
    //     }
    //     this.selectedMasksToBeDeleted = [];
    // }

    // static getSelectedMasksToBeDeleted() {
    //     return this.selectedMasksToBeDeleted;
    // }

    // static isMaskSelectedToBeDeleted(mask) {
    //     return this.selectedMasksToBeDeleted.includes(mask);
    // }

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
    }

    static getSelectedMasks() {
        return this.selectedMasks;
    }

    static isMaskSelected(mask) {
        return this.selectedMasks.includes(mask);
    }
}
