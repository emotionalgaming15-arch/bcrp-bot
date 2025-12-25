import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, '..', 'config', 'guildConfig.json');

export function loadConfig(guildId = 'default') {
  try {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return configData.guilds[guildId] || configData.guilds.default;
  } catch (error) {
    console.error('❌ Error loading config:', error);
    return null;
  }
}

export function saveConfig(guildConfig, guildId = 'default') {
  try {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    configData.guilds[guildId] = guildConfig;
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving config:', error);
    return false;
  }
}

export function hasPermission(member, action, config) {
  if (!member || !config) return false;

  const requiredRoles = config.adminRoles[action] || [];
  return member.roles.cache.some(role => requiredRoles.includes(role.id));
}

export function getRankIndex(rankName, config) {
  return config.staffRanks.indexOf(rankName);
}

export function isRankHigher(rank1, rank2, config) {
  const index1 = getRankIndex(rank1, config);
  const index2 = getRankIndex(rank2, config);
  return index1 > index2;
}

export function canPromote(issuerRank, targetNewRank, config) {
  const issuerIndex = getRankIndex(issuerRank, config);
  const targetIndex = getRankIndex(targetNewRank, config);
  return issuerIndex > targetIndex;
}