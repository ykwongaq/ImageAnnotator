class Dataset {
    constructor() {}

    async initialize(folder) {
        this.data_list = [];
        this.folder = folder;

        const path = require("path");
        try {
            const image_folder = path.join(this.folder, "images");
            const processed_json_folder = path.join(
                this.folder,
                "annotations_processed"
            );
            const json_folder = path.join(this.folder, "annotations");

            const image_files = await this.list_file(image_folder);
            const processed_json_files = await this.list_file(
                processed_json_folder
            );
            const json_files = await this.list_file(json_folder);

            image_files.sort();
            processed_json_files.sort();

            for (let idx = 0; idx < image_files.length; idx++) {
                const image_path = image_files[idx];
                const processed_json_path = processed_json_files[idx];
                const json_path = json_files[idx];

                const data = new CoralImage(
                    image_path,
                    json_path,
                    processed_json_path,
                    idx
                );
                this.data_list.push(data);
            }
        } catch (error) {
            console.error("Error initializing dataset:", error);
            throw error;
        }
    }

    get_data_list() {
        return this.data_list;
    }

    get_data_count() {
        return this.data_list.length;
    }

    async list_file(directory) {
        const fs = require("fs");
        const path = require("path");
        try {
            // Read all files and directories in the specified directory
            const files = await fs.promises.readdir(directory);

            // Map the file names to their full paths
            return files.map((file) => path.join(directory, file));
        } catch (err) {
            console.error("Error reading directory:", err);
            throw err;
        }
    }
}
