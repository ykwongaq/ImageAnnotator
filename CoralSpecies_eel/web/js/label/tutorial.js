class LabelTutorialPage {
    constructor() {
        if (LabelTutorialPage.instance instanceof LabelTutorialPage) {
            return LabelTutorialPage.instance;
        }

        LabelTutorialPage.instance = this;
        
        this.labelTutorial = document.getElementById("labelTutorialPage");
        this.content = document.getElementById("label-tutorial-body");
        this.toc = document.getElementById("label-tutorial-toc");
        
        
        return this;
    }

    load() {
        this.loadLabelTutorial();
    }

    loadLabelTutorial() {
        eel.get_tutorial("./web/markdown/label.md")(async (markdownFile) => {
            var data = marked.parse(markdownFile);
            this.content.innerHTML = data;

            // image url
            // const images = this.content.querySelectorAll('img');
            // for (var i = 0; i < images.length; i++) {
            //     var imgPath = images[i].src.replace('http://localhost:8000','.');
            //     var imgBase = await eel.get_screenshot(imgPath)();
            //     console.log(imgBase);
            //     images[i].src = imgBase;
            // }

            // markdown toc
            // var tokens = marked.lexer(markdownFile);
            // var headings = tokens.filter(token => token.type === 'heading')
            // this.toc.innerHTML = headings;
            // console.log(headings);
        });
    }

}

function main() {
    const labelTutorial = new LabelTutorialPage();
    labelTutorial.loadLabelTutorial()
}

main();
