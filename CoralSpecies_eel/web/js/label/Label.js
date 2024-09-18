class LabelManager {
    constructor() {}

    static selectedColor = "#0000FF"; // blue
    static removeColor = "#00FF00"; // green
    static defaultColor = "#FF0000"; // red

    static labels = {
        0: "CoralA",
        1: "CoralB",
        2: "CoralC",
    };

    static colorList = [
        "#00FF00",
        "#FFFF00",
        "#FF00FF",
        "#00FFFF",
        "#800000",
        "#808000",
        "#008000",
        "#800080",
        "#008080",
        "#000080",
        "#FFA500",
        "#A52A2A",
        "#8A2BE2",
        "#DEB887",
        "#5F9EA0",
        "#7FFF00",
        "#D2691E",
        "#FF7F50",
        "#6495ED",
        "#DC143C",
        "#00FA9A",
        "#FFD700",
        "#ADFF2F",
        "#4B0082",
        "#F0E68C",
        "#E6E6FA",
        "#FFB6C1",
        "#20B2AA",
        "#DA70D6",
        "#FF6347",
    ];

    static getColorById(id) {
        if (id === null) {
            return this.defaultColor;
        }
        const colorNumber = id % this.colorList.length;
        return this.colorList[colorNumber];
    }

    static addLabel(labelName) {
        const labelId = Object.keys(this.labels).length;
        this.labels[labelId] = labelName;
    }

    static removeLabel(labelId) {
        delete this.labels[labelId];
    }
}

class Label {
    constructor(labelId, labelName) {
        if (labelId === null || labelId === undefined) {
            this.labelId = null;
        } else {
            this.labelId = parseInt(labelId);
        }

        if (labelName === null || labelName === undefined) {
            this.labelName = null;
        } else {
            this.labelName = labelName;
        }
    }

    getLabelId() {
        return this.labelId;
    }

    getLabelName() {
        return this.labelName;
    }

    setLabelId(labelId) {
        this.labelId = labelId;
    }

    setLabelName(labelName) {
        this.labelName = labelName;
    }
}
