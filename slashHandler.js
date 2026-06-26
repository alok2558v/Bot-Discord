const { EmbedBuilder } = require('discord.js');
const { getOrCreateQueue } = require('../music/queue');

async function handleSlashCommand(client, interaction) {
    const { commandName, member, guild, channel } = interaction;

    const voiceChannel = member?.voice?.channel;

    // Commands that need voice channel
    const musicCommands = ['play', 'skip', 'stop', 'pause', 'resume', 'volume'];
    if (musicCommands.includes(commandName) && !voiceChannel) {
        return interaction.reply({ content: '❌ Lazem tkoun fi voice channel!', ephemeral: true });
    }

    await interaction.deferReply();

    try {
        switch (commandName) {
            case 'ping': {
                const latency = Date.now() - interaction.createdTimestamp;
                return interaction.editReply(`🏓 Pong! Latency: **${latency}ms** | API: **${client.ws.ping}ms**`);
            }

            case 'play': {
                const query = interaction.options.getString('song');
                const queue = getOrCreateQueue(client, guild.id);

                if (!queue.connection) {
                    await queue.join(voiceChannel, channel);
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

                return interaction.editReply({ embeds: [embed] });
            }

            case 'skip': {
                const queue = client.queues.get(guild.id);
                if (!queue?.songs.length) return interaction.editReply('❌ Ma kaynash 7aja fil queue!');
                queue.skip();
                return interaction.editReply('⏭️ Skapt!');
            }

            case 'stop': {
                const queue = client.queues.get(guild.id);
                if (!queue) return interaction.editReply('❌ Ma kaynash music!');
                queue.stop(guild.id);
                client.queues.delete(guild.id);
                return interaction.editReply('⏹️ W9afet el music w 5rajt!');
            }

            case 'pause': {
                const queue = client.queues.get(guild.id);
                if (!queue?.isPlaying) return interaction.editReply('❌ Ma kaynash music tet3azef!');
                queue.pause();
                return interaction.editReply('⏸️ Pausit el music!');
            }

            case 'resume': {
                const queue = client.queues.get(guild.id);
                if (!queue?.isPaused) return interaction.editReply('❌ El music mawqufa!');
                queue.unpause();
                return interaction.editReply('▶️ Resumit el music!');
            }

            case 'volume': {
                const level = interaction.options.getInteger('level');
                const queue = client.queues.get(guild.id);
                if (!queue) return interaction.editReply('❌ Ma kaynash music!');
                queue.setVolume(level);
                return interaction.editReply(`🔊 Volume tba3 **${level}%**`);
            }

            case 'queue': {
                const queue = client.queues.get(guild.id);
                if (!queue?.songs.length) return interaction.editReply('📋 El Queue farigha!');

                const list = queue.songs
                    .slice(0, 10)
                    .map((s, i) => `${i === 0 ? '▶️' : `${i}.`} **${s.title}** (${s.duration})`)
                    .join('\n');

                const embed = new EmbedBuilder()
                    .setColor(0x1DB954)
                    .setTitle('📋 El Queue')
                    .setDescription(list)
                    .setFooter({ text: `${queue.songs.length} ghaniya fel total` });

                return interaction.editReply({ embeds: [embed] });
            }

            case 'nowplaying': {
                const queue = client.queues.get(guild.id);
                if (!queue?.current) return interaction.editReply('❌ Ma kaynash 7aja tet3azef!');

                const embed = new EmbedBuilder()
                    .setColor(0x1DB954)
                    .setTitle('🎶 Tet3azef Taw')
                    .setDescription(`**[${queue.current.title}](${queue.current.url})**`)
                    .addFields({ name: '⏱️ Mudda', value: queue.current.duration, inline: true })
                    .setThumbnail(queue.current.thumbnail);

                return interaction.editReply({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error(`Error in /${commandName}:`, error);
        const msg = `❌ Wqa3 kheta: ${error.message}`;
        if (interaction.deferred) interaction.editReply(msg);
        else interaction.reply({ content: msg, ephemeral: true });
    }
}

module.exports = { handleSlashCommand };
