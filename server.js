const express = require('express');

function createExpressServer() {
    const app = express();
    const port = process.env.PORT || 3000;
    let url = '';
    let requests = 0;
    const startTime = Date.now();

    app.use((req, res, next) => {
        const hostname = req.hostname;
        const parts = hostname.split('.');
        if (parts.length > 1) {
            const subdomain = parts[0];
            const domain = parts.slice(1).join('.');
            url = `https://${subdomain}.${domain}/`;
        }
        next();
    });

    app.get('/', (req, res) => {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        res.json({
            status: '✅ Online',
            uptime: `${uptime}s`,
            requests,
            bot: 'Discord Music Bot'
        });
    });

    app.listen(port, () => {
        console.log(`🌐 Server running on port ${port}`);
    });

    // Keep-alive ping every 14 minutes
    setInterval(async () => {
        if (!url) return;
        try {
            const res = await fetch(url, { method: 'HEAD' });
            requests++;
            console.log(`✅ Keep-alive ping #${requests} - Status: ${res.status}`);
        } catch (error) {
            console.log(`⚠️ Keep-alive failed: ${error.message}`);
        }
    }, 14 * 60 * 1000); // 14 minutes
}

module.exports = { createExpressServer };
