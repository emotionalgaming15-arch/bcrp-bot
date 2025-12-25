import { EmbedBuilder } from 'discord.js';

export function createPromotionLogEmbed(issuer, member, oldRank, newRank, reason) {
  return new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('🎖️ Staff Promotion')
    .addFields(
      { name: 'Member', value: `${member.user.tag} (${member.id})`, inline: true },
      { name: 'Issuer', value: `${issuer.user.tag}`, inline: true },
      { name: 'Previous Rank', value: oldRank || 'None', inline: true },
      { name: 'New Rank', value: newRank, inline: true },
      { name: 'Reason', value: reason, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: 'Bounty County Roleplay Staff System' });
}

export function createInfractionLogEmbed(issuer, member, type, details, reason) {
  const colorMap = {
    'Warning': '#ffff00',
    'Suspension': '#ff8800',
    'Demotion': '#ff6600',
    'Termination': '#ff0000',
  };

  return new EmbedBuilder()
    .setColor(colorMap[type] || '#ff0000')
    .setTitle(`⚠️ Staff Infraction - ${type}`)
    .addFields(
      { name: 'Member', value: `${member.user.tag} (${member.id})`, inline: true },
      { name: 'Issuer', value: `${issuer.user.tag}`, inline: true },
      { name: 'Type', value: type, inline: true },
      { name: 'Reason', value: reason, inline: false },
      { name: 'Details', value: JSON.stringify(details, null, 2), inline: false }
    )
    .setTimestamp()
    .setFooter({ text: 'Bounty County Roleplay Staff System' });
}

export function createLoaEmbed(requester, startDate, endDate, reason) {
  return new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('📅 Leave of Absence Request')
    .addFields(
      { name: 'Requester', value: `${requester.user.tag} (${requester.id})`, inline: true },
      { name: 'Start Date', value: startDate, inline: true },
      { name: 'End Date', value: endDate, inline: true },
      { name: 'Reason', value: reason, inline: false },
      { name: 'Status', value: '⏳ Pending Approval', inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Bounty County Roleplay LOA System' });
}

export function createServerStatusEmbed(status, reason, issuedBy) {
  const statusEmojis = {
    'SSU': '🔧',
    'Open': '🟢',
    'Lockdown': '🔴',
    'Closed': '⚫',
    'SST': '⚙️',
  };

  const statusColors = {
    'SSU': '#ff8800',
    'Open': '#00ff00',
    'Lockdown': '#ff0000',
    'Closed': '#000000',
    'SST': '#ffff00',
  };

  return new EmbedBuilder()
    .setColor(statusColors[status] || '#808080')
    .setTitle(`${statusEmojis[status] || '❓'} Server Status Update`)
    .addFields(
      { name: 'Status', value: status, inline: true },
      { name: 'Reason', value: reason, inline: false },
      { name: 'Issued By', value: issuedBy.user.tag, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Bounty County Roleplay' });
}