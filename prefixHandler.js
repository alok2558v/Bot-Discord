const { EmbedBuilder } = require('discord.js');
const { getOrCreateQueue } = require('../music/queue');

const PREFIX = process.env.PREFIX || '!';

async function handlePrefixCommand(client, message) {
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const voiceChannel = message.member?.voice?.channel;
    const musicCommands = ['play', 'p', 'skip', 's', 'stop', 'pause', 'resume', 'volume', 'vol'];

    if (musicCommands.includes(command) && !voiceChannel) {
        return message.reply('❌ Lazem tkoun fi voice channel!');
    }

    try {
        switch (command) {
            case 'ping': {
                const sent = await message.reply('🏓 Pong!');
                const latency = sent.createdTimestamp - message.createdTimestamp;
                return sent.edit(`🏓 Pong! Latency: **${latency}ms** | API: **${client.ws.ping}ms**`);
            }

            case 'play':
            case 'p': {
                if (!args.length) return message.reply(`❌ Kteb: \`${PREFIX}play <ghaniya aw URL>\``);
                const query = args.join(' ');
                const queue = getOrCreateQueue(client, message.guild.id);

                if (!queue.connection) {
                    await queue.join(voiceChannel, message.channel);
                }

                const song = await queue.addSong(query);
                const embed = new EmbedBuilder()
                    .setColor(0x1DB954)
                    .setTitle('🎵 Zadt lil Queue')
                    .setDescription(`**[${song.title}](${song.url})**`)
                    .addFields(
                        { name: '⏱️ Mudda', value: song.duration, inline: true },
                        { name: '📋 Position', value: `#${queue.songs.length}`, inline: true }
                    )
                    .setThumbnail(song.thumbnail);

                if (!queue.isPlaying && !queue.isPaused) {
                    await queue.playNext();
                    embed.setTitle('▶️ Tet3azef Taw');
                }

                return message.reply({ embeds: [embed] });
            }

            case 'skip':
            case 's': {
                const queue = client.queues.get(message.guild.id);
                if (!queue?.songs.length) return message.reply('❌ Ma kaynash 7aja fil queue!');
                queue.skip();
                return message.reply('⏭️ Skapt!');
            }

            case 'stop': {
                const queue = client.queues.get(message.guild.id);
                if (!queue) return message.reply('❌ Ma kaynash music!');
                queue.stop(message.guild.id);
                client.queues.delete(message.guild.id);
                return message.reply('⏹️ W9afet el music!');
            }

            case 'pause': {
                const queue = client.queues.get(message.guild.id);
                if (!queue?.isPlaying) return message.reply('❌ Ma kaynash music tet3azef!');
                queue.pause();
                return message.reply('⏸️ Pausit!');
            }

            case 'resume': {
                const queue = client.queues.get(message.guild.id);
                if (!queue?.isPaused) return message.reply('❌ El music mawqufa!');
                queue.unpause();
                return message.reply('▶️ Resumit!');
            }

            case 'volume':
            case 'vol': {
                const level = parseInt(args[0]);
                if (isNaN(level) || level < 0 || level > 100)
                    return message.reply(`❌ Kteb: \`${PREFIX}volume <0-100>\``);
                const queue = client.queues.get(message.guild.id);
                if (!queue) return message.reply('❌ Ma kaynash music!');
                queue.setVolume(level);
                return message.reply(`🔊 Volume tba3 **${level}%**`);
            }

            case 'queue':
            case 'q': {
                const queue = client.queues.get(message.guild.id);
                if (!queue?.songs.length) return message.reply('📋 El Queue farigha!');

                const list = queue.songs
                    .slice(0, 10)
                    .map((s, i) => `${i === 0 ? '▶️' : `${i}.`} **${s.title}** (${s.duration})`)
                    .join('\n');

                const embed = new EmbedBuilder()
                    .setColor(0x1DB954)
                    .setTitle('📋 El Queue')
                    .setDescription(list)
                    .setFooter({ text: `${queue.songs.length} ghaniya fel total` });

                return message.reply({ embeds: [embed] });
            }

            case 'np':
            case 'nowplaying': {
                const queue = client.queues.get(message.guild.id);
                if (!queue?.current) return message.reply('❌ Ma kaynash 7aja tet3azef!');

                const embed = new EmbedBuilder()
                    .setColor(0x1DB954)
                    .setTitle('🎶 Tet3azef Taw')
                    .setDescription(`**[${queue.current.title}](${queue.current.url})**`)
                    .addFields({ name: '⏱️ Mudda', value: queue.current.duration })
                    .setThumbnail(queue.current.thumbnail);

                return message.reply({ embeds: [embed] });
            }

            case 'help': {
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('📖 Music Bot Commands')
                    .addFields(
                        { name: '🎵 Music', value: `\`${PREFIX}play <ghaniya>\` - Zid ghaniya\n\`${PREFIX}skip\` - Skip\n\`${PREFIX}stop\` - Waqef\n\`${PREFIX}pause\` - Pause\n\`${PREFIX}resume\` - Resume\n\`${PREFIX}volume <0-100>\` - Badel volume\n\`${PREFIX}queue\` - Chuf queue\n\`${PREFIX}np\` - Tet3azef taw` },
                        { name: '🔧 General', value: `\`${PREFIX}ping\` - Check latency\n\`${PREFIX}help\` - Chuf commands` },
                        { name: '⚡ Slash Commands', value: 'Kol el commands mawjuda b / aydhon!' }
                    );
                return message.reply({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error(`Error in ${PREFIX}${command}:`, error);
        message.reply(`❌ Wqa3 kheta: ${error.message}`);
    }
}

module.exports = { handlePrefixCommand };
