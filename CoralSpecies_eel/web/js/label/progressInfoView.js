class ProgressInfoView {
    constructor() {
        if (ProgressInfoView.instance instanceof ProgressInfoView) {
            return ProgressInfoView.instance;
        }

        ProgressInfoView.instance = this;
        this.progressInfo = document.getElementById("progress-info");
        this.progressBar = document.getElementById("progress-bar");

        return this;
    }

    setProgressInfo(imageName, currentIndex, totalIndex) {
        this.progressInfo.innerText = `${imageName} (${currentIndex}/${totalIndex})`;
    }

    setProgressBar(currentIndex, totalIndex) {
        this.progressBar.style.width = `${(currentIndex / totalIndex) * 100}%`;
    }
}
