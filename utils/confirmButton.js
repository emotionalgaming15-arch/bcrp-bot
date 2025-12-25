import { createServerStatusEmbed } from './embeds.js';
import { loadConfig } from './permissions.js';

export default {
  name: 'confirm',
  async execute(interaction) {
    const customId = interaction.customId;

    if (customId.startsWith('confirm_')) {
      const parts = customId.split('_');
      const status = parts[1];

      const config = loadConfig(interaction.guildId);
      const reason = '(Confirmed via button)';

      const embed = createServerStatusEmbed(status, reason, interaction.member);
      const statusChannelId = config.serverStatusChannel;
      const statusChannel = interaction.guild.channels.cache.get(statusChannelId);

      if (statusChannel) {
        await statusChannel.send({ embeds: [embed] });
      }

      await interaction.update({
        content: `✅ Server status set to **${status}**.`,
        components: [],
        ephemeral: true,
      });

    } else if (customId.startsWith('cancel_')) {
      await interaction.update({
        content: '❌ Cancelled.',
        components: [],
        ephemeral: true,
      });
    }
  },
};