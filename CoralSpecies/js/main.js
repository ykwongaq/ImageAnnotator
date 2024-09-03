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

const SEARCH_BOX = document.getElementById("searchBox");

var current_image_index = 0;
var current_mask_index = 0;
var total_image_count = 0;
var total_mask_count = 0;

const DATASET = new Dataset();
const MASK_DRAWER = new MaskDrawer();

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

function mark_label(id, name) {
    console.log("Marking label:", id, name);
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

function display_data(image, mask, show_annotations = true) {
    total_image_count = DATASET.get_data_count();
    total_mask_count = image.get_masks_count();
    current_image_index = image.get_image_idx();
    current_mask_index = mask.get_mask_idx();

    console.log("current_image_index: ", current_image_index);
    console.log("total_image_count: ", total_image_count);
    console.log("current_mask_index: ", current_mask_index);
    console.log("total_mask_count: ", total_mask_count);

    set_image_progress(current_image_index, total_image_count);
    set_mask_progress(current_mask_index, total_mask_count);

    MASK_DRAWER.show_data(image, mask, show_annotations);
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
        }
    };

    NEXT_MASK_BUTTON.onclick = function () {
        const data_list = DATASET.get_data_list();
        const image = data_list[current_image_index];
        if (current_mask_index < total_mask_count - 1) {
            current_mask_index += 1;
            console.log("check current_mask_index: ", current_mask_index);
            const mask = image.get_mask(current_mask_index);
            display_data(image, mask, showMask);
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

async function main() {
    const path = require("path");

    const data_folder = "data";
    await DATASET.initialize(data_folder);

    const label_path = path.join(__dirname, "data", "labels.json");
    console.log("label_path: ", label_path);
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
