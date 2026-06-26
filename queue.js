const {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    getVoiceConnection
} = require('@discordjs/voice');
const playdl = require('play-dl');

class MusicQueue {
    constructor() {
        this.songs = [];
        this.player = createAudioPlayer();
        this.connection = null;
        this.volume = 100;
        this.current = null;
        this.textChannel = null;
    }

    async join(voiceChannel, textChannel) {
        this.textChannel = textChannel;
        this.connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        try {
            await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
        } catch {
            this.connection.destroy();
            throw new Error('Ma9dartesh njoin lil voice channel!');
        }

        this.connection.subscribe(this.player);

        this.player.on(AudioPlayerStatus.Idle, () => {
            this.songs.shift();
            if (this.songs.length > 0) {
                this.playNext();
            } else {
                this.current = null;
                this.textChannel?.send('✅ Queue khalsat!');
            }
        });

        this.player.on('error', (error) => {
            console.error('Player error:', error);
            this.songs.shift();
            if (this.songs.length > 0) this.playNext();
        });
    }

    async addSong(query) {
        let songInfo;

        try {
            if (playdl.yt_validate(query) === 'video') {
                const info = await playdl.video_info(query);
                songInfo = {
                    title: info.video_details.title,
                    url: query,
                    duration: formatDuration(info.video_details.durationInSec),
                    thumbnail: info.video_details.thumbnails?.[0]?.url
                };
            } else {
                const results = await playdl.search(query, { limit: 1 });
                if (!results.length) throw new Error('Ma lqitesh ntijet!');
                const video = results[0];
                songInfo = {
                    title: video.title,
                    url: video.url,
                    duration: formatDuration(video.durationInSec),
                    thumbnail: video.thumbnails?.[0]?.url
                };
            }
        } catch (err) {
            throw new Error(`Ma9dartesh nlqa el ghaniya: ${err.message}`);
        }

        this.songs.push(songInfo);
        return songInfo;
    }

    async playNext() {
        if (!this.songs.length) return;

        const song = this.songs[0];
        this.current = song;

        try {
            const stream = await playdl.stream(song.url, { quality: 2 });
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type,
                inlineVolume: true
            });
            resource.volume?.setVolumeLogarithmic(this.volume / 100);
            this.player.play(resource);
        } catch (err) {
            console.error('Stream error:', err);
            this.textChannel?.send(`❌ Kheta fil stream: ${err.message}`);
            this.songs.shift();
            if (this.songs.length > 0) this.playNext();
        }
    }

    skip() {
        this.player.stop();
    }

    stop(guildId) {
        this.songs = [];
        this.current = null;
        this.player.stop();
        const connection = getVoiceConnection(guildId);
        if (connection) connection.destroy();
    }

    pause() {
        return this.player.pause();
    }

    unpause() {
        return this.player.unpause();
    }

    setVolume(level) {
        this.volume = level;
        // Apply to current resource if playing
        if (this.player.state.resource?.volume) {
            this.player.state.resource.volume.setVolumeLogarithmic(level / 100);
        }
    }

    get isPaused() {
        return this.player.state.status === AudioPlayerStatus.Paused;
    }

    get isPlaying() {
        return this.player.state.status === AudioPlayerStatus.Playing;
    }
}

function formatDuration(seconds) {
    if (!seconds) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function getOrCreateQueue(client, guildId) {
    if (!client.queues.has(guildId)) {
        client.queues.set(guildId, new MusicQueue());
    }
    return client.queues.get(guildId);
}

module.exports = { MusicQueue, getOrCreateQueue, formatDuration };
