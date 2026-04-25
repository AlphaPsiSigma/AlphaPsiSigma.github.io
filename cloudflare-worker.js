// Alpha Psi Sigma — Telegram Bot Webhook (Cloudflare Worker)
// Deploy this on Cloudflare Workers, then set it as your bot's webhook.
//
// Environment variables to set in Cloudflare (Settings → Variables):
//   BOT_TOKEN     — your Telegram bot token
//   ADMIN_CHAT_ID — your personal Telegram chat ID (or group chat ID)

export default {
    async fetch(request, env) {
        // Only accept POST from Telegram
        if (request.method !== 'POST') {
            return new Response('OK', { status: 200 });
        }

        let update;
        try {
            update = await request.json();
        } catch {
            return new Response('Bad Request', { status: 400 });
        }

        const msg = update.message;
        if (!msg) return new Response('OK', { status: 200 });

        const sender   = msg.from || {};
        const name     = [sender.first_name, sender.last_name].filter(Boolean).join(' ') || 'Unknown';
        const username = sender.username ? `@${sender.username}` : 'no username';
        const userId   = sender.id;
        const chatId   = msg.chat.id;
        const text     = msg.text || '(no text)';

        // Skip messages from admin
        if (String(chatId) === String(env.ADMIN_CHAT_ID)) {
            return new Response('OK', { status: 200 });
        }

        const BASE_URL = `https://api.telegram.org/bot${env.BOT_TOKEN}`;

        // 1. Forward message to admin
        const forwardText =
            `📬 *New message via AlphaPsiSigmaBot*\n\n` +
            `👤 *Name:* ${name}\n` +
            `🔗 *Username:* ${username}\n` +
            `🆔 *User ID:* \`${userId}\`\n\n` +
            `💬 *Message:*\n${text}`;

        await fetch(`${BASE_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: env.ADMIN_CHAT_ID,
                text: forwardText,
                parse_mode: 'Markdown'
            })
        });

        // 2. Auto-reply to user
        const replyText =
            `👋 Hi ${name}! Thank you for reaching out to *Alpha Psi Sigma Education Consultancy*.\n\n` +
            `We've received your message and will get back to you shortly. 😊\n\n` +
            `Feel free to visit our website: https://alphapsisigma.github.io`;

        await fetch(`${BASE_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: replyText,
                parse_mode: 'Markdown'
            })
        });

        return new Response('OK', { status: 200 });
    }
};
