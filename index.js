import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();
client.buttons = new Collection();

// Load commands
const commandsDir = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

console.log(`📁 Loading ${commandFiles.length} command(s)...`);
for (const file of commandFiles) {
  const filePath = path.join(commandsDir, file);
  try {
    const command = await import(`file://${filePath}`);
    if (command.default && command.default.data && command.default.execute) {
      client.commands.set(command.default.data.name, command.default);
      console.log(`  ✅ ${command.default.data.name}`);
    }
  } catch (error) {
    console.error(`  ❌ Error loading ${file}:`, error);
  }
}

// Load button handlers
const utilsDir = path.join(__dirname, 'utils');
const buttonFiles = fs.readdirSync(utilsDir).filter(file => file.endsWith('Button.js'));

console.log(`📁 Loading ${buttonFiles.length} button handler(s)...`);
for (const file of buttonFiles) {
  const filePath = path.join(utilsDir, file);
  try {
    const buttonHandler = await import(`file://${filePath}`);
    if (buttonHandler.default && buttonHandler.default.name && buttonHandler.default.execute) {
      client.buttons.set(buttonHandler.default.name, buttonHandler.default);
      console.log(`  ✅ ${buttonHandler.default.name}`);
    }
  } catch (error) {
    console.error(`  ❌ Error loading ${file}:`, error);
  }
}

client.once('ready', () => {
  console.log(`\n✅ Logged in as ${client.user.tag}`);
  console.log(`🤖 Bot is ready! Serving ${client.guilds.cache.size} guild(s)`);
  console.log(`📊 Loaded ${client.commands.size} command(s) and ${client.buttons.size} button handler(s)\n`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.warn(`⚠️ Unknown command: ${interaction.commandName}`);
        return;
      }
      console.log(`📍 Executing command: /${interaction.commandName}`);
      await command.execute(interaction);
    } else if (interaction.isButton()) {
      const buttonName = interaction.customId.split('_')[0];
      const buttonHandler = client.buttons.get(buttonName);
      if (!buttonHandler) {
        console.warn(`⚠️ Unknown button: ${interaction.customId}`);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ This button is no longer valid.', ephemeral: true });
          }
        } catch (e) {
          console.error('❌ Error replying to button interaction:', e);
        }
        return;
      }
      console.log(`🔘 Handling button: ${interaction.customId}`);
      await buttonHandler.execute(interaction);
    }
  } catch (error) {
    console.error('❌ Error handling interaction:', error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ An error occurred while processing your request.', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
      }
    } catch (replyError) {
      console.error('❌ Error replying to interaction:', replyError);
    }
  }
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Failed to login:', error);
  process.exit(1);
});