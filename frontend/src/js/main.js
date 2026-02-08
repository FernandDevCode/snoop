// frontend/src/js/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Crée la fenêtre du navigateur.
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js') // On l'activera plus tard
    }
  });

  // et charge le fichier accueil.html de l'application.
  mainWindow.loadFile(path.join(__dirname, '../../home.html'));

  // Ouvre les DevTools (outils de développement, comme dans Chrome).
  // mainWindow.webContents.openDevTools();
}

// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et sera prêt à créer des fenêtres.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quitte l'application quand toutes les fenêtres sont fermées.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});