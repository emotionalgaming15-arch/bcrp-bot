import { SlashCommandBuilder } from 'discord.js';
import { loadConfig, hasPermission } from '../utils/permissions.js';
import { createInfractionLogEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('infraction')
    .setDescription('Issue an infraction to a staff member')
    .addUserOption(option =>
      option.setName('staffmember').setDescription('The staff member to issue infraction to').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of infraction')
        .setRequired(true)
        .addChoices(
          { name: 'Warning', value: 'Warning' },
          { name: 'Suspension', value: 'Suspension' },
          { name: 'Demotion', value: 'Demotion' },
          { name: 'Termination', value: 'Termination' }
        )
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for infraction').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('newrank').setDescription('New rank (required for Demotion)').setRequired(false)
    ),

  async execute(interaction) {
    const config = loadConfig(interaction.guildId);

    if (!config) {
      return interaction.reply({ content: '❌ Guild configuration not found.', ephemeral: true });
    }

    if (!hasPermission(interaction.member, 'infraction', config)) {
      return interaction.reply({ content: '❌ You do not have permission to issue infractions.', ephemeral: true });
    }

    const targetMember = interaction.options.getMember('staffmember');
    const infractionType = interaction.options.getString('type');
    const reason = interaction.options.getString('reason');
    const newRank = interaction.options.getString('newrank');

    if (!targetMember) {
      return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
    }

    if (infractionType === 'Demotion') {
      if (!newRank) {
        return interaction.reply({ content: '❌ Demotion requires a new rank.', ephemeral: true });
      }
      if (!config.staffRanks.includes(newRank)) {
        return interaction.reply({ content: `❌ Invalid rank. Available ranks: ${config.staffRanks.join(', ')}`, ephemeral: true });
      }
    }

    const details = {
      type: infractionType,
      newRank: newRank || 'N/A',
      issuedAt: new Date().toISOString(),
    };

    const logChannelId = config.infractionLogChannel;
    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    if (logChannel) {
      const embed = createInfractionLogEmbed(interaction.member, targetMember, infractionType, details, reason);
      await logChannel.send({ embeds: [embed] });
    }

    if (infractionType === 'Termination') {
      try {
        await targetMember.roles.remove(config.adminRoles.infraction);
        await targetMember.roles.remove(config.adminRoles.promotion);
      } catch (error) {
        console.error('❌ Error removing roles:', error);
      }
    }

    await interaction.reply({
      content: `✅ ${infractionType} infraction issued to ${targetMember.user.tag}.`,
      ephemeral: false,
    });
  },
};