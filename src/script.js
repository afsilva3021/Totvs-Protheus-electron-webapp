document.addEventListener('DOMContentLoaded', async () => {
    try {
        const ambientes = await window.electronAPI.getAcessoData()
        const select = document.getElementById('ambientes')
        
        if (ambientes && select) {
            select.innerHTML = '' // Limpa as opções atuais
            
            // Adiciona opções dinamicamente do acesso.json
            for (const key in ambientes) {
                const urlObj = ambientes[key]
                if (urlObj && urlObj.url) {
                    const option = document.createElement('option')
                    option.value = key
                    // Capitaliza a primeira letra para ficar legível
                    option.textContent = key.charAt(0).toUpperCase() + key.slice(1)
                    select.appendChild(option)
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar os ambientes:', error)
    }
}
)

async function getEnv() {
    const btn = document.getElementById('btnEntrar');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<div class="spinner-border text-primary" role="status">
  <span class="visually-hidden">Loading...</span>
</div>`;
    }

    try {
        const ambientes = await window.electronAPI.getAcessoData()
        const valorSelecionado = document.getElementById('ambientes').value
        
        if (ambientes && ambientes[valorSelecionado] && ambientes[valorSelecionado].url) {
            const url = ambientes[valorSelecionado].url
            window.electronAPI.setAppUrl(url)
        } else {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Entrar';
            }
        }
    } catch (error) {
        console.error('Erro ao acessar url:', error);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Entrar';
        }
    }
}
