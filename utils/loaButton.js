import { EmbedBuilder } from 'discord.js';

export default {
  name: 'loa',
  async execute(interaction) {
    const customId = interaction.customId;

    if (customId.startsWith('loa_approve_')) {
      const originalEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor('#00ff00')
        .spliceFields(4, 1, { name: 'Status', value: '✅ Approved', inline: true });

      await interaction.update({ embeds: [updatedEmbed], components: [] });
      await interaction.followUp({ content: `✅ LOA request approved by ${interaction.user.tag}.`, ephemeral: false });

    } else if (customId.startsWith('loa_deny_')) {
      const originalEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor('#ff0000')
        .spliceFields(4, 1, { name: 'Status', value: '❌ Denied', inline: true });

      await interaction.update({ embeds: [updatedEmbed], components: [] });
      await interaction.followUp({ content: `❌ LOA request denied by ${interaction.user.tag}.`, ephemeral: false });
    }
  },
};
