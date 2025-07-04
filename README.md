# 🤖 Chatbot WhatsApp - Assistente Virtual Automatizado

![WhatsApp Bot](https://img.shields.io/badge/WhatsApp-Bot-green)
![Node.js](https://img.shields.io/badge/Node.js-18+-success)
![License](https://img.shields.io/badge/License-MIT-blue)

Um chatbot inteligente para WhatsApp que oferece atendimento automatizado com sistema de sessões e menu hierárquico.

## 📌 Índice

- [Funcionalidades](#-funcionalidades-principais)
- [Tecnologias](#-tecnologias-utilizadas)
- [Instalação](#-como-executar)
- [Configuração](#-configuração)
- [Uso](#-fluxo-de-atendimento)
- [Estrutura](#-estrutura-do-projeto)
- [Contribuição](#-como-contribuir)
- [Licença](#-licença)

## ✨ Funcionalidades Principais

- Atendimento automatizado por mensagens
- Sistema de sessões por usuário
- Menu interativo com múltiplos níveis
- Autenticação via QR Code web
- Avaliação de atendimento
- Redirecionamento para atendente humano

## 🛠️ Tecnologias Utilizadas

- Node.js v18+
- [Baileys](https://github.com/whiskeysockets/Baileys) (API WhatsApp)
- Express.js
- Pino (logging)
- QRCode Terminal

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- NPM ou Yarn
- Número do WhatsApp válido

### Instalação

```bash
git clone https://github.com/seu-usuario/chatbot-whatsapp.git
cd chatbot-whatsapp
npm install
```

## Configuração

Crie um arquivo .env na raiz:

```bach
env
WHATSAPP_NUMBER=5511999999999
PORT=3000
```

Iniciar o Bot

```bash
npm start
Acesse http://localhost:3000 para escanear o QR Code
```

## 📋 Fluxo de Atendimento

Usuário envia mensagem

Bot coleta informações:

Nome

Tipo de serviço necessário

Detalhes adicionais

Encaminha para atendente ou registra solicitação

## 🏗️ Estrutura do Projeto

```text
.
├── auth/
├── .env.example
├── index.js
└── package.json
```

## 🤝 Como Contribuir

Faça um Fork do projeto

Crie uma Branch (git checkout -b feature/nova-feature)

Commit suas Mudanças (git commit -m 'Add some feature')

Push para a Branch (git push origin feature/nova-feature)

Abra um Pull Request

## 📄 Licença

Distribuído sob licença MIT. Veja LICENSE para mais informações.

## ✉️ Contato

Carlos Welliton - carloswelliton7@gmail.com

Link do Projeto: https://github.com/seu-usuario/chatbot-whats

> **Nota:** Este projeto não é afiliado ao WhatsApp Inc. e deve ser usado em conformidade com os Termos de Serviço do WhatsApp.
