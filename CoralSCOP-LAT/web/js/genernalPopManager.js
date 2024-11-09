class GenernalPopManager {
    constructor() {
        if (GenernalPopManager.instance) {
            return GenernalPopManager.instance;
        }
        GenernalPopManager.instance = this;
        this.popup = document.getElementById('general-pop');
        this.largeText = document.getElementById('general-pop-large-text');
        this.text = document.getElementById('general-pop-text');
        this.button = document.getElementById('general-pop-button');
        this.fn = null;

        this.enableButton();

        return this;
}

    setButtonFn (__fn) {
        this.fn = __fn;
    }


    enableButton() {
        if(this.button){
            this.button.addEventListener('click', () => {
                let willHide = true
                if(this.fn) {
                    willHide = this.fn() || true;
                    this.fn = null;
                    
                }
                if(!willHide) {
                    this.popup.classList.remove('active');
                }
            })
        }
    }

    updateLargeText(__text) {
        this.largeText.textContent = __text;
    }

    updateText(__text) {
        this.text.textContent = __text;
    }

    show() {
        this.popup.classList.add('active');
    }
}

