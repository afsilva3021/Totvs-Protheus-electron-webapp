const { app, BrowserWindow, screen, Menu, MenuItem, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const net = require('net')
const fs = require('fs')
const os = require('os')

let webAgentProcess = null
let mainWindow = null
const WEB_AGENT_PORT = 0 //

// URL da aplicação
let APP_URL = null

// Variável para controlar o processo de fechamento
let isClosing = false

// Função para verificar se a porta do web-agent está escutando
function checkWebAgentPort(port = WEB_AGENT_PORT, timeout = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    
    socket.setTimeout(timeout)
    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })
    
    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    
    socket.on('error', () => {
      socket.destroy()
      resolve(false)
    })
    
    socket.connect(port, '127.0.0.1')
  })
}

// Função para iniciar web-agent
async function startWebAgent() {
  const username = os.userInfo().username
  const webAgentPath = `C:\\Users\\${username}\\AppData\\Local\\Programs\\web-agent\\web-agent.exe`

  if (!fs.existsSync(webAgentPath)) {
    return false
  }

  try {
    // Verifica se já está rodando
    const isRunning = await checkWebAgentPort(WEB_AGENT_PORT)
    if (isRunning) {
      return true
    }

    // Inicia novo processo
    webAgentProcess = spawn(webAgentPath, ['-c', '--port', WEB_AGENT_PORT.toString()], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    })

    // Aguarda 2 segundos para inicialização
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Verifica se iniciou com sucesso
    return await checkWebAgentPort(WEB_AGENT_PORT)

  } catch (error) {
    return false
  }
}

// Função para criar menu de contexto
function createContextMenu() {
  const contextMenu = new Menu()
  contextMenu.append(new MenuItem({ label: 'Recortar', role: 'cut', accelerator: 'CmdOrCtrl+X' }))
  contextMenu.append(new MenuItem({ label: 'Copiar', role: 'copy', accelerator: 'CmdOrCtrl+C' }))
  contextMenu.append(new MenuItem({ label: 'Colar', role: 'paste', accelerator: 'CmdOrCtrl+V' }))
  contextMenu.append(new MenuItem({ label: 'Selecionar Tudo', role: 'selectAll', accelerator: 'CmdOrCtrl+A' }))
  return contextMenu
}

// Função para aplicar zoom baseado na resolução
function applyAutoZoom(window) {
  try {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    if (width <= 1366 && height <= 768) {
      window.webContents.setZoomFactor(0.9)
      return true
    } else {
      window.webContents.setZoomFactor(1.0)
      return false
    }
  } catch (error) {
    window.webContents.setZoomFactor(1.0)
    return false
  }
}

// Função para monitorar mudanças na resolução
function setupResolutionMonitor(window) {
  applyAutoZoom(window)
  screen.on('display-metrics-changed', () => applyAutoZoom(window))
}

// Função para limpar recursos antes de fechar
function cleanupBeforeClose() {
  if (webAgentProcess) {
    try {
      webAgentProcess.kill('SIGKILL')
    } catch (err) {
      // Ignora erro se processo já terminou
    }
    webAgentProcess = null
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      webSecurity: true,
      allowRunningInsecureContent: false,
      partition: 'persist:totvsapp',
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Remove menu padrão
  mainWindow.removeMenu()

  // Configura menu de contexto
  mainWindow.webContents.on('context-menu', (event, params) => {
    createContextMenu().popup({ window: mainWindow, x: params.x, y: params.y })
  })

  // Configura atalhos de teclado para zoom
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && !input.shift && !input.alt) {
      let current = mainWindow.webContents.getZoomFactor()
      let newZoom = current
      
      if (input.key === '=' || input.key === '+') {
        event.preventDefault()
        newZoom = Math.min(3.0, current + 0.1)
      } else if (input.key === '-') {
        event.preventDefault()
        newZoom = Math.max(0.5, current - 0.1)
      } else if (input.key === '0') {
        event.preventDefault()
        newZoom = 1.0
      }
      
      if (newZoom !== current) {
        mainWindow.webContents.setZoomFactor(newZoom)
      }
    }
  })

  // Configura zoom automático
  setupResolutionMonitor(mainWindow)

  // Carrega a tela inicial
  mainWindow.loadFile('index.html').catch(error => {
    console.error('Erro ao carregar página inicial:', error.message)
  })

  // Configura evento de fechamento
  mainWindow.on('close', (event) => {
    if (!isClosing) {
      event.preventDefault()
      isClosing = true
      
      // Limpa recursos
      cleanupBeforeClose()
      
      // Fecha a janela
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.destroy()
        }
        app.exit(0)
      }, 100)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}


// Configura flags para ignorar erros de certificado
app.commandLine.appendSwitch('ignore-certificate-errors')
app.commandLine.appendSwitch('allow-insecure-localhost')

// Otimizações para acelerar o carregamento (principalmente de URLs internas)
app.commandLine.appendSwitch('no-proxy-server') // Remove o delay de detecção automática de proxy do Windows
app.commandLine.appendSwitch('disable-site-isolation-trials')
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('enable-zero-copy')

// Corrige o erro "Gpu Cache Creation failed" e de permissões de disco (0x5)
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
app.commandLine.appendSwitch('disable-disk-cache')
app.commandLine.appendSwitch('disable-http-cache')

// Fallback: Redireciona os dados do usuário para a pasta Temp caso o perfil principal não tenha permissão
app.setPath('userData', path.join(os.tmpdir(), 'totvs-web-app-data'))

// Configura IPC para receber a URL do renderer e atualizar APP_URL
ipcMain.on('set-app-url', (event, url) => {
  APP_URL = url
  if (mainWindow) {
    mainWindow.loadURL(APP_URL).catch(error => {
      console.error('Erro ao carregar nova URL:', error.message)
    })
  }
})

// IPC para ler o arquivo acesso.json (Sandbox bypass)
ipcMain.handle('get-acesso-data', () => {
  try {
    // Quando em desenvolvimento (npm start), usa a raiz do projeto
    // Quando empacotado (exe), usa a mesma pasta onde o executável está
    const isPackaged = app.isPackaged
    let basePath = __dirname
    
    if (isPackaged) {
      if (process.env.PORTABLE_EXECUTABLE_DIR) {
        // Se for o build portable (.exe gerado pelo electron-builder)
        basePath = process.env.PORTABLE_EXECUTABLE_DIR
      } else {
        // Outros builds (nsis, dir, etc)
        basePath = path.dirname(app.getPath('exe'))
      }
    }
    
    const filePath = path.join(basePath, 'acesso.json')
    const fallbackPath = path.join(__dirname, 'acesso.json')
    
    // Se o arquivo não existir externamente e a aplicação estiver empacotada,
    // tenta copiar o arquivo interno para fora para que o usuário possa editar.
    if (isPackaged && !fs.existsSync(filePath)) {
        if (fs.existsSync(fallbackPath)) {
            try {
                fs.copyFileSync(fallbackPath, filePath)
                console.log('Arquivo acesso.json extraído para edição em:', filePath)
            } catch (err) {
                console.warn('Sem permissão para extrair acesso.json externo. Usando o interno.', err.message)
            }
        }
    }

    // Tenta ler o arquivo externo primeiro
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
    } 
    // Fallback garantido para o arquivo interno se falhar a criação ou se estiver em dev
    else if (fs.existsSync(fallbackPath)) {
        const data = fs.readFileSync(fallbackPath, 'utf8')
        return JSON.parse(data)
    }

    return null
  } catch (err) {
    console.error('Erro ao ler acesso.json:', err)
    return null
  }
})

// Inicialização principal
app.whenReady().then(async () => {
  // Verificar/iniciar web-agent
  await startWebAgent()
  
  // Criar janela principal
  createWindow()
})

// Evento quando todas as janelas são fechadas
app.on('window-all-closed', () => {
  cleanupBeforeClose()
  app.quit()
})

// Evento before-quit
app.on('before-quit', () => {
  isClosing = true
  cleanupBeforeClose()
})

// Captura sinais do sistema
process.on('SIGINT', () => {
  isClosing = true
  cleanupBeforeClose()
  app.exit(0)
})

process.on('SIGTERM', () => {
  isClosing = true
  cleanupBeforeClose()
  app.exit(0)
})