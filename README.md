# TOTVS Web App

Aplicação desktop desenvolvida com Electron para consumo de sistemas web da TOTVS, proporcionando maior controle operacional, portabilidade e otimizações de desempenho em ambientes corporativos.

---

## Funcionalidades

### Integração com TOTVS WebAgent

Realiza tentativa automática de comunicação com o TOTVS WebAgent, permitindo execução e integração com recursos locais da máquina.

### Configuração Dinâmica de Ambientes

Permite a alteração de rotas e endereços através do arquivo `acesso.json`, sem necessidade de recompilação da aplicação.

### Otimizações de Desempenho

- Desabilita verificações avançadas de proxy e isolamento quando necessário.
- Mantém o cache exclusivamente em memória, reduzindo problemas de disco e prevenindo erros como:
  ```
  Gpu Cache Creation failed: -2
  ```
- Melhor desempenho em máquinas com recursos limitados.

### Ajuste Inteligente de Zoom

Adapta dinamicamente o nível de zoom da interface conforme a resolução da tela, preservando o layout da aplicação e melhorando a experiência do usuário.

### Personalização com Logo da Empresa

A aplicação permite carregar automaticamente o logotipo da empresa.

Para utilizar essa funcionalidade, basta adicionar um arquivo chamado:

```
logo
```

Com uma das seguintes extensões suportadas:

- `.png`
- `.jpeg`
- `.jpg`
- `.webp`

O arquivo deve estar localizado na raiz da aplicação (mesma pasta do executável no build final).  
Ao iniciar, o sistema identificará automaticamente o arquivo e aplicará o logo na interface.

---

## Pré-requisitos

- Node.js (versão 14 ou superior recomendada)
- TOTVS WebAgent instalado na máquina
- Comunicação ativa via porta configurada no servidor

---

## Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/SeuUsuario/totvs-web-app.git
cd totvs-web-app
```

### 2. Instalar dependências

```bash
npm install
```

---

## Execução em Modo Desenvolvimento

Para executar a aplicação sem gerar o instalador:

```bash
npm start
```

A aplicação tentará se comunicar com o WebAgent instalado localmente.

---

## Compilação para Distribuição

Para gerar o instalador utilizando o electron-builder:

```bash
npm run dist
```

O arquivo `.exe` será gerado no diretório:

```
/dist
```

---

## Configuração de Ambientes – acesso.json

A aplicação utiliza o arquivo `acesso.json` para definição dos ambientes disponíveis.

Durante a compilação, o arquivo é extraído para a raiz da aplicação (ou mesma pasta do executável na versão portátil), permitindo sua edição mesmo após o processo de build.

Exemplo de configuração:

```json
{
  "acessos": [
    {
      "id": 1,
      "nome": "Ambiente de Testes",
      "url": "http://servidor-teste.local/totvs"
    },
    {
      "id": 2,
      "nome": "Produção RH",
      "url": "https://rh.minhaempresa.com.br"
    }
  ]
}
```

---

## Licença

Distribuído sob a licença MIT.

A marca TOTVS e o serviço WebAgent pertencem aos seus respectivos proprietários legais.
