class AnnotationProcesser {
    constructor() {}

    generateEmbedding(data_url, imageFile) {
        console.log("Generating embedding for", imageFile);
        eel.generate_embedding(data_url, imageFile)(this.response);
    }

    process(data_url, imageFile, callBack = null) {
        console.log("Processing", imageFile);
        const loadingIconManager = new LoadingIconManager();
        loadingIconManager.showLoadingIcon();
        eel.preprocess(
            data_url,
            imageFile
        )((result) => {
            loadingIconManager.hideLoadingIcon();
            if (callBack) {
                callBack(result);
            }
        });
    }

    response(result) {
        console.log(result);
    }
}
