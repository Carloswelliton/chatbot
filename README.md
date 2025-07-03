📱 Chatbot WhatsApp - Assistente Virtual Automatizado
![whatsApp](https://img.shields.io/badge/WhatsApp-Bot-green)
![NodeJS]https://img.shields.io/badge/Node.js-18+-success 
![MIT]https://img.shields.io/badge/License-MIT-blue

Um chatbot inteligente para WhatsApp que oferece atendimento automatizado com sistema de sessões, menu hierárquico e integração web para autenticação via QR Code.

✨ Funcionalidades Principais
Atendimento Automatizado com fluxo conversacional

Sistema de Sessões para acompanhamento de cada usuário

Menu Hierárquico com múltiplos níveis de navegação

Web Interface para autenticação via QR Code

Avaliação de Atendimento com feedback

Redirecionamento para atendente humano quando necessário

🛠️ Tecnologias Utilizadas
Baileys - Biblioteca WhatsApp Web API

Express.js - Servidor web para QR Code

Pino - Logging estruturado

Jest - Testes unitários

ESLint + Prettier - Padronização de código

🚀 Como Executar
Pré-requisitos
Node.js 18+

NPM 9+

WhatsApp Business ou número de telefone válido

Instalação
Clone o repositório:

bash
git clone https://github.com/seu-usuario/chatbot-whatsapp.git
cd chatbot-whatsapp
Instale as dependências:

bash
npm install
Crie um arquivo .env na raiz do projeto:

env
WHATSAPP_NUMBER=5511999999999
PORT=3000
Executando o Bot
Para desenvolvimento (com reinício automático):

bash
npm run dev
Para produção:

bash
npm start
Acesse o QR Code em: http://localhost:3000

📋 Fluxo de Atendimento
Boas-vindas e coleta do nome

Menu Principal com categorias de serviços

Submenus específicos para cada tipo de serviço

Coleta de informações detalhadas

Confirmação e encaminhamento

Avaliação do atendimento

🧩 Estrutura do Projeto
text
chatbot-whatsapp/
├── auth/                  # Dados de autenticação
├── node_modules/
├── src/
│   ├── handlers/          # Manipuladores de mensagens
│   ├── services/          # Lógica de negócios
│   ├── utils/             # Utilitários
│   └── index.js           # Ponto de entrada
├── .env.example           # Modelo de variáveis de ambiente
├── .eslintrc.js           # Configuração ESLint
├── .gitignore
├── package.json
└── README.md
🤝 Como Contribuir
Faça um fork do projeto

Crie uma branch (git checkout -b feature/nova-feature)

Commit suas alterações (git commit -m 'Adiciona nova feature')

Push para a branch (git push origin feature/nova-feature)

Abra um Pull Request

📄 Licença
Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

📧 Contato
Seu Nome - @seu_twitter - seu.email@exemplo.com

Link do Projeto: https://github.com/seu-usuario/chatbot-whatsapp

Nota: Este projeto não é afiliado ao WhatsApp Inc. e deve ser usado em conformidade com os Termos de Serviço do WhatsApp.