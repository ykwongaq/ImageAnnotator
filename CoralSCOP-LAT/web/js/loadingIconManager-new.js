class LoadingIconManager {
    constructor() {
        if (LoadingIconManager.instance) {
            return LoadingIconManager.instance;
        }
        LoadingIconManager.instance = this;
        this.loadingIcon = document.getElementById('loading-pop');

        this.launchCount = 0;

        return this;
    }

    showLoadingIcon(__cont) {
        if (this.loadingIcon) {
            this.launchCount++;
            this.loadingIcon.classList.add('active');
        }

        if(__cont == true) {
            this.loadingIcon.classList.add('is-count');
        } else {
            this.loadingIcon.classList.remove('is-count');
        }
    }



    hideLoadingIcon(__force) {
        if(__force) {
            this.launchCount = 0;
        } else {
            if (this.loadingIcon) {
                this.launchCount--;
                if (this.launchCount <= 0) {
                    this.launchCount = 0;
                    this.loadingIcon.classList.remove('active');
                }
            }
        }
    }
    
}
