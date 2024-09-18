class DropArea {
    constructor(dropArea) {
        this.dropArea = dropArea;
        this.selectLink = this.dropArea.querySelector("#select-link");
        this.fileInput = this.dropArea.querySelector("#file-input");
    }

    enable() {
        this.enableDropArea();
        this.enableSelectLink();
    }

    getFileInput() {
        return this.fileInput;
    }

    enableDropArea() {
        this.dropArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            this.dropArea.style.borderColor = "#000";
        });

        this.dropArea.addEventListener("dragleave", (e) => {
            e.preventDefault();
            this.dropArea.style.borderColor = "#ccc";
        });

        this.dropArea.addEventListener(
            "drop",
            (e) => this.handleDrop(e),
            false
        );
    }

    enableSelectLink() {
        this.selectLink.addEventListener("click", () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener("change", (e) => {
            this.handleClick(e);
        });
    }

    handleDrop(e) {
        console.error("Not implemented");
    }

    handleClick(e) {
        console.error("Not implemented");
    }
}