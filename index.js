require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { registerCommands } = require('./src/deploy-commands');
const { handleSlashCommand } = require('./src/handlers/slashHandler');
const { handlePrefixCommand } = require('./src/handlers/prefixHandler');
const { createExpressServer } = require('./src/server');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

// Store music queues per guild
client.queues = new Collection();

// Start Express keep-alive server
createExpressServer();

client.once('ready', async () => {
    console.log(`✅ Bot ready! Logged in as ${client.user.tag}`);
    client.user.setActivity('🎵 /play | !play', { type: 'LISTENING' });

    try {
        await registerCommands();
        console.log('✅ Slash commands registered!');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    await handleSlashCommand(client, interaction);
});

// Handle prefix commands (!play, !skip, etc.)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    await handlePrefixCommand(client, message);
});

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error(`❌ Uncaught Exception: ${err.message}`);
});
process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});

client.login(process.env.TOKEN);
