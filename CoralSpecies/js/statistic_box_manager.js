class StatisticBoxManager {
    constructor(boxContainer, template) {
        this.boxContainer = boxContainer;
        this.template = template;
    }

    updateStatistic(statisticReport) {
        const boxes = [];

        const maskProgressBox = this.createMaskProcessBox(statisticReport);
        boxes.push(maskProgressBox);

        // labelCounts is a dictionary
        let labelCounts = statisticReport.getLabelCounts();

        // Sort the labelCounts by value
        labelCounts = Object.entries(labelCounts).sort((a, b) => b[1] - a[1]);

        for (const [labelId, labelCount] of labelCounts) {
            const labelName = Label.labels[labelId];
            const labelCountBox = this.createLabelCountBox(
                labelId,
                labelName,
                labelCount,
                statisticReport.getTotalMaskCount()
            );
            boxes.push(labelCountBox);
        }

        this.showStatisticBoxes(boxes);
    }

    createLabelCountBox(labelId, labelName, labelCount, maskCount) {
        const labelCountBox = this.template.content.cloneNode(true);
        const percentage = Math.floor((labelCount / maskCount) * 100);
        const labelInfo = this.getInfoDiv(labelCountBox);
        labelInfo.innerHTML = `${labelId}. ${labelName}: ${labelCount} / ${maskCount} (${percentage}%)`;

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
