const os = require("os");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

// ড্যাশবোর্ড ইমেজ তৈরি করার ফাংশন
async function createPingDashboard(ping, statusText, memPercentage, usedMem, totalMem, cpuCores, nodeVersion) {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // ব্যাকগ্রাউন্ড গ্রেডিয়েন্ট
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // কার্ড কন্টেইনার বক্স
    ctx.fillStyle = "rgba(30, 41, 59, 0.75)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(40, 40, 720, 340, 20);
    ctx.fill();
    ctx.shadowBlur = 0;

    // বর্ডার গ্লো
    ctx.strokeStyle = ping < 300 ? "#10b981" : ping < 600 ? "#f59e0b" : "#ef4444";
    ctx.lineWidth = 3;
    ctx.stroke();

    // হেডার টেক্সট
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("📊 SYSTEM PING & DIAGNOSTIC DASHBOARD", 80, 100);

    // ডিভাইডার লাইন
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 130);
    ctx.lineTo(720, 130);
    ctx.stroke();

    // লেবেলগুলো
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Response Latency:", 80, 180);
    ctx.fillText("RAM Usage:", 80, 230);
    ctx.fillText("CPU Cores:", 80, 280);
    ctx.fillText("Node.js Version:", 80, 330);

    // ভ্যালুগুলো
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`${ping} ms (${statusText})`, 280, 180);
    ctx.fillText(`${usedMem}MB / ${totalMem}MB (${memPercentage}%)`, 280, 230);
    ctx.fillText(`${cpuCores} Cores`, 280, 280);
    ctx.fillText(`${nodeVersion}`, 280, 330);

    return canvas.toBuffer("image/png");
}

module.exports.config = {
    name: "ping",
    version: "3.2",
    hasPermssion: 0,
    credits: "ARIF",
    description: "Check bot response speed and system status with image dashboard",
    commandCategory: "system",
    usages: "",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    const { threadID, messageID } = event;
    const timeStart = Date.now();

    return api.sendMessage("🏓 Measuring speed and generating dashboard...", threadID, async (err, info) => {
        if (err) return;
        
        const ping = Date.now() - timeStart;

        let statusText = "Excellent";
        if (ping > 600) statusText = "Slow";
        else if (ping > 300) statusText = "Normal";

        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
        const freeMem = (os.freemem() / 1024 / 1024).toFixed(2);
        const usedMem = (totalMem - freeMem).toFixed(2);
        const memPercentage = ((usedMem / totalMem) * 100).toFixed(1);
        const cpuCores = os.cpus().length;
        const nodeVersion = process.version;

        // ইমেজ তৈরি করা
        const imageBuffer = await createPingDashboard(ping, statusText, memPercentage, usedMem, totalMem, cpuCores, nodeVersion);
        
        const cacheDir = path.join(__dirname, 'cache');
        await fs.ensureDir(cacheDir);
        const filePath = path.join(cacheDir, `ping_${Date.now()}.png`);
        await fs.outputFile(filePath, imageBuffer);

        // টেক্সট স্টাইল (আপনার হেলপ মেনুর ডিজাইনের সাথে সামঞ্জস্যপূর্ণ)
        let text = 
            `╔══════════════════╗\n` +
            `║     SYSTEM PING     ║\n` +
            `╚══════════════════╝\n\n` +
            `↪ Latency: ${ping}ms\n` +
            `↪ RAM: ${usedMem}MB (${memPercentage}%)\n` +
            `↪ Status: Operational!`;

        // ছবিসহ মেসেজ পাঠানো এবং পাঠানো শেষ হলে ক্যাশ ফাইল ডিলিট করা
        return api.sendMessage({
            body: text,
            attachment: fs.createReadStream(filePath)
        }, threadID, () => fs.unlinkSync(filePath), info.messageID);

    }, messageID);
};
