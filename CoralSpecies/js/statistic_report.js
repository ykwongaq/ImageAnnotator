class StatisticReport {
    constructor() {
        this.image = null;

        this.totalMaskCount = 0;
        this.finishedMaskCount = 0;
        this.unfinishedMaskCount = 0;

        this.labelCounts = {};
        for (const label_id in Label.labels) {
            this.labelCounts[label_id] = 0;
        }
    }

    setImage(image) {
        this.image = image;
        this.updateStatistic();
    }

    resetData() {
        this.totalMaskCount = 0;
        this.finishedMaskCount = 0;
        this.unfinishedMaskCount = 0;
        this.labelCounts = {};
        for (const label_id in Label.labels) {
            this.labelCounts[label_id] = 0;
        }
    }

    updateStatistic() {
        this.resetData();

        this.totalMaskCount = this.image.get_masks_count();
        for (const mask of this.image.get_masks()) {
            const label_id = mask.get_label_id();
            if (label_id === null) {
                this.unfinishedMaskCount += 1;
            } else {
                this.finishedMaskCount += 1;
                this.labelCounts[label_id] += 1;
            }
        }
    }

    getTotalMaskCount() {
        return this.totalMaskCount;
    }

    getFinishedMaskCount() {
        return this.finishedMaskCount;
    }

    getUnfinishedMaskCount() {
        return this.unfinishedMaskCount;
    }

    getLabelCount(label_id) {
        return this.labelCounts[label_id];
    }

    getLabelCounts() {
        return this.labelCounts;
    }
}
