class LabelPage {
    constructor() {
        this.dataset = new Dataset();
        this.topNavigationBar = new TopNavigationBar();
        this.bottomNavigationBar = new BottomNavigationBar();
        this.modeView = new ModeView();
        this.canvas = new Canvas();
        this.opacityView = new OpacityView();
    }

    enable() {
        this.topNavigationBar.enable();
        this.modeView.enable();
        this.opacityView.enable();
    }
}

function main() {
    const labelPage = new LabelPage();
    labelPage.enable();

    document.addEventListener("DOMContentLoaded", () => {
        labelPage.topNavigationBar.showPage("annotationPage");
    });
}

main();
