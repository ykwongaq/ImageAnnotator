class StatisticBoxManager {
    constructor(boxContainer, template) {
        if (StatisticBoxManager.instance) {
            return StatisticBoxManager.instance;
        }

        StatisticBoxManager.instance = this;
        this.boxContainer = boxContainer;
        this.template = template;

        return this;
    }

    updateStatistic(statisticReport) {
        const boxes = [];
        const maskProgressBox = this.createMaskProcessBox(statisticReport);
        boxes.push(maskProgressBox);

        // labelCounts is a dictionary
        let areaDict = statisticReport.getAreaDict();

        // Sort the labelCounts by value
        areaDict = Object.entries(areaDict).sort((a, b) => b[1] - a[1]);

        for (const [labelId, area] of areaDict) {
            const labelName = LabelManager.labels[labelId];
            const labelCountBox = this.createLabelCountBox(
                labelId,
                labelName,
                area,
                statisticReport.getTotalArea()
            );
            boxes.push(labelCountBox);
        }

        this.showStatisticBoxes(boxes);
    }

    createLabelCountBox(labelId, labelName, labelCount, maskCount) {
        const labelCountBox = this.template.content.cloneNode(true);
        const percentage = Math.floor((labelCount / maskCount) * 100);
        const labelInfo = this.getInfoDiv(labelCountBox);
        labelInfo.innerHTML = `${labelId}. ${labelName}: Area (${percentage}%)`;

        const progressBar = this.getProgressBar(labelCountBox);
        progressBar.style.width = `${(labelCount / maskCount) * 100}%`;

        return labelCountBox;
    }

    createMaskProcessBox(statisticReport) {
        const maskProgressBox = this.template.content.cloneNode(true);

        const totalMaskCount = statisticReport.getTotalMaskCount();
        const finishedMaskCount = statisticReport.getFinishedMaskCount();
        const precentage = Math.floor(
            (finishedMaskCount / totalMaskCount) * 100
        );

        const maskInfo = this.getInfoDiv(maskProgressBox);
        maskInfo.innerHTML = `Mask: ${finishedMaskCount} / ${totalMaskCount} (${precentage}%)`;

        const progressBar = this.getProgressBar(maskProgressBox);
        progressBar.style.width = `${precentage}%`;

        return maskProgressBox;
    }

    getInfoDiv(statisticBox) {
        return statisticBox.querySelector(".info");
    }

    getProgressBar(statisticBox) {
        return statisticBox.querySelector(".progressbar");
    }

    showStatisticBoxes(boxes) {
        this.boxContainer.innerHTML = "";

        for (const box of boxes) {
            this.boxContainer.append(box);
        }
    }
}

class StatisticReport {
    constructor() {
        if (StatisticReport.instance) {
            return StatisticReport.instance;
        }

        StatisticReport.instance = this;
        this.data = null;

        this.totalMaskCount = 0;
        this.finishedMaskCount = 0;
        this.unfinishedMaskCount = 0;

        this.totalArea = 0;
        this.areaDict = {};
        for (const label_id in LabelManager.labels) {
            this.areaDict[label_id] = 0;
        }

        return this;
    }

    setData(data) {
        this.data = data;
        this.updateStatistic();
    }

    resetData() {
        this.totalMaskCount = 0;
        this.finishedMaskCount = 0;
        this.unfinishedMaskCount = 0;
        this.totalArea = 0;
        this.areaDict = {};
        for (const label_id in LabelManager.labels) {
            this.areaDict[label_id] = 0;
        }
    }

    updateStatistic() {
        this.resetData();

        this.totalMaskCount = this.data.getMaskCount();
        this.totalArea = this.data.getImageHeight() * this.data.getImageWidth();

        for (const mask of this.data.getMasks()) {
            const label_id = mask.getCategoryId();
            if (label_id === null) {
                this.unfinishedMaskCount += 1;
            } else {
                this.finishedMaskCount += 1;
                this.areaDict[label_id] += mask.getArea();
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

    getAreaById(label_id) {
        return this.areaDict[label_id];
    }

    getAreaDict() {
        return this.areaDict;
    }

    getTotalArea() {
        return this.totalArea;
    }
}
