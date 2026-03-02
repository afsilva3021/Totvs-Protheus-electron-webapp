const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setAppUrl: (url) => ipcRenderer.send('set-app-url', url),
  getAcessoData: () => ipcRenderer.invoke('get-acesso-data')
})