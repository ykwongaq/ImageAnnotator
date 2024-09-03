// Progress bar
const IMAGE_PROGRESS_TEXT = document.getElementById("image-progress-text");
const MASK_PROGRESS_TEXT = document.getElementById("mask-progress-text");
const IMAGE_PROGRESS_BAR = document.getElementById("image-progress-bar");
const MASK_PROGRESS_BAR = document.getElementById("mask-progress-bar");

// Buttons
const NEXT_IMAGE_BUTTON = document.getElementById("next_image_button");
const PREV_IMAGE_BUTTON = document.getElementById("prev_image_button");
const NEXT_MASK_BUTTON = document.getElementById("next_mask_button");
const PREV_MASK_BUTTON = document.getElementById("prev_mask_button");
const SHOW_MASK_BUTTON = document.getElementById("show_mask_button");

// Message Box
const MESSAGE_BOX = document.getElementById("messageBox");
// const OVERLAY = document.getElementById("overlay");

// Category View
const SEARCH_BOX = document.getElementById("searchBox");
const CATEGORY_TEXT = document.getElementById("category-text");

const SCENE_INFO = document.getElementById("scene-info");

var current_image_index = 0;
var current_mask_index = 0;
var total_image_count = 0;
var total_mask_count = 0;

const DATASET = new Dataset();
const MASK_DRAWER = new MaskDrawer();

const OUTPUT_PATH_LIST = ["data", "outputs"];
var showMask = true;

function set_image_progress(current_image_index, total_image_count) {
    IMAGE_PROGRESS_TEXT.innerHTML = `Image: (${
        current_image_index + 1
    } / ${total_image_count})`;

    let progress = ((current_image_index + 1) / total_image_count) * 100;
    progress = Math.floor(progress);
    IMAGE_PROGRESS_BAR.style.width = `${progress}%`;
}

function set_mask_progress(current_mask_index, total_mask_count) {
    MASK_PROGRESS_TEXT.innerHTML = `Mask: (${
        current_mask_index + 1
    } / ${total_mask_count})`;

    let progress = ((current_mask_index + 1) / total_mask_count) * 100;
    progress = Math.floor(progress);
    MASK_PROGRESS_BAR.style.width = `${progress}%`;
}

function collect_labels(label_path) {
    const fs = require("fs");
    const json = fs.readFileSync(label_path, "utf8");
    const json_data = JSON.parse(json);
    labels = [];
    for (const [id, name] of Object.entries(json_data)) {
        labels.push(new Label(id, name));
    }
    return labels;
}

function load_label_buttons(labels) {
    const buttonContainer = document.getElementById("buttonContainer");
    for (const label of labels) {
        const button = document.createElement("button");
        button.innerHTML = label.name;
        button.classList.add("button-2");
        button.onclick = () => {
            mark_label(label.id, label.name);
        };
        buttonContainer.appendChild(button);
    }
}

function set_scene_info(scene_info) {
    SCENE_INFO.innerHTML = scene_info;
}

function mark_label(id, name) {
    const mask =
        DATASET.get_data_list()[current_image_index].get_mask(
            current_mask_index
        );
    mask.set_label_id(id);
    mask.set_label_name(name);
    set_category_text(name);
}

function enable_search_bar() {
    const search_box = document.getElementById("searchBox");
    search_box.addEventListener("keyup", function () {
        const searchValue = this.value.toLowerCase();
        const buttons = document.getElementsByClassName("button-2");

        for (const button of buttons) {
            const buttonValue = button.textContent.toLowerCase();
            if (buttonValue.includes(searchValue)) {
                button.classList.remove("not_target");
            } else {
                button.classList.add("not_target");
            }
        }
    });
}

function set_category_text(category) {
    if (category === null) {
        category = "None";
    }
    CATEGORY_TEXT.innerHTML = "Label: " + category;
}

function display_data(image, mask, show_annotations = true) {
    total_image_count = DATASET.get_data_count();
    total_mask_count = image.get_masks_count();
    current_image_index = image.get_image_idx();
    current_mask_index = mask.get_mask_idx();

    set_image_progress(current_image_index, total_image_count);
    set_mask_progress(current_mask_index, total_mask_count);

    MASK_DRAWER.show_data(image, mask, show_annotations);
    set_category_text(mask.get_label_name());

    set_scene_info(image.get_image_filename());
}

function enable_buttons() {
    PREV_IMAGE_BUTTON.onclick = function () {
        const data_list = DATASET.get_data_list();
        if (current_image_index > 0) {
            current_image_index--;
            current_mask_index = 0;
            const image = data_list[current_image_index];
            const mask = image.get_mask(current_mask_index);
            display_data(image, mask, showMask);
        }
    };

    NEXT_IMAGE_BUTTON.onclick = function () {
        save_image();
        const data_list = DATASET.get_data_list();
        if (current_image_index < total_image_count - 1) {
            current_image_index++;
            current_mask_index = 0;
            const image = data_list[current_image_index];
            const mask = image.get_mask(current_mask_index);
            display_data(image, mask, showMask);
        }
    };

    PREV_MASK_BUTTON.onclick = function () {
        const data_list = DATASET.get_data_list();
        const image = data_list[current_image_index];
        if (current_mask_index > 0) {
            current_mask_index -= 1;
            const mask = image.get_mask(current_mask_index);
            display_data(image, mask, showMask);
        } else {
            // Move to last mask of the previous image
            if (current_image_index > 0) {
                current_image_index--;
                const image = data_list[current_image_index];
                current_mask_index = image.get_masks_count() - 1;
                const mask = image.get_mask(current_mask_index);
                display_data(image, mask, showMask);
            }
        }
    };

    NEXT_MASK_BUTTON.onclick = function () {
        const data_list = DATASET.get_data_list();
        const image = data_list[current_image_index];
        if (current_mask_index < total_mask_count - 1) {
            current_mask_index += 1;
            const mask = image.get_mask(current_mask_index);
            display_data(image, mask, showMask);
        } else {
            save_image();
            // Move to first mask of the next image
            if (current_image_index < total_image_count - 1) {
                current_image_index++;
                current_mask_index = 0;
                const image = data_list[current_image_index];
                const mask = image.get_mask(current_mask_index);
                display_data(image, mask, showMask);
            }
        }
    };

    SHOW_MASK_BUTTON.onclick = function () {
        const data_list = DATASET.get_data_list();
        const image = data_list[current_image_index];
        const mask = image.get_mask(current_mask_index);
        showMask = !showMask;
        display_data(image, mask, showMask);
    };
}

function enable_shortcuts() {
    document.addEventListener("keydown", function (event) {
        if (document.activeElement === SEARCH_BOX) {
            return;
        }

        const inputKey = event.key.toLowerCase();
        if (inputKey === "a") {
            PREV_MASK_BUTTON.click();
        } else if (inputKey === "d") {
            NEXT_MASK_BUTTON.click();
        } else if (inputKey === "s") {
            SHOW_MASK_BUTTON.click();
        }
    });
}

function save_image() {
    show_message("Image saved.");
    const fs = require("fs");
    const path = require("path");

    const output_folder = path.join(...OUTPUT_PATH_LIST);

    // Create output folder if it does not exist
    fs.mkdirSync(output_folder, { recursive: true });

    const data = DATASET.get_data_list()[current_image_index];
    const output_filename = data.get_image_filename() + ".json";
    const output_file = path.join(output_folder, output_filename);

    const json_data = data.export_json();
    const json = JSON.stringify(json_data, null, 2);
    console.log("Saveing to: ", output_file);
    fs.writeFileSync(output_file, json, "utf-8", (err) => {
        if (err) {
            console.log("An error ocurred writing file: " + err.message);
        }
        console.log("The file has been succesfully saved to " + output_file);
    });
}

function show_message(message, second = 2) {
    MESSAGE_BOX.innerHTML = message;
    MESSAGE_BOX.style.display = "block";
    // OVERLAY.style.display = "block";

    setTimeout(() => {
        MESSAGE_BOX.style.display = "none";
    }, second * 1000);
}

async function main() {
    const path = require("path");

    const data_folder = "data";
    await DATASET.initialize(data_folder);

    const label_path = path.join(__dirname, "data", "labels.json");
    const labels = collect_labels(label_path);

    // Load the buttons
    load_label_buttons(labels);

    // Enable search bar
    enable_search_bar();

    // Enable buttons
    enable_buttons();

    // Enable shortcuts
    enable_shortcuts();

    const data_list = DATASET.get_data_list();

    current_image_index = 0;
    current_mask_index = 0;

    let image = data_list[current_image_index];
    let mask = image.get_mask(current_mask_index);
    display_data(image, mask);
}

main();
