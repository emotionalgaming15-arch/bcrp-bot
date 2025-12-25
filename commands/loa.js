import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { loadConfig } from '../utils/permissions.js';
import { createLoaEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('loa')
    .setDescription('Request a leave of absence')
    .addStringOption(option =>
      option.setName('start').setDescription('Start date (YYYY-MM-DD)').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('end').setDescription('End date (YYYY-MM-DD)').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for leave of absence').setRequired(true)
    ),

  async execute(interaction) {
    const config = loadConfig(interaction.guildId);

    if (!config) {
      return interaction.reply({ content: '❌ Guild configuration not found.', ephemeral: true });
    }

    const startDate = interaction.options.getString('start');
    const endDate = interaction.options.getString('end');
    const reason = interaction.options.getString('reason');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return interaction.reply({ content: '❌ Invalid date format. Use YYYY-MM-DD.', ephemeral: true });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return interaction.reply({ content: '❌ End date must be after start date.', ephemeral: true });
    }

    const loaEmbed = createLoaEmbed(interaction.member, startDate, endDate, reason);

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`loa_approve_${interaction.id}`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`loa_deny_${interaction.id}`)
          .setLabel('Deny')
          .setStyle(ButtonStyle.Danger)
      );

    const logChannelId = config.loaLogChannel;
    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    if (logChannel) {
      const message = await logChannel.send({ embeds: [loaEmbed], components: [row] });
      console.log(`✅ LOA request posted with message ID: ${message.id}`);
    }

    await interaction.reply({
      content: `✅ LOA request submitted. It has been sent to the management team for approval.`,
      ephemeral: true,
    });
  },
};