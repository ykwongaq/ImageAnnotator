class AnnotationProcesser {
    constructor() {}

    generateEmbedding(data_url, imageFile) {
        console.log("Generating embedding for", imageFile);
        eel.generate_embedding(data_url, imageFile)(this.response);
    }

    process(data_url, imageFile, projectPath, callBack = null) {
        console.log("Processing", imageFile);
        const topNav = new PreprocessTopNavigationBar();
        topNav.showLoadingIcon();
        eel.preprocess(
            data_url,
            imageFile,
            projectPath
        )((result) => {
            if (callBack) {
                callBack(result);
            }
        });
    }

    checkProjectPath(projectPath) {
        console.log("Checking project path", projectPath);
        eel.check_project_path(projectPath)(this.response);
    }

    response(result) {
        console.log(result);
    }
}
