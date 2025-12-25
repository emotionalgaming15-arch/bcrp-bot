const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Initialize collections for commands, buttons, and select menus
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();

// Error logging utility
const logError = (context, error) => {
  console.error(`[ERROR - ${context}] ${new Date().toISOString()}: ${error.message}`);
  console.error(error.stack);
};

// Load commands from commands directory
const loadCommands = () => {
  const commandsPath = path.join(__dirname, 'commands');
  
  if (!fs.existsSync(commandsPath)) {
    console.warn(`[WARN] Commands directory not found at ${commandsPath}`);
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  if (commandFiles.length === 0) {
    console.warn('[WARN] No command files found in commands directory');
    return;
  }

  for (const file of commandFiles) {
    try {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);

      if (!command.data || !command.execute) {
        console.warn(`[WARN] Command file ${file} does not export data and execute properties`);
        continue;
      }

      client.commands.set(command.data.name, command);
      console.log(`[LOAD] Loaded command: ${command.data.name}`);
    } catch (error) {
      logError(`Loading command ${file}`, error);
    }
  }

  console.log(`[SUCCESS] Loaded ${client.commands.size} command(s)`);
};

// Load buttons from buttons directory
const loadButtons = () => {
  const buttonsPath = path.join(__dirname, 'buttons');
  
  if (!fs.existsSync(buttonsPath)) {
    console.warn(`[WARN] Buttons directory not found at ${buttonsPath}`);
    return;
  }

  const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
  
  if (buttonFiles.length === 0) {
    console.warn('[WARN] No button files found in buttons directory');
    return;
  }

  for (const file of buttonFiles) {
    try {
      const filePath = path.join(buttonsPath, file);
      const button = require(filePath);

      if (!button.data || !button.execute) {
        console.warn(`[WARN] Button file ${file} does not export data and execute properties`);
        continue;
      }

      client.buttons.set(button.data.custom_id, button);
      console.log(`[LOAD] Loaded button: ${button.data.custom_id}`);
    } catch (error) {
      logError(`Loading button ${file}`, error);
    }
  }

  console.log(`[SUCCESS] Loaded ${client.buttons.size} button(s)`);
};

// Load select menus from selectMenus directory
const loadSelectMenus = () => {
  const selectMenusPath = path.join(__dirname, 'selectMenus');
  
  if (!fs.existsSync(selectMenusPath)) {
    console.warn(`[WARN] Select menus directory not found at ${selectMenusPath}`);
    return;
  }

  const selectMenuFiles = fs.readdirSync(selectMenusPath).filter(file => file.endsWith('.js'));
  
  if (selectMenuFiles.length === 0) {
    console.warn('[WARN] No select menu files found in selectMenus directory');
    return;
  }

  for (const file of selectMenuFiles) {
    try {
      const filePath = path.join(selectMenusPath, file);
      const selectMenu = require(filePath);

      if (!selectMenu.data || !selectMenu.execute) {
        console.warn(`[WARN] Select menu file ${file} does not export data and execute properties`);
        continue;
      }

      client.selectMenus.set(selectMenu.data.custom_id, selectMenu);
      console.log(`[LOAD] Loaded select menu: ${selectMenu.data.custom_id}`);
    } catch (error) {
      logError(`Loading select menu ${file}`, error);
    }
  }

  console.log(`[SUCCESS] Loaded ${client.selectMenus.size} select menu(s)`);
};

// Client ready event
client.once('ready', () => {
  console.log(`\n[SUCCESS] Bot logged in as ${client.user.tag}`);
  console.log(`[INFO] Bot is in ${client.guilds.cache.size} guild(s)\n`);
  
  // Load all handlers
  loadCommands();
  loadButtons();
  loadSelectMenus();
});

// Handle slash command interactions
client.on('interactionCreate', async (interaction) => {
  try {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.warn(`[WARN] Command ${interaction.commandName} not found`);
        return;
      }

      try {
        await command.execute(interaction);
        console.log(`[EXECUTE] Command executed: ${interaction.commandName} by ${interaction.user.tag}`);
      } catch (error) {
        logError(`Executing command ${interaction.commandName}`, error);
        
        const errorMessage = {
          content: '❌ There was an error executing this command!',
          ephemeral: true,
        };

        if (interaction.replied) {
          await interaction.followUp(errorMessage);
        } else if (interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId);

      if (!button) {
        console.warn(`[WARN] Button ${interaction.customId} not found`);
        return;
      }

      try {
        await button.execute(interaction);
        console.log(`[EXECUTE] Button clicked: ${interaction.customId} by ${interaction.user.tag}`);
      } catch (error) {
        logError(`Executing button ${interaction.customId}`, error);
        
        const errorMessage = {
          content: '❌ There was an error processing this button!',
          ephemeral: true,
        };

        if (interaction.replied) {
          await interaction.followUp(errorMessage);
        } else if (interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }

    // Handle string select menu interactions
    if (interaction.isStringSelectMenu()) {
      const selectMenu = client.selectMenus.get(interaction.customId);

      if (!selectMenu) {
        console.warn(`[WARN] String select menu ${interaction.customId} not found`);
        return;
      }

      try {
        await selectMenu.execute(interaction);
        console.log(`[EXECUTE] String select menu selected: ${interaction.customId} by ${interaction.user.tag}`);
      } catch (error) {
        logError(`Executing select menu ${interaction.customId}`, error);
        
        const errorMessage = {
          content: '❌ There was an error processing this selection!',
          ephemeral: true,
        };

        if (interaction.replied) {
          await interaction.followUp(errorMessage);
        } else if (interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }

    // Handle role select menu interactions
    if (interaction.isRoleSelectMenu()) {
      const selectMenu = client.selectMenus.get(interaction.customId);

      if (!selectMenu) {
        console.warn(`[WARN] Role select menu ${interaction.customId} not found`);
        return;
      }

      try {
        await selectMenu.execute(interaction);
        console.log(`[EXECUTE] Role select menu selected: ${interaction.customId} by ${interaction.user.tag}`);
      } catch (error) {
        logError(`Executing role select menu ${interaction.customId}`, error);
        
        const errorMessage = {
          content: '❌ There was an error processing this role selection!',
          ephemeral: true,
        };

        if (interaction.replied) {
          await interaction.followUp(errorMessage);
        } else if (interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }

    // Handle channel select menu interactions
    if (interaction.isChannelSelectMenu()) {
      const selectMenu = client.selectMenus.get(interaction.customId);

      if (!selectMenu) {
        console.warn(`[WARN] Channel select menu ${interaction.customId} not found`);
        return;
      }

      try {
        await selectMenu.execute(interaction);
        console.log(`[EXECUTE] Channel select menu selected: ${interaction.customId} by ${interaction.user.tag}`);
      } catch (error) {
        logError(`Executing channel select menu ${interaction.customId}`, error);
        
        const errorMessage = {
          content: '❌ There was an error processing this channel selection!',
          ephemeral: true,
        };

        if (interaction.replied) {
          await interaction.followUp(errorMessage);
        } else if (interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }
  } catch (error) {
    logError('Interaction handler', error);
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  logError('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection', new Error(`Promise rejected: ${reason}`));
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// Export client for potential use in other modules
module.exports = client;
