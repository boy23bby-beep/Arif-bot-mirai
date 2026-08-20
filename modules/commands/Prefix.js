module.exports.config = {
    name: "prefix",
    version: "1.0",
    hasPermssion: 0,
    credits: "ARIF",
    description: "Show or change the bot prefix",
    commandCategory: "admin",
    usages: "[new prefix]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const fs = require("fs-extra");
    const path = require("path");
    const configPath = path.join(__dirname, "../../config.json");

    // যদি কোনো নতুন প্রিফিক্স না দেয়, তবে বর্তমান প্রিফিক্স দেখাবে
    if (!args[0]) {
        return api.sendMessage(`🔑 Current prefix: ${global.config.PREFIX}`, threadID, messageID);
    }

    // এডমিন চেক (global.config.ADMINBOT অথবা global.config.NDH চেক করবে)
    const ADMINBOT = global.config.ADMINBOT || [];
    if (!ADMINBOT.includes(senderID)) {
        return api.sendMessage("❌ Only bot admins can change the prefix.", threadID, messageID);
    }

    const newPrefix = args[0].trim();
    global.config.PREFIX = newPrefix;

    try {
        // config.json ফাইলে নতুন প্রিফিক্স সেভ করা
        if (fs.existsSync(configPath)) {
            const configFile = fs.readJsonSync(configPath);
            configFile.PREFIX = newPrefix;
            fs.writeJsonSync(configPath, configFile, { spaces: 2 });
        }

        return api.sendMessage(`✅ Prefix changed to: ${newPrefix}`, threadID, messageID);
    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ Failed to update prefix in config file.", threadID, messageID);
    }
};
