// // const { app, BrowserWindow, ipcMain } = require("electron");
// // const path = require("path");

// // let mainWindow;


// // app.whenReady().then(() => {
// //     mainWindow = new BrowserWindow({
// //         width: 900,
// //         height: 700,
// //         webPreferences: {
// //             preload: path.join(__dirname, "preload.js"),  // Load preload
// //             nodeIntegration: false,  // Improves security
// //             contextIsolation: true,  // Required for `contextBridge`
// //             enableRemoteModule: false, // Security best practice (disable remote module)
// //             webSecurity: false // Allow local file loading
// //         }
// //     });

// //     mainWindow.loadFile("index.html");

// //     // 🎵 Handle Navigation Events
// //     ipcMain.on("open-playlists", () => {
// //         console.log("📜 Opening playlists.html...");
// //         mainWindow.loadFile("playlist.html"); // Ensure filename matches actual file
// //     });

// //     ipcMain.on("open-themes", () => {
// //         console.log("🎨 Opening themes.html...");
// //         mainWindow.loadFile("themes.html"); // Ensure filename matches actual file
// //     });

// //     // Quit app when all windows are closed (except for macOS)
// //     app.on("window-all-closed", () => {
// //         if (process.platform !== "darwin") {
// //             app.quit();
// //         }
// //     });

// //     ipcMain.on("go-back", () => {
// //         console.log("⬅ Navigating back to index.html");
// //         mainWindow.loadFile("index.html");
// //     });
    

// //     // macOS behavior: re-create window on dock icon click
// //     app.on("activate", () => {
// //         if (BrowserWindow.getAllWindows().length === 0) {
// //             app.whenReady().then(() => {
// //                 mainWindow = new BrowserWindow({
// //                     width: 900,
// //                     height: 700,
// //                     webPreferences: {
// //                         preload: path.join(__dirname, "preload.js"),
// //                         nodeIntegration: false,
// //                         contextIsolation: true
// //                     }
// //                 });
// //                 mainWindow.loadFile("index.html");
// //             });
// //         }
// //     });
// // });

// const { app, BrowserWindow, ipcMain } = require("electron");
// const path = require("path");

// let mainWindow;

// app.whenReady().then(() => {
//     mainWindow = new BrowserWindow({
//         width: 900,
//         height: 700,
//         webPreferences: {
//             preload: path.join(__dirname, "preload.js"),  // Load preload
//             nodeIntegration: false,  // Improves security
//             contextIsolation: true  // Required for `contextBridge`
//         }
//     });

//     mainWindow.loadFile("index.html");

//     ipcMain.on("open-playlists", () => {
//         console.log("📜 Opening playlists.html...");
//         mainWindow.loadFile("playlist.html");
//     });

//     ipcMain.on("open-themes", () => {
//         console.log("🎨 Opening themes.html...");
//         mainWindow.loadFile("themes.html");
//     });

//     ipcMain.on("go-back", () => {
//         console.log("⬅ Navigating back to index.html");
//         mainWindow.loadFile("index.html");
//     });
// });
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile("index.html");

    ipcMain.on("open-playlists", () => {
        console.log("📜 Opening playlists.html...");
        mainWindow.loadFile("playlist.html");
    });

    ipcMain.on("open-themes", () => {
        console.log("🎨 Opening themes.html...");
        mainWindow.loadFile("themes.html");
    });

    ipcMain.on("go-back", () => {
        console.log("⬅ Navigating back to index.html");
        mainWindow.loadFile("index.html");
    });
});
