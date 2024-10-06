class LabelConfig {
    static DEFAULT_MIN_AREA_PRECENTAGE = 0.001;
    static DEFAULT_MAX_IOU = 0.5;
    static DEFAULT_MIN_CONFIDENCE = 0.5;

    constructor() {
        if (LabelConfig.instance) {
            return LabelConfig.instance;
        }

        LabelConfig.instance = this;
        this.minArea = LabelConfig.DEFAULT_MIN_AREA_PRECENTAGE;
        this.maxIOU = LabelConfig.DEFAULT_MAX_IOU;
        this.minConfidence = LabelConfig.DEFAULT_MIN_CONFIDENCE;
        return this;
    }

    setMinArea(minArea) {
        this.minArea = minArea;
    }

    setMaxIOU(maxIOU) {
        this.maxIOU = maxIOU;
    }

    setMinConfidence(minConfidence) {
        this.minConfidence = minConfidence;
    }

    getMinArea() {
        return this.minArea;
    }

    getMaxIOU() {
        return this.maxIOU;
    }

    getMinConfidence() {
        return this.minConfidence;
    }

    exportJson() {
        return {
            minArea: this.minArea,
            maxIOU: this.maxIOU,
            minConfidence: this.minConfidence,
        };
    }

    importJson(json) {
        this.minArea = json.minArea;
        this.maxIOU = json.maxIOU;
        this.minConfidence = json.minConfidence;
    }
}
