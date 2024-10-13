class preprocessTutorialPage {
    constructor() {
        if (preprocessTutorialPage.instance instanceof preprocessTutorialPage) {
            return preprocessTutorialPage.instance;
        }

        preprocessTutorialPage.instance = this;
        
        this.preprocessTutorial = document.getElementById("preprocessTutorialPage");
        this.content = document.getElementById("preprocess-tutorial-body");
        this.toc = document.getElementById("preprocess-tutorial-toc");
        
        
        return this;
    }

    load() {
        this.loadPreprocessTutorial();
    }

    loadPreprocessTutorial() {
        eel.get_tutorial("./web/markdown/preprocess.md")(async (markdownFile) => {
            var data = marked.parse(markdownFile);
            this.content.innerHTML = data;

        });
    }

}

function main() {
    const preprocessTutorial = new preprocessTutorialPage();
    preprocessTutorial.loadPreprocessTutorial();
}

main();
