class tutManager {
    constructor() {
        if (tutManager.instance) {
            return tutManager.instance;
        }
        tutManager.instance = this;
        this.step = 0;
        this.toShow = true;

        const toShow = localStorage.getItem('toShow');

        if(toShow == 'false') {
            this.toShow = false;
        }

        this.currentStep = 0;
        this.layer = document.querySelector('#tutorial-layer');
        this.tutPops = document.querySelectorAll('.tut-pop');
        this.skipButtons = document.querySelectorAll('.tut-pop__skip');
        this.nextButtons = document.querySelectorAll('.tut-pop__next');

       
        return this;
    }

    enables() {
        this.start();
        this.enableNextButtons();
        this.enableSkipButtons();
    }

    start() {
        if(this.toShow) {
            this.layer.classList.add('active');
            this.showStepPop();
        }

    }

    enableNextButtons() {
        this.nextButtons.forEach((button) => {
            button.addEventListener('click', (event)=>{
                event.preventDefault();
                this.currentStep++;
                if(this.currentStep == this.tutPops.length - 1) {
                    this.layer.classList.remove('active');
                    localStorage.setItem('toShow', 'false');
                } else {
                    this.showStepPop();
                }
            })
        })
    }

    enableSkipButtons() {
        this.skipButtons.forEach((button) => {
            button.addEventListener('click', (event)=>{
                event.preventDefault();
                this.layer.classList.remove('active');
                localStorage.setItem('toShow', 'false');
            })
        })
    }
    
    showStepPop() {
        this.tutPops.forEach(pop => {
            pop.classList.remove('active');
        })
        this.tutPops[this.currentStep].classList.add('active');
    }
    
}
