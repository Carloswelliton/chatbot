const { useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const makeWASocket = require("@whiskeysockets/baileys").default;
const P = require("pino");
const QRCode = require("qrcode-terminal");
const {join} = require("path");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

let latestQr = null;

app.get("/", (req, res)=> {
  if(!latestQr){
      return res.send('<h2>QR code ainda não gerado. Aguarde... </h2>');
  }
  res.send(`
      <h1>Escaneie o QR code para conectar</h1>
  <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(latestQr)}&size=300x300" alt="QR Code" />
  <p>Se não conseguir escanear, atualize a página.</p>
  `);
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

const sessions = {};
const OPERADOR_NUMERO = process.env.WHATSAPP_NUMBER;
const bloqueados = new Set();

async function safeSendMessage(sock, jid, message){
  try {
      await sock.sendMessage(jid, message);
  } catch (error) {
      console.log(`Erro ao enviar mensagem para ${jid}: ${error.message}`);
  }
}

async function iniciarBot(){
  const botStartTime = Date.now();
  const {state, saveCreds}= await useMultiFileAuthState(join(__dirname,"auth"));
  const sock = makeWASocket({
      auth: state,
      logger: P({level: 'silent'})
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if(qr){
          latestQr = qr;
          console.log("Escaneie este QR code no whatsApp, (link disponivel na rota /)");
      }

      console.log("Conexão: ", connection);

      if(connection === "open") console.log("Conectado com sucesso");

      if(connection === "close") {
          const statusCode = lastDisconnect?.error?.output?.loggedOut;
          const deveReconectar = statusCode !== DisconnectReason.loggedOut;
          console.log("Conexão perdida", deveReconectar);
          if(deveReconectar) iniciarBot();
      }
  });

  //Conversa iniciada
  sock.ev.on('messages.upsert', async ({messages}) => {
    for(const msg of messages){
      if(msg.messageTimestamp && msg.messageTimestamp*1000 < botStartTime)continue;
      if(!msg.message || msg.key.fromMe)continue;

      const sender = msg.key.remoteJid;
      const textRaw  = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
      const text = textRaw.trim().toLowerCase();

      if(!sessions[sender]){
        sessions[sender] = {
          step: 0,
          name: '',
          serviceCategory: "",
          selectedService: "",
          

        };
        await safeSendMessage(sock, sender, {
          text: `Bem vindo(a) À Veterinária Gold Pet, Como posso te chamar?` 
        });
        continue;
      }

      const s = sessions[sender];

      switch (s.step) {
        case 0:
          s.name = textRaw;
          s.step++;
          await safeSendMessage(sock, sender, {
            text:
              `😊 Muito prazer, ${s.name}! Por favor, digite o número da categoria de atendimento que deseja:\n\n` +
              `1️⃣ Serviços para cães\n` +
              `2️⃣ Serviços para gatos\n` +
              `3️⃣ Produtos\n` +
              `4️⃣ Agendamento\n` +
              `5️⃣ Falar com um atendente`,
          });
          break;
        case 1:
          const clientMsg = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          if(["1", "um", "caes", "cachorro", "servicos para caes"].some(palavra => clientMsg.includes(palavra))){
            s.serviceCategory = 'Cães';
            s.step = 2001; //submenu
            await safeSendMessage(sock, sender, {
              text:
                `🐶 Serviços para Cães:\n\n` +
                `1️⃣ Banho completo\n` +
                `2️⃣ Tosa higiênica\n` +
                `3️⃣ Tosa estética\n` +
                `4️⃣ Banho terapêutico\n` +
                `5️⃣ Voltar`
            });
          }
          else if(["2", "dois", "gatos", "gato", "serviços para gatos", "servicos para gatos","serviços para gatos", "servicos para gatos"].some(palavra=>clientMsg.includes(palavra))){
            s.serviceCategory = "Gatos";
            s.step = 2002; // submenu
            await safeSendMessage(sock, sender, {
              text:
                `🐱 Serviços para Gatos:\n\n` +
                `1️⃣ Banho completo\n` +
                `2️⃣ Tosa higiênica\n` +
                `3️⃣ Tosa estética\n` +
                `4️⃣ Banho terapêutico\n` +
                `5️⃣ Voltar`,
            });
          }
          else if(["3", "produtos", "produtos"].some(palavra => clientMsg.includes(palavra))){
            s.step = 2003;
            await safeSendMessage(sock, sender, {
              text:
                `🛍️ Nossos Produtos:\n\n` +
                `1️⃣ Rações\n` +
                `2️⃣ Brinquedos\n` +
                `3️⃣ Medicamentos\n` +
                `4️⃣ Acessórios\n` +
                `5️⃣ Voltar`,
            });
          }
          else if(["4", "quatro", "agendar", "agendamento", "agendamentos"].some(palavra=>clientMsg.includes(palavra))){
            s.step = 2004;
            await safeSendMessage(sock, sender, {
              text: 
              `📅 Agendamentos:\n\n` +
              `1️⃣ Consulta veterinária\n` +
              `2️⃣ Banho e tosa\n` +
              `3️⃣ Hospedagem\n` +
              `4️⃣ Adestramento\n` +
              `5️⃣ Voltar`
            });
          }
          else if(["5", "cinco", "falar", "atendente", "falar com atendente", "falar com um atendente"].some(palavra => clientMsg.includes(palavra))){
            await handleHumanattendant(sock, sender, s);
            delete sessions[sender];
          }
          else{
            await safeSendMessage(sock, sender, {
              text: 
              `❌ Opção inválida, por favor informe uma opção válida`
            });
          }
          break;    
        case 2001:
          if(text === "1"){
            s.selectedService = "Banho completo para Cães";
            await askServiceDetails(sock, sender, s);
          }
          else if (text === "2") {
            s.selectedService = "Tosa higiênica para Cães";
            await askServiceDetails(sock, sender, s);
          } else if (text === "3") {
            s.selectedService = "Tosa estética para Cães";
            await askServiceDetails(sock, sender, s);
          } else if (text === "4") {
            s.selectedService = "Banho terapêutico para Cães";
            await askServiceDetails(sock, sender, s);
          } else if (text === "5") {
            s.step = 1;
            await showMainMenu(sock, sender, s);
          } else {
            await safeSendMessage(sock, sender, {
              text: "❌ Opção inválida. Por favor, digite um número entre 1 e 5.",
            });
          }
          break;
        case 2002:
          if(text === "1"){
            s.selectedService = "Banho completo para Gatos";
            await askServiceDetails(sock, sender, s);
          }
          else if(text === "2"){
            s.selectedService = "Tosa higiênica para Gatos";
            await askServiceDetails(sock, sender, s);
          }
          else if(text === "3"){
            s.selectedService = "Tosa estética para Gatos";
            await askServiceDetails(sock, sender, s);
          }
          else if(text === "4"){
            s.selectedService = "Banho terapêutico para Gatos";
            await askServiceDetails(sock, sender, s);
          }
          else if(text === "5"){
            s.step = 1;
            await showMainMenu(sock, sender, s);
          }
          else{
            await safeSendMessage(sock, sender, {
              text: '❌ Opção inválida. Por favor, digite um número entre 1 e 5.'
            });
          }
          break;
        case 2003:
          //TODO
          break;
        case 2004:
          //TODO
          break;
      }

      async function askServiceDetails(sock, sender, session){
        session.step = 50;
        await safeSendMessage(sock, sender, {
          text: 
          `ℹ️ Você selecionou: ${session.selectedService}\n\n` +
          `Por favor, informe:\n` +
          `1. Nome do pet\n` +
          `2. Raça\n` +
          `3. Idade\n` +
          `4. Alguma observação especial\n\n` +
          `Envie tudo em uma única mensagem, por exemplo:\n` +
          `"Rex, Labrador, 3 anos, tem medo de secador"`
        });
      }

    }
  });






}

iniciarBot();
