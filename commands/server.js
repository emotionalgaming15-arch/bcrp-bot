import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { loadConfig, hasPermission } from '../utils/permissions.js';
import { createServerStatusEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Set server status')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Server status')
        .setRequired(true)
        .addChoices(
          { name: 'SSU', value: 'SSU' },
          { name: 'Open', value: 'Open' },
          { name: 'Lockdown', value: 'Lockdown' },
          { name: 'Closed', value: 'Closed' },
          { name: 'SST', value: 'SST' }
        )
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for status change').setRequired(true)
    ),

  async execute(interaction) {
    const config = loadConfig(interaction.guildId);

    if (!config) {
      return interaction.reply({ content: '❌ Guild configuration not found.', ephemeral: true });
    }

    if (!hasPermission(interaction.member, 'serverStatus', config)) {
      return interaction.reply({ content: '❌ You do not have permission to change server status.', ephemeral: true });
    }

    const status = interaction.options.getString('status');
    const reason = interaction.options.getString('reason');

    if (['Lockdown', 'SST'].includes(status)) {
      const confirmRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm_${status}_${interaction.id}`)
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`cancel_${interaction.id}`)
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
        );

      return interaction.reply({
        content: `⚠️ **Confirmation Required**: Set server to **${status}**?\n**Reason**: ${reason}`,
        components: [confirmRow],
        ephemeral: true,
      });
    }

    const embed = createServerStatusEmbed(status, reason, interaction.member);
    const statusChannelId = config.serverStatusChannel;
    const statusChannel = interaction.guild.channels.cache.get(statusChannelId);

    if (statusChannel) {
      await statusChannel.send({ embeds: [embed] });
    }

    await interaction.reply({
      content: `✅ Server status set to **${status}**.`,
      ephemeral: false,
    });
  },
};