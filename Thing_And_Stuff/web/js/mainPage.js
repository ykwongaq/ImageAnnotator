class MainPage {
    constructor() {
        if (MainPage.instance instanceof MainPage) {
            return MainPage.instance;
        }

        MainPage.instance = this;

        this.mainPage = document.getElementById("main-page");

        this.info = document.getElementById("info");
        this.image = document.getElementById("image");

        this.thingButton = document.getElementById("thing-button");
        this.stuffButton = document.getElementById("stuff-button");

        this.enable();

        return this;
    }

    enable() {
        this.enableThingButton();
        this.enableStuffButton();
    }

    enableThingButton() {
        this.thingButton.addEventListener("click", () => {
            const core = new Core();
            core.setLabel(parseInt(this.thingButton.value));
            this.clearLabels();
            this.selectThing();
        });

        document.addEventListener("keydown", (event) => {
            const key = event.key.toLowerCase();
            if (key === "j") {
                this.thingButton.click();
            }
        });
    }

    enableStuffButton() {
        this.stuffButton.addEventListener("click", () => {
            const core = new Core();
            core.setLabel(parseInt(this.stuffButton.value));
            this.clearLabels();
            this.selectStuff();
        });

        document.addEventListener("keydown", (event) => {
            const key = event.key.toLowerCase();
            if (key === "l") {
                this.stuffButton.click();
            }
        });
    }

    displayData(data) {
        const image_path = data["image_path"];
        const image_label = data["image_label"];
        const image_index = data["image_index"];
        const image_filename = data["image_filename"];
        const total_images = data["total_images"];

        this.image.src = image_path;
        this.info.innerHTML = `${image_filename} (${image_index}/${
            total_images - 1
        })`;
        this.clearLabels();
        if (image_label === 0) {
            this.selectThing();
        } else if (image_label === 1) {
            this.selectStuff();
        }
    }

    clearLabels() {
        this.thingButton.classList.remove("selected");
        this.stuffButton.classList.remove("selected");
    }

    selectThing() {
        this.thingButton.classList.add("selected");
    }

    selectStuff() {
        this.stuffButton.classList.add("selected");
    }
}
