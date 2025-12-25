import { SlashCommandBuilder } from 'discord.js';
import { loadConfig, hasPermission, isRankHigher } from '../utils/permissions.js';
import { createPromotionLogEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Promote a staff member to a higher rank')
    .addUserOption(option =>
      option.setName('staffmember').setDescription('The staff member to promote').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('newrank').setDescription('The new rank for the staff member').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for the promotion').setRequired(true)
    ),

  async execute(interaction) {
    const config = loadConfig(interaction.guildId);

    if (!config) {
      return interaction.reply({ content: '❌ Guild configuration not found.', ephemeral: true });
    }

    if (!hasPermission(interaction.member, 'promotion', config)) {
      return interaction.reply({ content: '❌ You do not have permission to promote staff members.', ephemeral: true });
    }

    const targetMember = interaction.options.getMember('staffmember');
    const newRank = interaction.options.getString('newrank');
    const reason = interaction.options.getString('reason');

    if (!targetMember) {
      return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
    }

    if (!config.staffRanks.includes(newRank)) {
      return interaction.reply({ content: `❌ Invalid rank. Available ranks: ${config.staffRanks.join(', ')}`, ephemeral: true });
    }

    const oldRank = 'Recruit';

    if (!isRankHigher(newRank, oldRank, config)) {
      return interaction.reply({ content: '❌ New rank must be higher than current rank.', ephemeral: true });
    }

    const issuerRank = 'Manager';
    if (!isRankHigher(issuerRank, newRank, config)) {
      return interaction.reply({ content: '❌ You cannot promote to a rank equal to or higher than your own.', ephemeral: true });
    }

    const logChannelId = config.promotionLogChannel;
    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    if (logChannel) {
      const embed = createPromotionLogEmbed(interaction.member, targetMember, oldRank, newRank, reason);
      await logChannel.send({ embeds: [embed] });
    }

    await interaction.reply({
      content: `✅ Successfully promoted ${targetMember.user.tag} to ${newRank}.`,
      ephemeral: false,
    });
  },
};