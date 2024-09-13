// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn } = require("child_process");
const path = require("node:path");

var pythonProcess = null;

const createWindow = () => {
    console.log("Creating window");

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // and load the index.html of the app.
    mainWindow.loadFile("index.html");

    // Start the python server
    const pythonExecutablePath = path.join(
        __dirname,
        "python",
        "dist",
        "server.exe"
    );

    console.log("spawning python process");
    pythonProcess = spawn(pythonExecutablePath);

    // Send a message to Python when the renderer process sends 'send-message'
    ipcMain.on("send-message", (event, message) => {
        const data = JSON.stringify({ message });
        pythonProcess.stdin.write(data + "\n");
    });

    // Listen for messages from Python
    pythonProcess.stdout.on("data", (data) => {
        try {
            const response = JSON.parse(data.toString());
            mainWindow.webContents.send("python-response", response);
        } catch (error) {
            console.log('Error JSON: "', data.toString(), '"');
            console.log("Error JSON: ", data);
            console.error("Error parsing JSON:", error);
        }
    });

    // Handle errors
    pythonProcess.stderr.on("data", (data) => {
        console.error("Error from Python:", data.toString());
    });

    // Handle app close
    mainWindow.on("closed", () => {
        pythonProcess.kill();
        app.quit();
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            console.log("Recreating window");
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
