const { useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const makeWASocket = require("@whiskeysockets/baileys").default;
const P = require("pino");
const QRCode = require("qrcode-terminal");
const {join} = require("path");
const express = require("express");
const app = require(express);
const port = process.env.PORT || 3000;

let latestQr = null;

app;get("/", (req, res)=> {
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
      console.log(`Erro ao enviar mensagem para ${jid}: , err.message`);
  }
}

async function iniciarBot(){
  const botStartTime = Date.now();
  const {state, saveCreds}= await useMultiFileAuthState(join(__dirname,"auth"));
  const sock = makeWASocket({
      auth: state,
      logger: P({level: 'silent'})
  });

  sock.env.on('creds.update', saveCreds);

  sock.env.on('connection.update', async (update) => {
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






}
