// Progress bar
const IMAGE_PROGRESS_TEXT = document.getElementById("image-progress-text");
const IMAGE_PROGRESS_BAR = document.getElementById("image-progress-bar");

// Buttons
const NEXT_IMAGE_BUTTON = document.getElementById("next_image_button");
const PREV_IMAGE_BUTTON = document.getElementById("prev_image_button");
const SHOW_MASK_BUTTON = document.getElementById("show_mask_button");
const RESET_VIEWPOINT_BUTTON = document.getElementById(
    "reset_viewpoint_button"
);

// Message Box
const MESSAGE_BOX = document.getElementById("messageBox");
// const OVERLAY = document.getElementById("overlay");

// Category View
const SEARCH_BOX = document.getElementById("searchBox");

const CANVAS = document.getElementById("canvas");
const CANVAS_DRAWER = new CanvasDrawer(CANVAS);

const BUTTON_CONTAINER = document.getElementById("buttonContainer");

const SCENE_INFO = document.getElementById("scene-info");

var current_image = null;

const DATASET = new Dataset();
// const MASK_DRAWER = new MaskDrawer();

const OUTPUT_PATH_LIST = ["data", "outputs"];
var showMask = true;

var selected_masks = new Set();

function set_image_progress(current_image) {
    let current_image_idx = current_image.get_image_idx();
    let total_image_count = DATASET.get_data_count();

    IMAGE_PROGRESS_TEXT.innerHTML = `Image: (${
        current_image_idx + 1
    } / ${total_image_count})`;

    let progress = ((current_image_idx + 1) / total_image_count) * 100;
    progress = Math.floor(progress);
    IMAGE_PROGRESS_BAR.style.width = `${progress}%`;
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
    let idx = 0;
    for (const label of labels) {
        const button = document.createElement("button");
        button.innerHTML = `${label.get_label_id()}: ${label.get_label_name()}`;
        button.classList.add("button-2");
        button.onclick = () => {
            mark_label(label.get_label_id(), label.get_label_name());
        };

        const color = Label.color_list[idx];
        button.style.borderColor = color;

        buttonContainer.appendChild(button);
        idx += 1;
    }
}

function set_scene_info(scene_info) {
    SCENE_INFO.innerHTML = scene_info;
}

function mark_label(id, name) {
    for (const mask of selected_masks) {
        mask.set_label_id(id);
        mask.set_label_name(name);
        mask.set_color_by_id();
    }
    CANVAS_DRAWER.updateMasks();
    display_data();
    clear_selected_masks();
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

function enable_button_container() {
    BUTTON_CONTAINER.addEventListener("wheel", function (event) {
        event.preventDefault();
        BUTTON_CONTAINER.scrollLeft += event.deltaY;
    });
}
function display_data() {
    set_image_progress(current_image);
    CANVAS_DRAWER.draw();
    set_scene_info(current_image.get_image_filename());
}

function enable_buttons() {
    PREV_IMAGE_BUTTON.onclick = function () {
        const data_list = DATASET.get_data_list();
        let current_image_index = current_image.get_image_idx();
        if (current_image_index > 0) {
            current_image_index--;
            const image = data_list[current_image_index];
            current_image = image;
            CANVAS_DRAWER.setData(image);
            display_data();
            clear_selected_masks();
        }
    };

    NEXT_IMAGE_BUTTON.onclick = function () {
        save_image();
        const data_list = DATASET.get_data_list();
        let current_image_idx = current_image.get_image_idx();
        const total_image_count = DATASET.get_data_count();
        if (current_image_idx < total_image_count - 1) {
            current_image_idx++;
            const image = data_list[current_image_idx];
            current_image = image;
            CANVAS_DRAWER.setData(image);
            display_data();
            clear_selected_masks();
        }
    };

    SHOW_MASK_BUTTON.onclick = function () {
        const data_list = DATASET.get_data_list();
        showMask = !showMask;
        CANVAS_DRAWER.setShowAnnotation(showMask);
        display_data();
    };

    RESET_VIEWPOINT_BUTTON.onclick = function () {
        CANVAS_DRAWER.resetViewpoint();
    };
}

function select_mask(mask) {
    selected_masks.add(mask);
    mask.set_color(Label.selected_color);
}

function unselect_mask(mask) {
    selected_masks.delete(mask);
    mask.set_color_by_id();
}

function clear_selected_masks() {
    for (const mask of selected_masks) {
        unselect_mask(mask);
    }
}

function enable_shortcuts() {
    document.addEventListener("keydown", function (event) {
        if (document.activeElement === SEARCH_BOX) {
            return;
        }

        const inputKey = event.key.toLowerCase();
        if (inputKey === "a") {
            PREV_IMAGE_BUTTON.click();
        } else if (inputKey === "d") {
            NEXT_IMAGE_BUTTON.click();
        } else if (inputKey === "s") {
            SHOW_MASK_BUTTON.click();
        } else if (inputKey === "w") {
            RESET_VIEWPOINT_BUTTON.click();
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

    const data = current_image;
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

    setTimeout(() => {
        MESSAGE_BOX.style.display = "none";
    }, second * 1000);
}

function enable_canvas() {
    CANVAS.addEventListener("click", function (event) {
        let [canvasX, canvasY] = CANVAS_DRAWER.getMousePos(event);
        canvasX = Math.floor(canvasX);
        canvasY = Math.floor(canvasY);

        let [imageX, imageY] = CANVAS_DRAWER.canvasPixelToImagePixel(
            canvasX,
            canvasY
        );

        if (CANVAS_DRAWER.isInsideImageBoundary(canvasX, canvasY)) {
            const clicked_masks = [];
            const image = current_image;
            for (const mask of image.get_masks()) {
                if (mask.contain_pixel(imageX, imageY)) {
                    clicked_masks.push(mask);
                }
            }

            for (const clicked_mask of clicked_masks) {
                if (selected_masks.has(clicked_mask)) {
                    unselect_mask(clicked_mask);
                } else {
                    select_mask(clicked_mask);
                }
            }

            CANVAS_DRAWER.updateMasks();
            display_data();
        }
    });
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

    // Enable canvas
    enable_canvas();

    enable_button_container();

    const data_list = DATASET.get_data_list();
    current_image = data_list[0];
    CANVAS_DRAWER.setData(current_image);
    display_data();
}

main();
