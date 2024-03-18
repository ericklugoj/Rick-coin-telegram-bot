import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import cron from 'node-cron';

import { COMMANDS } from './constants/commands.js';
import {
  COMMANDS_TEXT,
  HELP_TEXT,
  RULES_TEXT,
  WELCOME_TEXT,
} from './constants/copies.js';
import { getCommands } from './utils/getCommands.js';
import { formatCoinInfo } from './utils/formatCoinInfo.js';
import {
  saveBannedUser,
  getBannedUserByFirstName,
} from './utils/bannedUsers.js';
import { getRickCoin } from './services/getRickCoin.js';
import { AUTOMATIC_MESSAGE_DELAY } from './constants/shared.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const infoImagePath = path.resolve(__dirname, './assets/images/info_image.JPG');
const helpImagePath = path.resolve(__dirname, './assets/images/help_image.JPG');
const linksImagePath = path.resolve(
  __dirname,
  './assets/images/links_image.JPG'
);
const rulesImagePath = path.resolve(
  __dirname,
  './assets/images/rules_image.JPG'
);

const bot = new Telegraf(process.env.TELEGRAF_TOKEN);

// Configure all commands to autocomplete in chat
bot.telegram.setMyCommands([
  {
    command: COMMANDS.SHOW_COMMANDS,
    description: 'Lista de todos los comandos',
  },
  {
    command: COMMANDS.RULES,
    description: 'Lista de las reglas del grupo',
  },
  {
    command: COMMANDS.LINK,
    description: 'Lista de los enlaces mas relevantes',
  },
  {
    command: COMMANDS.HELP,
    description: 'Información relevante para los usuarios',
  },
  {
    command: COMMANDS.INFO,
    description: 'Resumen del estado actual de la moneda',
  },
  {
    command: COMMANDS.BAN,
    description: 'Banear a un usuario',
  },
  {
    command: COMMANDS.UNBAN,
    description: 'Quitar baneo de un usuario',
  },
]);

bot.use(Telegraf.admin(session()));

// Listen for messages
bot.on(message('new_chat_members'), (ctx) => {
  const firstName = ctx.from.first_name;
  const userName = ctx.from.username;
  const displayName = userName || firstName;

  ctx.reply(`Hola ${displayName}! ${WELCOME_TEXT}`);
});

// handle all commands
bot.command(
  COMMANDS.SHOW_COMMANDS,
  Telegraf.admin((ctx) => {
    const commands = getCommands({ withSlash: true });
    let commandsListText = '';

    commands.forEach((command) => {
      commandsListText += `\n ${command}`;
    });

    ctx.reply(COMMANDS_TEXT + commandsListText);

    //   ctx.replyWithHTML(
    //     COMMANDS_TEXT,
    //     Markup.keyboard(commands).resize().oneTime()
    //   );
  })
);

bot.command(
  COMMANDS.RULES,
  Telegraf.admin((ctx) => {
    ctx.replyWithPhoto(
      {
        source: rulesImagePath,
      },
      { caption: RULES_TEXT, parse_mode: 'HTML' }
    );
  })
);

bot.command(
  COMMANDS.LINK,
  Telegraf.admin((ctx) => {
    ctx.replyWithPhoto(
      {
        source: linksImagePath,
      },
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Comprar 💰',
                url: 'https://pancakeswap.finance/swap?outputCurrency=0x7552742DFCCc8D0b13463ec93D259A3D87249a2d',
              },
            ],
            [
              {
                text: 'Grafica 📊',
                url: 'https://www.dextools.io/app/en/bnb/pair-explorer/0xa2bd7c1b03a5de5f96e6152d62ed94d8c14d96f9?t=1710249999275',
              },
            ],
            [
              {
                text: 'Contrato 📄',
                url: 'https://bscscan.com/address/0x7552742DFCCc8D0b13463ec93D259A3D87249a2d#code',
              },
              {
                text: 'Auditoria 🔍',
                url: 'https://gopluslabs.io/token-security/56/0x7552742dfccc8d0b13463ec93d259a3d87249a2d',
              },
            ],
            [
              { text: 'Sitio Oficial 🌐', url: 'https://rickcrypto.com/' },
              { text: 'Discord 💬', url: 'https://discord.gg/Tx8PxjHmf4' },
            ],
          ],
        },
      }
    );
  })
);

bot.command(
  COMMANDS.HELP,
  Telegraf.admin((ctx) => {
    ctx.replyWithPhoto(
      {
        source: helpImagePath,
      },
      { caption: HELP_TEXT, parse_mode: 'HTML' }
    );
  })
);

bot.command(
  COMMANDS.INFO,
  Telegraf.admin(async (ctx) => {
    const rickCoin = await getRickCoin();
    const info = formatCoinInfo(rickCoin);

    ctx.replyWithPhoto(
      {
        source: infoImagePath,
      },
      { caption: info, parse_mode: 'HTML' }
    );
  })
);

bot.command(
  COMMANDS.BAN,
  Telegraf.admin(async (ctx) => {
    const userName = ctx.message.reply_to_message.from.username;
    const firstName = ctx.message.reply_to_message.from.first_name;
    const userId = ctx.message.reply_to_message.from.id;
    const chatId = ctx.chat.id;
    const displayName = userName || firstName;

    if (!userId) {
      ctx.reply('Debe hacer reply sobre el usuario a banear');
      return;
    }

    saveBannedUser(ctx.message.reply_to_message.from);

    bot.telegram.banChatMember(chatId, userId);
    ctx.reply(`El usuario @${displayName} ha sido expulsado del grupo`);
  })
);

bot.command(
  COMMANDS.UNBAN,
  Telegraf.admin((ctx) => {
    const [_, firstName] = ctx.message.text.split(' ');
    const chatId = ctx.chat.id;

    if (!firstName) {
      ctx.reply('Comando incorrecto: /unban nombre');
      return;
    }

    const user = getBannedUserByFirstName(firstName);

    if (!user) {
      ctx.reply(
        `No se encontro al usuario @${firstName} en la lista de usuarios baneados`
      );
      return;
    }

    bot.telegram.unbanChatMember(chatId, user.id, { only_if_banned: true });
    ctx.reply(`Se ha quitado el ban del usuario @${firstName}`);
  })
);

// Init the bot
bot
  .launch(console.log('Rick Coin BOT ha iniciado correctamente 🚀'))
  .catch(() => console.error('Ocurrio un error al tratar de iniciar el bot'));

// cron.schedule(AUTOMATIC_MESSAGE_DELAY, async () => {
//   const dateObject = new Date();
//   const hours = dateObject.getHours();
//   const minutes = dateObject.getMinutes();
//   const seconds = dateObject.getSeconds();
//   const formattedCurrentTime = `${hours}:${minutes}:${seconds}`;

//   console.log(`[${formattedCurrentTime}] Enviando mensaje automatico...`);

//   const groupId = '-1002059711560';

//   const rickCoin = await getRickCoin();
//   const info = formatCoinInfo(rickCoin);

//   bot.telegram.sendMessage(groupId, info, {
//     parse_mode: 'html',
//   });
// });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
