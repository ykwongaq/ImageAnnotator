class LoadingIconManager {
    constructor() {
        if (LoadingIconManager.instance) {
            return LoadingIconManager.instance;
        }
        LoadingIconManager.instance = this;
        this.loadingIcon = document.getElementById("loading-pop");
        this.loadindPercentage = document.getElementById("loading-percentage");
        this.loadingLargeText = document.getElementById("loading-pop-text");
        this.quitButton = document.getElementById("loading-pop-quit");
        this.fn = null;

        this.launchCount = 0;

        return this;
    }

    updateButtonFn(__fn) {
        if (__fn && this.quitButton) {
            this.quitButton.addEventListener("click", (event) => {
                event.preventDefault();
                __fn();
            });
        }
    }

    updateLargeText(__text) {
        this.loadingLargeText.textContent = __text;
    }

    updatePercentage(__text) {
        this.loadindPercentage.textContent = `${__text}%`;
    }

    showLoadingIcon(__cont) {
        if (this.loadingIcon) {
            this.launchCount++;
            this.loadingIcon.classList.add("active");
        }

        if (__cont == true) {
            this.loadingIcon.classList.add("is-count");
        } else {
            this.loadingIcon.classList.remove("is-count");
        }
    }

    hideLoadingIcon(__force) {
      
        if (this.loadingIcon) {
            this.launchCount--;

            if (__force) {
                this.launchCount = 0;
                console.log(this.launchCount, `this.launchCount`);
            } 
            if (this.launchCount <= 0) {
                this.launchCount = 0;
                console.log(this.loadingIcon.classList, `this.loadingIcon.classList`);
                this.loadingIcon.classList.remove("active");
            }
        }
    }
}
