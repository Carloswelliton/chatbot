const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const QRCode = require('qrcode-terminal');
const { join } = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let latestQr = null;

app.get('/', (req, res) => {
  if (!latestQr) {
    return res.send('<h2>QR code ainda não gerado. Aguarde...</h2>');
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

async function safeSendMessage(sock, jid, message) {
  try {
    await sock.sendMessage(jid, message);
  } catch (err) {
    console.log(`❌ Erro ao enviar mensagem para ${jid}:, err.message`);
  }
}

async function iniciarBot() {
  const botStartTime = Date.now();
  const { state, saveCreds } = await useMultiFileAuthState(join(__dirname, 'auth'));
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQr = qr; // salva o qr code para a rota web
      console.log('📸 Escaneie este QR code no WhatsApp (link disponível na rota /)');
    }

    console.log('Conexão:', connection);

    if (connection === 'open') console.log('✅ Conectado com sucesso!');

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const deveReconectar = statusCode !== DisconnectReason.loggedOut;
      console.log('🔌 Conexão fechada. Reconectar?', deveReconectar);
      if (deveReconectar) iniciarBot();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (msg.messageTimestamp && msg.messageTimestamp * 1000 < botStartTime) continue;
      if (!msg.message || msg.key.fromMe) continue;

      const sender = msg.key.remoteJid;
      const textRaw = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const text = textRaw.trim().toLowerCase();

      if (!sessions[sender]) {
        sessions[sender] = {
          step: 0,
          name: '',
          gender: '',
          age: 0,
          problem: '',
          when: '',
          improvement: '',
          rating: null,
        };
        await safeSendMessage(sock, sender, {
          text: '🤖 Olá! Eu sou o assistente virtual.\nComo posso te chamar?',
        });
        continue;
      }

      const s = sessions[sender];

      switch (s.step) {
        case 0: // Nome
          s.name = textRaw;
          s.step++;
          await safeSendMessage(sock, sender, {
            text: `😊 Prazer, ${s.name}! Qual atendimento gostaria? Responda com o número:\n\n1️⃣ Banho\n2️⃣ Tosa\n3️⃣ Banho e Tosa\n4️⃣ Pet Shop\n5️⃣ Falar com um atendente`,
          });
          break;

        case 1: // Gênero
          if (['1', '2', '3', '4', '5'].includes(text)) {
            const genders = {
              1: 'Banho',
              2: 'Tosa',
              3: 'Banho e Tosa',
              4: 'Pet Shop',
              5: 'Falar com um atendente',
            };
            s.gender = genders[text];
            s.step++;
            await safeSendMessage(sock, sender, {
              text: '🧮 Qual sua idade? (Digite um número)',
            });
          } else {
            await safeSendMessage(sock, sender, {
              text: '❌ Opção inválida. Por favor, digite um número entre 1 e 5 para seu gênero.',
            });
          }
          break;

        case 2: // Idade
          const idade = parseInt(text);
          if (!isNaN(idade) && idade > 0 && idade < 120) {
            s.age = idade;
            s.step++;
            await safeSendMessage(sock, sender, {
              text: `🎯 Obrigado! Agora selecione uma opção:\n\n1️⃣ Reportar um problema\n2️⃣ Falar com um atendente humano`,
            });
          } else {
            await safeSendMessage(sock, sender, {
              text: '❌ Idade inválida. Por favor, digite um número válido.',
            });
          }
          break;

        case 3: // Menu principal
          if (text === '1') {
            s.step = 4;
            await safeSendMessage(sock, sender, {
              text: '❓ Qual o problema que está enfrentando?',
            });
          } else if (text === '2') {
            await safeSendMessage(sock, sender, {
              text: '👨‍💼 Redirecionando para um atendente humano...',
            });
            try {
              await safeSendMessage(sock, OPERADOR_NUMERO, {
                text: `📲 Novo atendimento:\n• Cliente: ${s.name}\n• Número: ${sender}\n• Gênero: ${s.gender}\n• Idade: ${s.age}`,
              });
            } catch (err) {
              console.log('Erro ao notificar operador:', err.message);
              await safeSendMessage(sock, sender, {
                text: '⚠️ No momento não foi possível conectar com um atendente. Por favor, tente novamente mais tarde.',
              });
            }
            delete sessions[sender];
          } else {
            await safeSendMessage(sock, sender, {
              text: '❌ Opção inválida. Digite 1 ou 2.',
            });
          }
          break;

        case 4: // Descrição do problema
          s.problem = textRaw;
          s.step++;
          await safeSendMessage(sock, sender, {
            text: '📅 Desde quando o problema ocorre?',
          });
          break;

        case 5: // Desde quando
          s.when = textRaw;
          s.step++;
          await safeSendMessage(sock, sender, {
            text: `📝 Resumo:\n• Nome: ${s.name}\n• Gênero: ${s.gender}\n• Idade: ${s.age}\n• Problema: ${s.problem}\n• Desde: ${s.when}\n\n📨 Encaminharemos para o setor responsável.`,
          });
          setTimeout(async () => {
            await safeSendMessage(sock, sender, {
              text: '✅ Atendimento finalizado. De 0 a 10, como você avalia o atendimento? Use números.',
            });
            s.step++;
          }, 10000);
          break;

        case 6: // Avaliação
          const nota = parseInt(text);
          if (!isNaN(nota) && nota >= 0 && nota <= 10) {
            s.rating = nota;
            if (nota >= 8) {
              await safeSendMessage(sock, sender, {
                text: `😄 Obrigado pela ótima avaliação, ${s.name}! Ficamos felizes em ajudar. Tenha um excelente dia!`,
              });
              delete sessions[sender];
            } else if (nota >= 5) {
              await safeSendMessage(sock, sender, {
                text: `🙂 Obrigado pela avaliação, ${s.name}. Estamos sempre buscando melhorar! Tenha um ótimo dia!`,
              });
              delete sessions[sender];
            } else {
              s.step++;
              await safeSendMessage(sock, sender, {
                text: `😞 Que pena que não atingimos suas expectativas. Poderia nos dizer como podemos melhorar?`,
              });
            }
          } else {
            await safeSendMessage(sock, sender, {
              text: '📊 Por favor, envie uma nota válida de 0 a 10.',
            });
          }
          break;

        case 7: // Feedback de melhoria
          s.improvement = textRaw;
          await safeSendMessage(sock, sender, {
            text: `🙏 Obrigado pelo feedback, ${s.name}! Vamos trabalhar para melhorar nosso atendimento.`,
          });
          delete sessions[sender];
          break;

        default:
          await safeSendMessage(sock, sender, {
            text: '🤖 Ocorreu um erro. Vamos reiniciar o atendimento.',
          });
          delete sessions[sender];
          break;
      }
    }
  });
}

iniciarBot();
