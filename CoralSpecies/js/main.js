const { clear } = require("console");

// Progress bar
const IMAGE_PROGRESS_TEXT = document.getElementById("image-progress-text");
const IMAGE_PROGRESS_BAR = document.getElementById("image-progress-bar");

// Buttons
const NEXT_IMAGE_BUTTON = document.getElementById("next_image_button");
const PREV_IMAGE_BUTTON = document.getElementById("prev_image_button");
// const SHOW_MASK_BUTTON = document.getElementById("show_mask_button");
const RESET_VIEWPOINT_BUTTON = document.getElementById(
    "reset_viewpoint_button"
);

// Message Box
const MESSAGE_BOX = document.getElementById("messageBox");
// const OVERLAY = document.getElementById("overlay");

// Category View
const SEARCH_BOX = document.getElementById("searchBox");

// Canvas
const CANVAS = document.getElementById("canvas");
const CANVAS_DRAWER = new CanvasDrawer(CANVAS);

// Button Container
const CATEGORY_BUTTON_CONTAINER = document.getElementById("buttonContainer");
const CONTEXT_MENU = document.getElementById("contextMenu");
const DELETE_ACTION = document.getElementById("deleteAction");
var CONTEXT_MENU_SELECTED_LABEL_ID = null;

// Scene Info
const SCENE_INFO = document.getElementById("scene-info");

// Mask Opacity Slider
const MASK_OPACITY_SLIDER = document.getElementById("mask-opacity-silder");

// Statistic View
const STATISTIC_REPORT = new StatisticReport();
const STATSITIC_BOX_TEMPLATE = document.getElementById(
    "statistic-box-template"
);
const STATISTIC_BOX_CONTAINER = document.getElementById(
    "statistic-box-container"
);
const STATISTIC_BOX_MANAGER = new StatisticBoxManager(
    STATISTIC_BOX_CONTAINER,
    STATSITIC_BOX_TEMPLATE
);

// Add Category
const ADD_CATEGORY_BUTTON = document.getElementById("add-category-button");
const ADD_CATEGORY_INPUT = document.getElementById("add-category-input");

var current_image = null;

const DATASET = new Dataset();
// const MASK_DRAWER = new MaskDrawer();

const OUTPUT_PATH_LIST = ["data", "outputs"];
var showMask = true;
var selected_masks = new Set();
var selected_masks_to_remove = new Set();

// Mask Mode
const LABEL_MASK = 0;
const ADD_MASK = 1;
const REMOVE_MASK = 2;
var currentMaskMode = LABEL_MASK;

const EDIT_MASK_UNDO_BUTTON = document.getElementById("edit-mask-undo-button");
const EDIT_MASK_RESET_BUTTON = document.getElementById(
    "edit-mask-reset-button"
);
const EDIT_MASK_CONFIRM_BUTTON = document.getElementById(
    "edit-mask-confirm-button"
);

const PYTHON_UTIL = new PythonUtil();

function show_edit_mask_buttons() {
    EDIT_MASK_UNDO_BUTTON.style.display = "block";
    EDIT_MASK_RESET_BUTTON.style.display = "block";
    EDIT_MASK_CONFIRM_BUTTON.style.display = "block";
}

function hide_edit_mask_buttons() {
    EDIT_MASK_UNDO_BUTTON.style.display = "none";
    EDIT_MASK_RESET_BUTTON.style.display = "none";
    EDIT_MASK_CONFIRM_BUTTON.style.display = "none";
}

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

function update_label_buttons() {
    const buttonContainer = document.getElementById("buttonContainer");
    buttonContainer.innerHTML = "";
    for (const label_id in Label.labels) {
        const label_name = Label.labels[label_id];

        const button = document.createElement("button");
        button.innerHTML = `${label_id}: ${label_name}`;
        button.classList.add("button-2");
        button.onclick = () => {
            mark_label(label_id, label_name);
        };

        const color = Label.getLabelColor(label_id);
        button.style.borderColor = color;

        button.addEventListener("contextmenu", function (event) {
            event.preventDefault();
            CONTEXT_MENU.style.display = "block";
            CONTEXT_MENU.style.left = event.pageX + "px";
            CONTEXT_MENU.style.top = event.pageY + "px";
            CONTEXT_MENU_SELECTED_LABEL_ID = label_id;
        });

        buttonContainer.appendChild(button);
    }

    DELETE_ACTION.onclick = function () {
        delete Label.labels[CONTEXT_MENU_SELECTED_LABEL_ID];
        update_label_buttons();
    };

    document.addEventListener("click", function () {
        contextMenu.style.display = "none"; // Hide context menu on click elsewhere
    });
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

    STATISTIC_REPORT.updateStatistic();
    STATISTIC_BOX_MANAGER.updateStatistic(STATISTIC_REPORT);
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
    CATEGORY_BUTTON_CONTAINER.addEventListener("wheel", function (event) {
        event.preventDefault();
        CATEGORY_BUTTON_CONTAINER.scrollLeft += event.deltaY;
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
            setCurrentImage(image);
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
            setCurrentImage(image);
            CANVAS_DRAWER.setData(image);
            display_data();
            clear_selected_masks();
        }
    };

    // SHOW_MASK_BUTTON.onclick = function () {
    //     const { ipcRenderer } = require("electron");
    //     const message = "show mask";
    //     ipcRenderer.send("send-message", message);

    //     ipcRenderer.on("python-response", (event, response) => {
    //         console.log(response);
    //     });
    // };

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

function select_mask_to_remove(mask) {
    selected_masks_to_remove.add(mask);
    mask.set_color(Label.remove_color);
}

function unselect_mask_to_remove(mask) {
    selected_masks_to_remove.delete(mask);
    mask.set_color_by_id();
}

function clear_selected_masks() {
    for (const mask of selected_masks) {
        unselect_mask(mask);
    }
}

function enable_shortcuts() {
    document.addEventListener("keydown", function (event) {
        if (
            document.activeElement === SEARCH_BOX ||
            document.activeElement === ADD_CATEGORY_INPUT
        ) {
            return;
        }

        const inputKey = event.key.toLowerCase();
        if (inputKey === "a") {
            PREV_IMAGE_BUTTON.click();
        } else if (inputKey === "d") {
            NEXT_IMAGE_BUTTON.click();
            // } else if (inputKey === "s") {
            //     SHOW_MASK_BUTTON.click();
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

function extract_mask_from_response(response) {
    annotation = {};
    annotation["label_id"] = response["label_id"];
    annotation["label_name"] = response["label_name"];
    annotation["area"] = response["area"];
    annotation["bbox"] = response["bbox"];
    annotation["segmentation"] = response["segmentation"];

    mask = new Mask(annotation, -1, -1);
    return mask;
}

function extract_selected_points_from_response(response) {
    const selected_points = response["selected_points"];
    return selected_points;
}

function extract_labels_from_response(response) {
    const labels = response["labels"];
    return labels;
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

        if (currentMaskMode == LABEL_MASK) {
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
        } else if (currentMaskMode == ADD_MASK) {
            if (CANVAS_DRAWER.isInsideImageBoundary(canvasX, canvasY)) {
                const message = {
                    imageX: imageX,
                    imageY: imageY,
                    label: 1,
                };

                PYTHON_UTIL.sendMessage(
                    message,
                    PythonUtil.TASK_EDIT_MASK,
                    PythonUtil.OPT_EDIT_MASK_ADD_INPUT_POINT
                );

                PYTHON_UTIL.recieveMessage().then((response) => {
                    const mask = extract_mask_from_response(response);
                    const selectedPoints =
                        extract_selected_points_from_response(response);
                    const labels = extract_labels_from_response(response);

                    CANVAS_DRAWER.updateEditingResult(
                        mask,
                        selectedPoints,
                        labels
                    );
                });
            }
        } else if (currentMaskMode == REMOVE_MASK) {
            if (CANVAS_DRAWER.isInsideImageBoundary(canvasX, canvasY)) {
                const clicked_masks = [];
                const image = current_image;
                for (const mask of image.get_masks()) {
                    if (mask.contain_pixel(imageX, imageY)) {
                        clicked_masks.push(mask);
                    }
                }

                for (const clicked_mask of clicked_masks) {
                    if (selected_masks_to_remove.has(clicked_mask)) {
                        unselect_mask_to_remove(clicked_mask);
                    } else {
                        select_mask_to_remove(clicked_mask);
                    }
                }

                CANVAS_DRAWER.updateMasks();
                display_data();
            }
        } else {
            console.error("Invalid Mask Mode: ", currentMaskMode);
        }
    });

    CANVAS.addEventListener("contextmenu", function (event) {
        event.preventDefault();
        let [canvasX, canvasY] = CANVAS_DRAWER.getMousePos(event);
        canvasX = Math.floor(canvasX);
        canvasY = Math.floor(canvasY);

        let [imageX, imageY] = CANVAS_DRAWER.canvasPixelToImagePixel(
            canvasX,
            canvasY
        );

        if (currentMaskMode == ADD_MASK) {
            if (CANVAS_DRAWER.isInsideImageBoundary(canvasX, canvasY)) {
                const message = {
                    imageX: imageX,
                    imageY: imageY,
                    label: 0,
                };

                PYTHON_UTIL.sendMessage(
                    message,
                    PythonUtil.TASK_EDIT_MASK,
                    PythonUtil.OPT_EDIT_MASK_ADD_INPUT_POINT
                );

                PYTHON_UTIL.recieveMessage().then((response) => {
                    const mask = extract_mask_from_response(response);
                    const selectedPoints =
                        extract_selected_points_from_response(response);
                    const labels = extract_labels_from_response(response);

                    CANVAS_DRAWER.updateEditingResult(
                        mask,
                        selectedPoints,
                        labels
                    );
                });
            }
        } else if (currentMaskMode == REMOVE_MASK) {
            if (CANVAS_DRAWER.isInsideImageBoundary(canvasX, canvasY)) {
                const clicked_masks = [];
                const image = current_image;
                for (const mask of image.get_masks()) {
                    if (mask.contain_pixel(imageX, imageY)) {
                        clicked_masks.push(mask);
                    }
                }

                for (const clicked_mask of clicked_masks) {
                    if (selected_masks_to_remove.has(clicked_mask)) {
                        remove_mask(clicked_mask);
                    }
                }

                CANVAS_DRAWER.updateMasks();
                // display_data();
            }
        } else {
        }
    });
}

function remove_mask(mask) {
    current_image.remove_mask(mask);
    STATISTIC_REPORT.updateStatistic();
    STATISTIC_BOX_MANAGER.updateStatistic(STATISTIC_REPORT);
}

function enable_mask_silder() {
    MASK_OPACITY_SLIDER.oninput = function () {
        const opacity = this.value / 100;
        CANVAS_DRAWER.setMaskOpacity(opacity);
        CANVAS_DRAWER.draw();
    };
}

function setCurrentImage(image) {
    current_image = image;
    CANVAS_DRAWER.setData(image);
    STATISTIC_REPORT.setImage(image);
    STATISTIC_REPORT.updateStatistic();
    STATISTIC_BOX_MANAGER.updateStatistic(STATISTIC_REPORT);

    const image_path = current_image.get_image_path();
    const image_embedding_path = current_image.get_image_embedding_path();

    clear_editted_mask();

    const message = {
        image_path: image_path,
        image_embedding_path: image_embedding_path,
    };

    PYTHON_UTIL.sendMessage(
        message,
        PythonUtil.TASK_EDIT_MASK,
        PythonUtil.OPT_EDIT_MASK_SET_IMAGE
    );

    PYTHON_UTIL.recieveMessage().then((response) => {
        // console.log(response);
    });
}

function enable_add_category() {
    ADD_CATEGORY_BUTTON.onclick = function () {
        const new_category = ADD_CATEGORY_INPUT.value;

        let largestLabelId = -1;
        for (const labelId in Label.labels) {
            if (parseInt(labelId) > largestLabelId) {
                largestLabelId = labelId;
            }
        }

        const newLabelId = parseInt(largestLabelId) + 1;
        Label.labels[newLabelId] = new_category;
        update_label_buttons();
    };
}

function load_statistic_box() {}

function updateMaskMode(event) {
    const mode = parseInt(event.target.value);
    currentMaskMode = mode;
    console.log("Mask Mode: ", currentMaskMode);
    clear_editted_mask();
    if (mode == ADD_MASK) {
        show_edit_mask_buttons();
    } else {
        hide_edit_mask_buttons();
    }
}

function enable_radio_buttons() {
    const maskModeRadios = document.querySelectorAll('input[name="mask-mode"]');
    maskModeRadios.forEach((radio) => {
        radio.addEventListener("change", updateMaskMode);
    });
}

function enable_edit_action_buttons() {
    EDIT_MASK_CONFIRM_BUTTON.onclick = function () {
        const mask = CANVAS_DRAWER.get_editting_mask();
        if (mask == null) {
            return;
        }

        const message = {
            dummpy: "dummy",
        };

        current_image.add_mask(mask);

        PYTHON_UTIL.sendMessage(
            message,
            PythonUtil.TASK_EDIT_MASK,
            PythonUtil.OPT_EDIT_MASK_CONFIRM_INPUT
        );

        PYTHON_UTIL.recieveMessage().then((response) => {});
        clear_editted_mask();
        CANVAS_DRAWER.updateMasks();

        STATISTIC_REPORT.updateStatistic();
        STATISTIC_BOX_MANAGER.updateStatistic(STATISTIC_REPORT);
    };

    EDIT_MASK_UNDO_BUTTON.onclick = function () {
        const message = {
            dummpy: "dummy",
        };

        PYTHON_UTIL.sendMessage(
            message,
            PythonUtil.TASK_EDIT_MASK,
            PythonUtil.OPT_EDIT_MASK_UNDO_INPUT_POINT
        );

        PYTHON_UTIL.recieveMessage().then((response) => {
            const selectedPoints =
                extract_selected_points_from_response(response);
            const labels = extract_labels_from_response(response);

            let mask = null;
            if (selectedPoints.length != 0) {
                mask = extract_mask_from_response(response);
            }
            CANVAS_DRAWER.updateEditingResult(mask, selectedPoints, labels);
        });
    };

    EDIT_MASK_RESET_BUTTON.onclick = function () {
        clear_editted_mask();
    };
}

function clear_editted_mask() {
    CANVAS_DRAWER.updateEditingResult(null, [], []);

    const message = {
        dummpy: "dummy",
    };

    PYTHON_UTIL.sendMessage(
        message,
        PythonUtil.TASK_EDIT_MASK,
        PythonUtil.OPT_EDIT_MASK_CLEAR_INPUT_POINTS
    );

    PYTHON_UTIL.recieveMessage().then((response) => {});
}

async function main() {
    const path = require("path");

    const data_folder = "data";
    await DATASET.initialize(data_folder);

    // Load the buttons
    update_label_buttons();

    // Enable search bar
    enable_search_bar();

    // Enable buttons
    enable_buttons();

    // Enable shortcuts
    enable_shortcuts();

    // Enable canvas
    enable_canvas();

    // Enable button container
    enable_button_container();

    // Enable mask slider
    enable_mask_silder();

    // Load statistic box
    load_statistic_box();

    // Enable add category
    enable_add_category();

    // Enable radio buttons
    enable_radio_buttons();

    enable_edit_action_buttons();

    const data_list = DATASET.get_data_list();
    setCurrentImage(data_list[0]);

    display_data();
}

main();
