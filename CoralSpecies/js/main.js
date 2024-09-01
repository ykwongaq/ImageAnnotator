async function main() {
    let path = require("path");
    const data_folder = "data";
    let dataset = new Dataset(data_folder);
    await dataset.initialize();
    const data_list = dataset.get_data_list();

    const mask_drawer = new MaskDrawer();
    for (let data of data_list) {
        mask_drawer.show_data(data);
        break;
    }
}

main();
