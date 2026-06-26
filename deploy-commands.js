const { REST, Routes } = require('discord.js');

const commands = [
    {
        name: 'play',
        description: '🎵 Zid ghaniya lil queue (YouTube)',
        options: [{
            name: 'song',
            description: 'Esm el ghaniya aw URL',
            type: 3, // STRING
            required: true
        }]
    },
    {
        name: 'skip',
        description: '⏭️ Skip lil ghaniya eli jaya'
    },
    {
        name: 'stop',
        description: '⏹️ Waqef el music w 5roj mel voice channel'
    },
    {
        name: 'pause',
        description: '⏸️ Pause el music'
    },
    {
        name: 'resume',
        description: '▶️ Resume el music'
    },
    {
        name: 'queue',
        description: '📋 Chuf el queue mte3ek'
    },
    {
        name: 'nowplaying',
        description: '🎶 Chuf el ghaniya eli tet3azef taw'
    },
    {
        name: 'volume',
        description: '🔊 Badel el volume (0-100)',
        options: [{
            name: 'level',
            description: 'Level mte3 el volume (0-100)',
            type: 4, // INTEGER
            required: true,
            min_value: 0,
            max_value: 100
        }]
    },
    {
        name: 'ping',
        description: '🏓 Check bot latency'
    }
];

async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(
        Routes.applicationCommands(process.env.APPLICATION_ID),
        { body: commands }
    );
}

module.exports = { registerCommands, commands };
