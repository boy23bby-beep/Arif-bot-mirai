module.exports.config = {
    name: "help",
    version: "1.0",
    hasPermssion: 0,
    credits: "ARIF",
    description: "Show all commands or info about a command",
    commandCategory: "info",
    usages: "[command name]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const commands = global.client.commands;
    const pfx = global.config.PREFIX;

    if (args[0]) {
        const name = args[0].toLowerCase();
        const cmd = commands.get(name);
        
        if (!cmd) return api.sendMessage(`❌ Command "${name}" not found.`, threadID, messageID);
        
        const c = cmd.config;
        const permissionText = c.hasPermssion === 2 ? "Admin Bot" : c.hasPermssion === 1 ? "Group Admin" : "Everyone";
        
        return api.sendMessage(
            `📌 Command: ${pfx}${c.name}\n` +
            `📝 Description: ${c.description || "N/A"}\n` +
            `📂 Category: ${c.commandCategory || "N/A"}\n` +
            `👑 Permission: ${permissionText}\n` +
            `⏱ Cooldown: ${c.cooldowns || 5}s\n` +
            `📖 Usage: ${pfx}${c.name} ${c.usages || ""}`,
            threadID, messageID
        );
    }

    const categories = {};
    for (const [name, cmd] of commands) {
        const cat = cmd.config.commandCategory || "other";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(cmd.config.name);
    }

    let text = `╔══════════════════╗\n║   ARIF BOT MENU   ║\n╚══════════════════╝\n\n`;
    text += `Prefix: ${pfx} | Total: ${commands.size} commands\n\n`;
    
    for (const [cat, cmds] of Object.entries(categories).sort()) {
        text += `━━━ ${cat.toUpperCase()} ━━━\n`;
        text += cmds.map(n => `↪ ${n}`).join("\n") + "\n\n";
    }
    
    text += `Type ${pfx}help <command> for details.`;
    return api.sendMessage(text, threadID, messageID);
};
