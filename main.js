const { app, BrowserWindow, desktopCapturer, session } = require('electron')
const path = require('node:path')

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const appExp = express();
const server = http.createServer(appExp);
const io = socketIo(server);
const cors = require('cors');
appExp.use(cors());

appExp.get('/', (req, res) => {
  res.sendFile(__dirname + '/stream.html'); // Убедитесь, что у вас есть index.html
});

io.on("connection", socket => {
  console.log("Клиент подключен");

  socket.on("offer", data => socket.broadcast.emit("offer", data));
  socket.on("answer", data => socket.broadcast.emit("answer", data));
  socket.on("candidate", data => socket.broadcast.emit("candidate", data));

  socket.on("disconnect", () => console.log("Клиент отключился"));
});

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow.loadFile('index.html')
  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
  // If we should use the system picker
  // Note: this is currently experimental
  // if (desktopCapturer.isDisplayMediaSystemPickerAvailable()) {
  //   callback({ video: desktopCapturer.systemPickerVideoSource })
  //   return;
  // }
  desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
    console.log('Request: ', request)
    // Grant access to the first screen found.
    callback({ video: sources[0] })
  }).catch((err) => {
    console.log('Error: ', err);
  })
})

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
