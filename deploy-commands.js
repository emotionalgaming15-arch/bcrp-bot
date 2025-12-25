import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error('❌ Missing environment variables: DISCORD_TOKEN, CLIENT_ID, or GUILD_ID');
  process.exit(1);
}

const commands = [];
const commandsDir = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsDir, file);
  const command = await import(`file://${filePath}`);
  if (command.default && command.default.data) {
    commands.push(command.default.data.toJSON());
    console.log(`✅ Loaded command: ${command.default.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`🔄 Registering ${commands.length} command(s)...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log(`✅ Successfully registered ${data.length} command(s)`);
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
    process.exit(1);
  }
})();
