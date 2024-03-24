import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import cron from 'node-cron';

import { COMMANDS } from './constants/commands.js';
import {
  AUTOMATIC_MESSAGE_1,
  AUTOMATIC_MESSAGE_2,
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
import {
  AUTOMATIC_MESSAGE_1_DELAY,
  AUTOMATIC_MESSAGE_2_DELAY,
  AUTOMATIC_MESSAGE_INFO_DELAY,
} from './constants/shared.js';
import { addHoursToDate } from './utils/addHoursToDate.js';
import { isAdmin } from './utils/isAdmin.js';

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

const chatsIdWithActiveAutomaticMessage = [];

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
  {
    command: COMMANDS.MUTE,
    description: 'Silenciar a un usuario',
  },
  {
    command: COMMANDS.UNMUTE,
    description: 'Quitar silencio de un usuario',
  },
  // {
  //   command: COMMANDS.AUTOMATIC,
  //   description: 'Activar/desactivar mensaje automatico',
  // },
]);

bot.use(Telegraf.admin(session()));

// Listen for messages
bot.on(message('new_chat_members'), (ctx) => {
  const firstName = ctx.from.first_name;
  const userName = ctx.from.username;
  const displayName = userName || firstName;

  // avoid reply when new bot join chat
  if (ctx.from.is_bot) return;

  ctx.reply(`Hola @${displayName}! ${WELCOME_TEXT}`);
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
    // validate if is not reply message
    if (!ctx.message.reply_to_message?.from?.id) {
      ctx.reply('Debe hacer reply sobre el usuario a banear');
      return;
    }

    const isAdminUser = await isAdmin(
      ctx.chat.id,
      ctx.message.reply_to_message.from.id,
      ctx
    );

    // validate if user to ban is admin
    if (isAdminUser) {
      ctx.reply('No puedo expulsar a un administrador del chat');
      return;
    }

    const userName = ctx.message.reply_to_message.from.username;
    const firstName = ctx.message.reply_to_message.from.first_name;
    const userId = ctx.message.reply_to_message.from.id;
    const chatId = ctx.chat.id;
    const displayName = userName || firstName;

    saveBannedUser(ctx.message.reply_to_message.from);

    bot.telegram.banChatMember(chatId, userId);
    ctx.reply(`El usuario @${displayName} ha sido expulsado del grupo`);
  })
);

bot.command(
  COMMANDS.UNBAN,
  Telegraf.admin(async (ctx) => {
    const [, firstName] = ctx.message.text.split(' ');
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

    const isAdminUser = await isAdmin(chatId, user.id, ctx);

    // validate if user to ban is admin
    if (isAdminUser) {
      ctx.reply('No puedo quitar el ban a un administrador del chat');
      return;
    }

    bot.telegram.unbanChatMember(chatId, user.id, { only_if_banned: true });
    ctx.reply(`Se ha quitado el ban del usuario @${firstName}`);
  })
);

bot.command(
  COMMANDS.MUTE,
  Telegraf.admin(async (ctx) => {
    // validate if is not reply message
    if (!ctx.message.reply_to_message?.from?.id) {
      ctx.reply('Debe hacer reply sobre el usuario a silenciar');
      return;
    }

    const isAdminUser = await isAdmin(
      ctx.chat.id,
      ctx.message.reply_to_message.from.id,
      ctx
    );

    // validate if user to ban is admin
    if (isAdminUser) {
      ctx.reply('No puedo silenciar a un administrador del chat');
      return;
    }

    const [, timeCommand] = ctx.message.text.split(' ');

    if (!timeCommand) {
      ctx.reply(`Agregue las horas del silencio /${COMMANDS.MUTE} 1h`);
      return;
    }

    const hoursToMute = timeCommand.replace(/\D/g, '');
    const unmuteDate = addHoursToDate(Number(hoursToMute));

    const userName = ctx.message.reply_to_message.from.username;
    const firstName = ctx.message.reply_to_message.from.first_name;
    const userId = ctx.message.reply_to_message.from.id;
    const chatId = ctx.chat.id;
    const displayName = userName || firstName;

    bot.telegram.restrictChatMember(chatId, userId, {
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false,
      use_independent_chat_permissions: false,
      until_date: unmuteDate,
    });

    ctx.reply(
      `El usuario @${displayName} ha sido silenciado ${hoursToMute} horas`
    );
  })
);

bot.command(
  COMMANDS.UNMUTE,
  Telegraf.admin(async (ctx) => {
    // validate if is not reply message
    if (!ctx.message.reply_to_message?.from?.id) {
      ctx.reply('Debe hacer reply sobre el usuario a desmutear');
      return;
    }

    const isAdminUser = await isAdmin(
      ctx.chat.id,
      ctx.message.reply_to_message.from.id,
      ctx
    );

    // validate if user to ban is admin
    if (isAdminUser) {
      ctx.reply('No puedo quitar el silencio a un administrador del chat');
      return;
    }

    const userName = ctx.message.reply_to_message.from.username;
    const firstName = ctx.message.reply_to_message.from.first_name;
    const userId = ctx.message.reply_to_message.from.id;
    const chatId = ctx.chat.id;
    const displayName = userName || firstName;

    bot.telegram.restrictChatMember(chatId, userId, {
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true,
      use_independent_chat_permissions: false,
    });

    ctx.reply(`El usuario @${displayName} ya no esta silenciado`);
  })
);

//TODO: create command to mute all chat
// bot.telegram.setChatPermissions("",{can_send_messages})

bot.command(
  'automatic',
  Telegraf.admin(async (ctx) => {
    const chatId = ctx.chat.id;
    const isCurrentlyActive = chatsIdWithActiveAutomaticMessage.some(
      (id) => chatId === id
    );

    if (isCurrentlyActive) {
      ctx.reply(`Los mensajes automaticos ya se encuentran activados`);
      return;
    }

    chatsIdWithActiveAutomaticMessage.push(chatId);

    const options = {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'America/Mexico_City',
    };
    const currentTime = new Intl.DateTimeFormat('en-EN', options).format(
      new Date()
    );

    // Currency info message
    cron.schedule(
      AUTOMATIC_MESSAGE_INFO_DELAY,
      async () => {
        console.log(
          `[${currentTime}] (COIN INFO): Enviando mensaje automatico...`
        );

        const rickCoin = await getRickCoin();
        const info = formatCoinInfo(rickCoin);

        bot.telegram.sendMessage(chatId, info, {
          parse_mode: 'html',
        });
      },
      { runOnInit: true }
    );

    // Automatic message 1
    cron.schedule(
      AUTOMATIC_MESSAGE_1_DELAY,
      async () => {
        console.log(
          `[${currentTime}] (MESSAGE 1): Enviando mensaje automatico...`
        );

        bot.telegram.sendMessage(chatId, AUTOMATIC_MESSAGE_1, {
          parse_mode: 'html',
        });
      },
      { runOnInit: true }
    );

    // Automatic message 2
    cron.schedule(
      AUTOMATIC_MESSAGE_2_DELAY,
      async () => {
        console.log(
          `[${currentTime}] (MESSAGE 2): Enviando mensaje automatico...`
        );

        bot.telegram.sendMessage(chatId, AUTOMATIC_MESSAGE_2, {
          parse_mode: 'html',
        });
      },
      { runOnInit: true }
    );
  })
);

// Init the bot
bot
  .launch(() => console.log('Rick Coin BOT ha iniciado correctamente 🚀'))
  .catch(() => console.error('Ocurrio un error al tratar de iniciar el bot'));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
