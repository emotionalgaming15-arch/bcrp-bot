const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ComponentType,
  ChannelType,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// Config file path
const configPath = path.join(__dirname, '../config/botConfig.json');

// Ensure config directory exists
const configDir = path.dirname(configPath);
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Load existing config or create default
function loadConfig() {
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return {
    modRole: null,
    adminRole: null,
    logChannel: null,
    announcementChannel: null,
    supportChannel: null,
    setupUser: null,
    setupDate: null,
  };
}

// Save config to file
function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Interactive bot configuration with role and channel selection')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    // Check if user is admin
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ You need administrator permissions to use this command.',
        ephemeral: true,
      });
    }

    const config = loadConfig();
    let currentStep = 0;
    const steps = [
      { name: 'Moderator Role', key: 'modRole' },
      { name: 'Admin Role', key: 'adminRole' },
      { name: 'Log Channel', key: 'logChannel' },
      { name: 'Announcement Channel', key: 'announcementChannel' },
      { name: 'Support Channel', key: 'supportChannel' },
    ];

    // Initial embed
    const createSetupEmbed = (step) => {
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🤖 Bot Configuration Setup')
        .setDescription('Configure your bot settings step by step')
        .addFields(
          {
            name: 'Progress',
            value: `${step + 1}/${steps.length} - ${steps[step].name}`,
            inline: false,
          },
          {
            name: 'Current Settings',
            value: formatCurrentSettings(config),
            inline: false,
          }
        )
        .setFooter({ text: 'Use the menus below to select roles and channels' })
        .setTimestamp();

      return embed;
    };

    const formatCurrentSettings = (cfg) => {
      return `
**Moderator Role:** ${cfg.modRole ? `<@&${cfg.modRole}>` : '❌ Not Set'}
**Admin Role:** ${cfg.adminRole ? `<@&${cfg.adminRole}>` : '❌ Not Set'}
**Log Channel:** ${cfg.logChannel ? `<#${cfg.logChannel}>` : '❌ Not Set'}
**Announcement Channel:** ${cfg.announcementChannel ? `<#${cfg.announcementChannel}>` : '❌ Not Set'}
**Support Channel:** ${cfg.supportChannel ? `<#${cfg.supportChannel}>` : '❌ Not Set'}
      `.trim();
    };

    const createActionRow = (step) => {
      if (step < 2) {
        // Role selection for steps 0 and 1
        return new ActionRowBuilder().addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId(`setup_role_${step}`)
            .setPlaceholder(`Select a role for ${steps[step].name}`)
            .setMinValues(1)
            .setMaxValues(1)
        );
      } else {
        // Channel selection for steps 2, 3, and 4
        return new ActionRowBuilder().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId(`setup_channel_${step}`)
            .setPlaceholder(`Select a channel for ${steps[step].name}`)
            .setMinValues(1)
            .setMaxValues(1)
            .addChannelTypes(ChannelType.GuildText)
        );
      }
    };

    const createNavButtons = (step) => {
      const buttons = [];

      if (step > 0) {
        buttons.push(
          new ButtonBuilder()
            .setCustomId('setup_previous')
            .setLabel('← Previous')
            .setStyle(ButtonStyle.Secondary)
        );
      }

      buttons.push(
        new ButtonBuilder()
          .setCustomId('setup_skip')
          .setLabel('Skip')
          .setStyle(ButtonStyle.Secondary)
      );

      if (step < steps.length - 1) {
        buttons.push(
          new ButtonBuilder()
            .setCustomId('setup_next')
            .setLabel('Next →')
            .setStyle(ButtonStyle.Primary)
        );
      } else {
        buttons.push(
          new ButtonBuilder()
            .setCustomId('setup_complete')
            .setLabel('✅ Complete Setup')
            .setStyle(ButtonStyle.Success)
        );
      }

      return new ActionRowBuilder().addComponents(buttons);
    };

    // Initial response
    const response = await interaction.reply({
      embeds: [createSetupEmbed(0)],
      components: [createActionRow(0), createNavButtons(0)],
      fetchReply: true,
    });

    // Collector for interactions
    const collector = response.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 15 * 60 * 1000, // 15 minutes
    });

    collector.on('collect', async (i) => {
      try {
        if (i.isRoleSelectMenu()) {
          // Handle role selection
          const step = parseInt(i.customId.split('_')[2]);
          const selectedRole = i.values[0];
          config[steps[step].key] = selectedRole;

          await i.deferUpdate();
          await response.edit({
            embeds: [createSetupEmbed(step)],
            components: [createActionRow(step), createNavButtons(step)],
          });
        } else if (i.isChannelSelectMenu()) {
          // Handle channel selection
          const step = parseInt(i.customId.split('_')[2]);
          const selectedChannel = i.values[0];
          config[steps[step].key] = selectedChannel;

          await i.deferUpdate();
          await response.edit({
            embeds: [createSetupEmbed(step)],
            components: [createActionRow(step), createNavButtons(step)],
          });
        } else if (i.isButton()) {
          // Handle button interactions
          const buttonId = i.customId;

          if (buttonId === 'setup_previous') {
            if (currentStep > 0) {
              currentStep--;
              await i.deferUpdate();
              await response.edit({
                embeds: [createSetupEmbed(currentStep)],
                components: [createActionRow(currentStep), createNavButtons(currentStep)],
              });
            }
          } else if (buttonId === 'setup_next') {
            if (currentStep < steps.length - 1) {
              currentStep++;
              await i.deferUpdate();
              await response.edit({
                embeds: [createSetupEmbed(currentStep)],
                components: [createActionRow(currentStep), createNavButtons(currentStep)],
              });
            }
          } else if (buttonId === 'setup_skip') {
            if (currentStep < steps.length - 1) {
              currentStep++;
              await i.deferUpdate();
              await response.edit({
                embeds: [createSetupEmbed(currentStep)],
                components: [createActionRow(currentStep), createNavButtons(currentStep)],
              });
            } else {
              await i.deferUpdate();
            }
          } else if (buttonId === 'setup_complete') {
            // Save configuration
            config.setupUser = interaction.user.id;
            config.setupDate = new Date().toISOString();
            saveConfig(config);

            // Create completion embed
            const completionEmbed = new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle('✅ Bot Configuration Complete!')
              .setDescription('Your bot has been successfully configured.')
              .addFields({
                name: 'Final Configuration',
                value: formatCurrentSettings(config),
                inline: false,
              })
              .addFields(
                {
                  name: 'Setup By',
                  value: `<@${config.setupUser}>`,
                  inline: true,
                },
                {
                  name: 'Setup Date',
                  value: new Date(config.setupDate).toLocaleString(),
                  inline: true,
                }
              )
              .setFooter({ text: 'Use /config to view or modify settings' })
              .setTimestamp();

            await i.deferUpdate();
            await response.edit({
              embeds: [completionEmbed],
              components: [],
            });

            collector.stop();
          }
        }
      } catch (error) {
        console.error('Error handling setup interaction:', error);
        if (!i.replied && !i.deferred) {
          await i.reply({
            content: '❌ An error occurred while processing your selection.',
            ephemeral: true,
          });
        }
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        try {
          await response.edit({
            content: '⏰ Setup session timed out. Please run `/setup` again.',
            components: [],
          });
        } catch (error) {
          console.error('Error updating message after timeout:', error);
        }
      }
    });
  },
};
