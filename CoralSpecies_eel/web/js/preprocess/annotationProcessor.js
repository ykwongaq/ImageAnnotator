class AnnotationProcesser {
    constructor() {}

    generateEmbedding(data_url, imageFile) {
        console.log("Generating embedding for", imageFile);
        eel.generate_embedding(data_url, imageFile)(this.response);
    }

    process(data_url, imageFile) {
        console.log("Processing", imageFile);
        eel.process(data_url, imageFile)(this.response);
    }

    response(result) {
        console.log(result);
    }
}
