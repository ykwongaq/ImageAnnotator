class BottomNavigationBar {
    constructor() {
        if (BottomNavigationBar.instance instanceof BottomNavigationBar) {
            return BottomNavigationBar.instance;
        }

        BottomNavigationBar.instance = this;

        this.nextButton = document.getElementById("next-button");
        this.prevButton = document.getElementById("prev-button");

        this.imageIdInput = document.getElementById("image-id-input");
        this.jumpButton = document.getElementById("jump-button");

        return this;
    }

    init() {
        this.nextButton.addEventListener("click", () => {
            this.disable();
            const core = new Core();
            core.nextData(() => {
                this.enable();
            });
        });

        this.prevButton.addEventListener("click", () => {
            this.disable();
            const core = new Core();
            core.prevData(() => {
                this.enable();
            });
        });

        this.jumpButton.addEventListener("click", () => {
            const inputValue = this.imageIdInput.value.trim();
            if (
                inputValue === "" ||
                isNaN(inputValue) ||
                !Number.isInteger(Number(inputValue))
            ) {
                return;
            }

            this.clearInput();
            this.disable();
            const core = new Core();
            core.jumpToData(parseInt(inputValue), () => {
                this.enable();
            });
        });

        // short cut
        document.addEventListener("keydown", (event) => {
            // Get the lower case of the input key
            const key = event.key.toLowerCase();

            if (key === "d") {
                this.nextButton.click();
            } else if (key === "a") {
                this.prevButton.click();
            }
        });

        this.imageIdInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                this.jumpButton.click();
            }
        });
    }

    clearInput() {
        this.imageIdInput.value = "";
    }

    disable() {
        this.nextButton.disabled = true;
        this.prevButton.disabled = true;
        this.imageIdInput.disabled = true;
        this.jumpButton.disabled = true;
    }

    enable() {
        this.nextButton.disabled = false;
        this.prevButton.disabled = false;
        this.imageIdInput.disabled = false;
        this.jumpButton.disabled = false;
    }
}
