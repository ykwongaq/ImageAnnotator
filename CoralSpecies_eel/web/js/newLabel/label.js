class LabelManager {
    constructor() {}

    static selectedColor = "#0000FF"; // blue
    static removeColor = "#00FF00"; // green
    static defaultColor = "#FF0000"; // red

    static bleachedBorderColor = "#FFFFFF"; // white
    static deadBorderColor = "#000000"; // black

    static deadCoralIdxes = new Set();
    static healthyCoralIdxes = new Set();
    static bleachCoralIdxees = new Set();

    static labels = {};

    static colorList = [
        "#000000",
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

    static getBorderColor(id) {
        if (this.isBleachCoral(id)) {
            return this.bleachedBorderColor;
        } else if (this.isDeadCoral(id)) {
            return this.deadBorderColor;
        } else if (this.isHealthyCoral(id)) {
            return this.getColorById(id);
        } else {
            console.error("Invalid label id: ", id);
            return null;
        }
    }

    static loadLabels(labels) {
        // Check that the input label dictionary have continuous keys starting from 0
        const keys = labels.keys();
        const keysArray = Array.from(keys);
        const sortedKeys = keysArray.sort((a, b) => a - b);
        for (let i = 0; i < sortedKeys.length; i++) {
            if (sortedKeys[i] !== i) {
                alert("Invalid label dictionary");
                return;
            }
        }

        // Ensure that the first label is the Dead Coral label
        if (labels[0] !== "Dead Coral") {
            alert("The first label must be Dead Coral");
            return;
        }

        // Ensure that the remaining labels have even so that they can be distributed evenly
        if ((Object.keys(labels).length - 1) % 2 !== 0) {
            alert("The number of labels must be even");
            return;
        }

        // The first half of the labels (except dead coral) should be healthy coral
        // The second half of the labels should be bleached coral.
        const healthyCoralLength = (Object.keys(labels).length - 1) / 2;

        // Ensure that the all the healthy coral have the corresponding bleached coral
        for (let i = 1; i <= healthyCoralLength; i++) {
            const coralName = labels[i];
            const bleachedCoralName = labels[i + healthyCoralLength];

            if (
                coralName !==
                LabelManager.coralNameToBleachedCoralName(coralName)
            ) {
                alert(
                    `The bleached coral name for ${coralName} should be ${LabelManager.coralNameToBleachedCoralName(
                        coralName
                    )}`
                );
                return;
            }
        }

        this.deadCoralIdxes = new Set();
        this.deadCoralIdxes.add(0);

        this.healthyCoralIdxes = new Set();
        for (let i = 1; i <= healthyCoralLength; i++) {
            this.healthyCoralIdxes.add(i);
        }

        this.bleachCoralIdxees = new Set();
        for (let i = 1; i <= healthyCoralLength; i++) {
            this.bleachCoralIdxees.add(i + healthyCoralLength);
        }

        LabelManager.labels = labels;
    }

    static coralNameToBleachedCoralName(coralName) {
        return `Bleached ${coralName}`;
    }

    static bleachedCoralNameToCoralName(bleachedCoralName) {
        return bleachedCoralName.replace("Bleached ", "");
    }

    static addLabel(newLabelName) {
        // Ensure that the label name is not empty
        if (newLabelName === "") {
            return;
        }

        // Ensure that the label name does not start with "Bleached "
        if (newLabelName.startsWith("Bleached ")) {
            alert("Label name cannot start with 'Bleached '");
            return;
        }

        // If the label name already exists, return
        for (const key in this.labels) {
            if (this.labels[key] === newLabelName) {
                return;
            }
        }

        // When adding a new label
        // 1. Genreate the new label id, which should be the largest healthy coral id + 1
        // 2. Recalculate the bleached coral id
        // 3. Add corresponding bleached coral id and name
        // 4. Update the labels dictionary and set
        const oldLabelsCopy = { ...this.labels };
        const newLables = {};
        newLables[0] = "Dead Coral";

        let newLabelId = 1;
        for (const key in oldLabelsCopy) {
            if (this.healthyCoralIdxes.has(parseInt(key))) {
                newLables[newLabelId] = oldLabelsCopy[key];
                newLabelId++;
            }
        }
        newLables[newLabelId] = newLabelName;

        this.healthyCoralIdxes = new Set();
        for (let i = 1; i <= newLabelId; i++) {
            this.healthyCoralIdxes.add(i);
        }

        const healthyCoralLength = newLabelId;

        this.bleachCoralIdxees = new Set();
        for (let i = 1; i <= healthyCoralLength; i++) {
            this.bleachCoralIdxees.add(i + healthyCoralLength);
        }
        for (let i = 1; i <= healthyCoralLength; i++) {
            newLables[i + healthyCoralLength] =
                this.coralNameToBleachedCoralName(newLables[i]);
        }

        LabelManager.labels = newLables;
        console.log("new labels: ", LabelManager.labels);

        //TODO: Update dataset annotation
    }

    static setToSortedList(inputSet) {
        const numberArray = Array.from(inputSet);
        return numberArray.sort((a, b) => a - b);
    }

    static isDeadCoral(labelId) {
        return this.deadCoralIdxes.has(labelId);
    }

    static isHealthyCoral(labelId) {
        return this.healthyCoralIdxes.has(labelId);
    }

    static isBleachCoral(labelId) {
        return this.bleachCoralIdxees.has(labelId);
    }

    static getDeadCoralIdxes() {
        return LabelManager.setToSortedList(LabelManager.deadCoralIdxes);
    }

    static getHealthyCoralIdxes() {
        // return LabelManager.healthyCoralIdxes;
        return LabelManager.setToSortedList(LabelManager.healthyCoralIdxes);
    }

    static getBleachedCoralIdxes() {
        // return LabelManager.bleachCoralIdxees;
        return LabelManager.setToSortedList(LabelManager.bleachCoralIdxees);
    }

    static removeLabel(labelId, callback = null) {
        // First check if the labelId exists in current image
        console.log("rmeove label: ", labelId);
        const dataset = new Dataset();
        const data = dataset.getCurrentData();
        for (const mask of data.getMasks()) {
            console.log("mask category id: ", mask.getCategoryId());
            if (mask.getCategoryId() === labelId) {
                alert(
                    `Cannot remove label ${labelId} because it is used in current image`
                );
                return;
            }
        }

        const currentImageIdx = dataset.getCurrentDataIdx();

        // Check if other image contain this label
        eel.have_mask_belong_to_category(labelId)((result) => {
            const has_mask = result["has_mask_belong_to_category"];
            console.log(result);
            if (has_mask) {
                const image_idx = result["image_idx"];
                alert(
                    `Cannot remove label ${labelId} because it is used in image ${
                        image_idx + 1
                    }`
                );
                return;
            }
            delete this.labels[labelId];

            if (callback !== null) {
                callback();
            }
        });
    }

    static getLabels() {
        return LabelManager.labels;
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
