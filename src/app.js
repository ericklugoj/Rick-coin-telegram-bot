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
  AUTOMATIC_MESSAGE_TEXT_DELAY,
  AUTOMATIC_MESSAGE_INFO_DELAY,
} from './constants/shared.js';
import { addHoursToDate } from './utils/addHoursToDate.js';
import { isAdmin } from './utils/isAdmin.js';
import { validateMessage } from './utils/validateMessage.js';
import { validateUserName } from './utils/validateUserName.js';

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

// Cache for active automatic messages
const chatsIdWithActiveAutomaticMessage = [];

// Configure all commands to autocomplete in chat
await bot.telegram.setMyCommands([
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
  {
    command: COMMANDS.MUTE_ALL,
    description: 'Silenciar a un usuario',
  },
  {
    command: COMMANDS.UNMUTE_ALL,
    description: 'Quitar silencio de un usuario',
  },
  {
    command: COMMANDS.AUTOMATIC,
    description: 'Activar mensaje automatico',
  },
]);

// Admin session middleware
bot.use(Telegraf.admin(session()));

// Chat filter middleware
bot.use(async (ctx, next) => {
  if (!ctx.from || !ctx.chat || !ctx.text) {
    await next();
    return;
  }

  const isAdminUser = await isAdmin(ctx.chat.id, ctx.from.id, ctx);

  if (ctx.from.is_bot || isAdminUser) {
    await next();
    return;
  }

  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const firstName = ctx.from.first_name;
  const userName = ctx.from.username;
  const displayName = userName || firstName;
  const messageText = ctx.text;

  if (!messageText || !userId) {
    await next();
    return;
  }

  const isValidMessageText = validateMessage(messageText);

  if (!isValidMessageText) {
    await ctx.deleteMessage();
    saveBannedUser(ctx.from);
    await bot.telegram.banChatMember(chatId, userId);
    await ctx.reply(
      `El usuario @${displayName} a sido expulsado por mal comportamiento`
    );
  }

  await next();
});

// Listen for new chat members
bot.on(message('new_chat_members'), async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const firstName = ctx.from.first_name;
  const userName = ctx.from.username;
  const displayName = userName || firstName;

  // avoid reply when new bot join chat
  if (ctx.from.is_bot) return;

  const isValidFirstName = validateUserName(firstName);
  const isValidDisplayName = validateUserName(displayName);

  if (!isValidFirstName || !isValidDisplayName) {
    saveBannedUser(ctx.from);
    await bot.telegram.banChatMember(chatId, userId);
    await ctx.reply(
      `El nuevo usuario @${displayName} ha sido expulsado automaticamente porque se identificó como un bot`
    );

    return;
  }

  await ctx.reply(`Hola @${displayName}! ${WELCOME_TEXT}`);
});

// handle all commands
bot.command(
  COMMANDS.SHOW_COMMANDS,
  Telegraf.admin(async (ctx) => {
    const commands = getCommands({ withSlash: true });
    let commandsListText = '';

    commands.forEach((command) => {
      commandsListText += `\n ${command}`;
    });

    await ctx.reply(COMMANDS_TEXT + commandsListText);

    //   ctx.replyWithHTML(
    //     COMMANDS_TEXT,
    //     Markup.keyboard(commands).resize().oneTime()
    //   );
  })
);

bot.command(
  COMMANDS.RULES,
  Telegraf.admin(async (ctx) => {
    await ctx.replyWithPhoto(
      {
        source: rulesImagePath,
      },
      { caption: RULES_TEXT, parse_mode: 'HTML' }
    );
  })
);

bot.command(
  COMMANDS.LINK,
  Telegraf.admin(async (ctx) => {
    await ctx.replyWithPhoto(
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
  Telegraf.admin(async (ctx) => {
    await ctx.replyWithPhoto(
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

    await ctx.replyWithPhoto(
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
      await ctx.reply('Debe hacer reply sobre el usuario a banear');
      return;
    }

    const isAdminUser = await isAdmin(
      ctx.chat.id,
      ctx.message.reply_to_message.from.id,
      ctx
    );

    // validate if user to ban is admin
    if (isAdminUser) {
      await ctx.reply('No puedo expulsar a un administrador del chat');
      return;
    }

    const userName = ctx.message.reply_to_message.from.username;
    const firstName = ctx.message.reply_to_message.from.first_name;
    const userId = ctx.message.reply_to_message.from.id;
    const chatId = ctx.chat.id;
    const displayName = userName || firstName;

    saveBannedUser(ctx.message.reply_to_message.from);

    await bot.telegram.banChatMember(chatId, userId);
    await ctx.reply(`El usuario @${displayName} ha sido expulsado del grupo`);
  })
);

bot.command(
  COMMANDS.UNBAN,
  Telegraf.admin(async (ctx) => {
    const [, firstName] = ctx.message?.text?.split(' ');
    const chatId = ctx.chat.id;

    if (!firstName) {
      await ctx.reply('Comando incorrecto: /unban nombre');
      return;
    }

    const user = getBannedUserByFirstName(firstName);

    if (!user) {
      await ctx.reply(
        `No se encontro al usuario @${firstName} en la lista de usuarios baneados`
      );
      return;
    }

    const isAdminUser = await isAdmin(chatId, user.id, ctx);

    // validate if user to ban is admin
    if (isAdminUser) {
      await ctx.reply('No puedo quitar el ban a un administrador del chat');
      return;
    }

    await bot.telegram.unbanChatMember(chatId, user.id, {
      only_if_banned: true,
    });
    await ctx.reply(`Se ha quitado el ban del usuario @${firstName}`);
  })
);

bot.command(
  COMMANDS.MUTE,
  Telegraf.admin(async (ctx) => {
    // validate if is not reply message
    if (!ctx.message.reply_to_message?.from?.id) {
      await ctx.reply('Debe hacer reply sobre el usuario a silenciar');
      return;
    }

    const isAdminUser = await isAdmin(
      ctx.chat.id,
      ctx.message.reply_to_message.from.id,
      ctx
    );

    // validate if user to ban is admin
    if (isAdminUser) {
      await ctx.reply('No puedo silenciar a un administrador del chat');
      return;
    }

    const [, timeCommand] = ctx.message?.text?.split(' ');

    if (!timeCommand) {
      await ctx.reply(`Agregue las horas del silencio /${COMMANDS.MUTE} 1h`);
      return;
    }

    const hoursToMute = timeCommand.replace(/\D/g, '');
    const unmuteDate = addHoursToDate(Number(hoursToMute));

    const userName = ctx.message.reply_to_message.from.username;
    const firstName = ctx.message.reply_to_message.from.first_name;
    const userId = ctx.message.reply_to_message.from.id;
    const chatId = ctx.chat.id;
    const displayName = userName || firstName;

    await bot.telegram.restrictChatMember(chatId, userId, {
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false,
      use_independent_chat_permissions: false,
      until_date: unmuteDate,
    });

    await ctx.reply(
      `El usuario @${displayName} ha sido silenciado ${hoursToMute} horas`
    );
  })
);

bot.command(
  COMMANDS.UNMUTE,
  Telegraf.admin(async (ctx) => {
    // validate if is not reply message
    if (!ctx.message.reply_to_message?.from?.id) {
      await ctx.reply('Debe hacer reply sobre el usuario a desmutear');
      return;
    }

    const isAdminUser = await isAdmin(
      ctx.chat.id,
      ctx.message.reply_to_message.from.id,
      ctx
    );

    // validate if user to ban is admin
    if (isAdminUser) {
      await ctx.reply(
        'No puedo quitar el silencio a un administrador del chat'
      );
      return;
    }

    const userName = ctx.message.reply_to_message.from.username;
    const firstName = ctx.message.reply_to_message.from.first_name;
    const userId = ctx.message.reply_to_message.from.id;
    const chatId = ctx.chat.id;
    const displayName = userName || firstName;

    await bot.telegram.restrictChatMember(chatId, userId, {
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true,
      use_independent_chat_permissions: false,
    });

    await ctx.reply(`El usuario @${displayName} ya no esta silenciado`);
  })
);

bot.command(
  COMMANDS.MUTE_ALL,
  Telegraf.admin(async (ctx) => {
    const chatId = ctx.chat.id;

    await bot.telegram.setChatPermissions(chatId, {
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false,
      use_independent_chat_permissions: false,
    });

    await ctx.reply(`Se ha silenciado el chat`);
  })
);

bot.command(
  COMMANDS.UNMUTE_ALL,
  Telegraf.admin(async (ctx) => {
    const chatId = ctx.chat.id;

    await bot.telegram.setChatPermissions(chatId, {
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true,
      use_independent_chat_permissions: false,
    });

    await ctx.reply(`Se ha quitado el silencio del chat`);
  })
);

bot.command(
  'automatic',
  Telegraf.admin(async (ctx) => {
    const chatId = ctx.chat.id;
    const isCurrentlyActive = chatsIdWithActiveAutomaticMessage.some(
      (id) => chatId === id
    );

    if (isCurrentlyActive) {
      await ctx.reply(`Los mensajes automaticos ya se encuentran activados`);
      return;
    }

    chatsIdWithActiveAutomaticMessage.push(chatId);

    const options = {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'America/Mexico_City',
    };

    // Currency info message
    cron.schedule(
      AUTOMATIC_MESSAGE_INFO_DELAY,
      async () => {
        const currentTime = new Intl.DateTimeFormat('en-EN', options).format(
          new Date()
        );

        console.log(
          `[${currentTime}] (COIN INFO): Enviando mensaje automatico...`
        );

        const rickCoin = await getRickCoin();
        const info = formatCoinInfo(rickCoin);

        await bot.telegram.sendMessage(chatId, info, {
          parse_mode: 'html',
        });
      },
      { runOnInit: true }
    );

    // Automatic message 1
    cron.schedule(
      AUTOMATIC_MESSAGE_TEXT_DELAY,
      async () => {
        const currentTime = new Intl.DateTimeFormat('en-EN', options).format(
          new Date()
        );

        console.log(
          `[${currentTime}] (MESSAGE 1): Enviando mensaje automatico...`
        );

        await bot.telegram.sendMessage(chatId, AUTOMATIC_MESSAGE_1, {
          parse_mode: 'html',
        });
      },
      { runOnInit: true }
    );

    // Automatic message 2
    cron.schedule(
      AUTOMATIC_MESSAGE_TEXT_DELAY,
      async () => {
        const currentTime = new Intl.DateTimeFormat('en-EN', options).format(
          new Date()
        );
        console.log(
          `[${currentTime}] (MESSAGE 2): Enviando mensaje automatico...`
        );

        await bot.telegram.sendMessage(chatId, AUTOMATIC_MESSAGE_2, {
          parse_mode: 'html',
        });
      },
      { runOnInit: true }
    );
  })
);

// Init the bot
bot.launch(() => console.log('Rick Coin BOT ha iniciado correctamente 🚀'));

// Catch any error from telegram
bot.catch((e) => {
  const options = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZone: 'America/Mexico_City',
  };
  const currentTime = new Intl.DateTimeFormat('en-EN', options).format(
    new Date()
  );
  console.error(`[${currentTime}] ${e}`);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
