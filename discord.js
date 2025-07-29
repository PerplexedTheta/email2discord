const { EmbedBuilder: EmbedBuilder, WebhookClient: WebhookClient } = require('discord.js');

const discord = class {
    constructor(config) {
        this.config = config;
        this.webhookClient = new WebhookClient({
            url: config.discord.webhookUrl,
        });
    }

    sendMessage = ((args) => {
        const embed = {
            color: 0x5865f2,
            description: args.content,
            title: args.subject,
        };
        const embeds = [embed];
        const files = args.files[0] ? args.files : undefined;

        return this.webhookClient.send({
            username: args.from,
            content: undefined,
            avatarURL: undefined,
            embeds: embeds,
            files: files,
        });
    });
};

// Export this module
// add class Discord as a property
// of module.exports
module.exports = { discord };
