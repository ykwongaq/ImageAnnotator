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
                statisticReport.getImageArea()
            );
            boxes.push(labelCountBox);
        }

        this.showStatisticBoxes(boxes);
    }

    createLabelCountBox(labelId, labelName, coveredArea, totalArea) {
        const labelCountBox = this.template.content.cloneNode(true);
        let percentage = 0;
        if (totalArea !== 0) {
            percentage = Math.floor((coveredArea / totalArea) * 100);
        }
        const labelInfo = this.getInfoDiv(labelCountBox);
        labelInfo.innerHTML = `${labelId}. ${labelName}: Coverage (${percentage}%)`;

        const progressBar = this.getProgressBar(labelCountBox);
        progressBar.style.width = `${percentage}%`;

        return labelCountBox;
    }

    createMaskProcessBox(statisticReport) {
        const maskProgressBox = this.template.content.cloneNode(true);
        const imageArea = statisticReport.getImageArea();
        const totalCoralArea = statisticReport.getTotalCoralArea();

        let areaPercentage = 0;
        if (imageArea !== 0) {
            areaPercentage = Math.floor((totalCoralArea / imageArea) * 100);
        }
        const maskInfo = this.getInfoDiv(maskProgressBox);
        maskInfo.innerHTML = `All Coral Coverage: (${areaPercentage}%)`;

        const progressBar = this.getProgressBar(maskProgressBox);
        progressBar.style.width = `${areaPercentage}%`;

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

        this.imageArea = 0;
        this.totalCoralArea = 0;
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
        this.imageArea = 0;
        this.totalCoralArea = 0;
        this.areaDict = {};
        for (const label_id in LabelManager.labels) {
            this.areaDict[label_id] = 0;
        }
    }

    updateStatistic() {
        if (this.data == null) {
            console.log("No data to update statistic");
            return;
        }
        this.resetData();

        this.imageArea = this.data.getImageHeight() * this.data.getImageWidth();
        this.totalCoralArea = 0;

        for (const mask of this.data.getMasks()) {
            if (!mask.getShouldDisplay()) {
                continue;
            }
            this.totalCoralArea += mask.getArea();
            const label_id = mask.getCategoryId();
            if (label_id === null) {
                // this.unfinishedMaskCount += 1;
            } else {
                // this.finishedMaskCount += 1;
                this.areaDict[label_id] += mask.getArea();
            }
        }
    }

    getAreaById(label_id) {
        return this.areaDict[label_id];
    }

    getAreaDict() {
        return this.areaDict;
    }

    getImageArea() {
        return this.imageArea;
    }

    getTotalCoralArea() {
        return this.totalCoralArea;
    }
}
