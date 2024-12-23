class Core {
    constructor() {
        if (Core.instance instanceof Core) {
            return Core.instance;
        }

        Core.instance = this;

        this.currentIdx = 0;
        this.label = -1;

        return this;
    }

    getLastWorkingIdx(callbackFunc) {
        eel.get_last_working_idx()((idx) => {
            this.currentIdx = idx;
            callbackFunc(idx);
        });
    }

    getData(idx, callbackFunc) {
        eel.get_data(idx)(callbackFunc);
    }

    getLabel() {
        return this.label;
    }

    setLabel(label) {
        this.label = label;
    }

    getCurrentIdx() {
        return this.currentIdx;
    }

    setCurrentIdx(idx) {
        this.currentIdx = idx;
    }

    nextData(callbackFunc = null) {
        this.saveCurrentData(() => {
            const currentIdx = this.getCurrentIdx();
            this.getData(currentIdx + 1, (data) => {
                if (data) {
                    const image_label = data["image_label"];
                    const image_index = data["image_index"];
                    const mainPage = new MainPage();
                    mainPage.displayData(data);

                    this.setCurrentIdx(image_index);
                    this.setLabel(image_label);
                }
                if (callbackFunc) {
                    callbackFunc();
                }
            });
        });
    }

    prevData(callbackFunc = null) {
        this.saveCurrentData(() => {
            const currentIdx = this.getCurrentIdx();
            this.getData(currentIdx - 1, (data) => {
                if (data) {
                    const image_label = data["image_label"];
                    const image_index = data["image_index"];
                    const mainPage = new MainPage();
                    mainPage.displayData(data);

                    this.setCurrentIdx(image_index);
                    this.setLabel(image_label);
                }
                if (callbackFunc) {
                    callbackFunc();
                }
            });
        });
    }

    jumpToData(idx, callbackFunc = null) {
        this.saveCurrentData(() => {
            this.getData(idx, (data) => {
                if (data) {
                    const image_label = data["image_label"];
                    const image_index = data["image_index"];
                    const mainPage = new MainPage();
                    mainPage.displayData(data);

                    this.setCurrentIdx(image_index);
                    this.setLabel(image_label);
                }
                if (callbackFunc) {
                    callbackFunc();
                }
            });
        });
    }

    saveCurrentData(callbackFunc = null) {
        eel.save_current_data(this.currentIdx, this.label)(callbackFunc);
    }
}
