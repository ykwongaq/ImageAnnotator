const { ipcRenderer } = require("electron");

class PythonUtil {
    static TASK_PROCESS = "process";
    static TASK_EDIT_MASK = "edit-mask";
    static OPT_EDIT_MASK_ADD_INPUT_POINT = "add-input-point";
    static OPT_EDIT_MASK_UNDO_INPUT_POINT = "undo-input-point";
    static OPT_EDIT_MASK_CLEAR_INPUT_POINTS = "clear-input-points";
    static OPT_EDIT_MASK_CONFIRM_INPUT = "confirm-input";
    static OPT_EDIT_MASK_SET_IMAGE = "set-image";
    static NULL = "null";

    constructor() {}

    sendMessage(message, task, operation) {
        task = `${task}/${operation}`;
        message["task"] = task;
        // console.log("Sending message to Python:", message);
        ipcRenderer.send("send-message", message);
    }

    async recieveMessage() {
        try {
            const response = await this.waitResponse();
            return response;
        } catch (error) {
            console.error("Error from Python:", error);
        }
    }

    waitResponse() {
        return new Promise((resolve, reject) => {
            ipcRenderer.once("python-response", (event, message) => {
                resolve(message);
            });
        });
    }
}
