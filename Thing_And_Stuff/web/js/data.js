class Data {
    constructor(data) {
        this.data = data;
    }

    getVideo1Path() {
        return this.data["video_1"];
    }

    getVideo2Path() {
        return this.data["video_2"];
    }

    exportJson() {
        return this.data;
    }

    getFilename() {
        return this.data["file_name"];
    }

    selectBetterVideo(video_id) {
        this.data["better_video"] = video_id;
    }

    getSelectedVideoIdx() {
        if (!("better_video" in this.data)) {
            return 0;
        }
        return this.data["better_video"];
    }
}

class Dataset {
    constructor() {
        if (Dataset.instance instanceof Dataset) {
            return Dataset.instance;
        }

        Dataset.instance = this;

        this.dataList = [];
        this.currentDataIdx = 0;

        return this;
    }

    exportJson() {
        let json = []
        for (const data of this.dataList) {
            json.push(data.exportJson());
        }
        return json;
        
    }

    getSize() {
        return this.dataList.length;
    }

    loadProject(projectData) {
        this.clearDataList();
        this.currentDataIdx = projectData["last_index"];
        for (const data of projectData["data"]) {
            this.dataList.push(new Data(data));
        }
    }

    clearDataList() {
        this.dataList = [];
    }

    setCurrentDataIdx(currentDataIdx) {
        this.currentDataIdx = currentDataIdx;
    }

    getCurrentDataIdx() {
        return this.currentDataIdx;
    }

    getCurrentData() {
        return this.dataList[this.currentDataIdx];
    }

    getData(dataIdx) {
        if (dataIdx < 0 || dataIdx >= this.dataList.length) {
            return null;
        }
        return this.dataList[dataIdx];
    }
}
