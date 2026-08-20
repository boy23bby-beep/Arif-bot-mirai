const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "duyet", 
  version: "1.0.3",
  hasPermssion: 2,
  credits :" ARIF",
  description: "Approve or manage bot groups/boxes",
  commandCategory: "Admin",
  cooldowns: 5,
  prefix: true
};

const dataPath = path.resolve(__dirname, "../../utils/data/approvedThreads.json");
const dataPendingPath = path.resolve(__dirname, "../../utils/data/pendingThreads.json");

module.exports.handleReply = async function ({ event, api, handleReply }) {
  if (handleReply.author !== event.senderID) return;
  const { body, threadID, messageID } = event;
  let approvedThreads = JSON.parse(fs.readFileSync(dataPath));
  let pendingThreads = JSON.parse(fs.readFileSync(dataPendingPath));

  if (handleReply.type === "pending") {
    if (body.trim().toLowerCase() === "all") {
      approvedThreads = approvedThreads.concat(pendingThreads);
      fs.writeFileSync(dataPath, JSON.stringify(approvedThreads, null, 2));
      fs.writeFileSync(dataPendingPath, JSON.stringify([], null, 2));
      pendingThreads.forEach(id => {
        api.sendMessage("✅ Your group has been approved!\n📝 Enjoy using the bot!", id);
      });
      return api.sendMessage(`✅ Successfully approved all ${pendingThreads.length} groups.`, threadID, messageID);
    }

    const numbers = body.split(" ").map(num => parseInt(num.trim())).filter(num => !isNaN(num));
    let successCount = 0;

    for (let num of numbers) {
      const index = num - 1;
      if (index >= 0 && index < pendingThreads.length) {
        const idBox = pendingThreads[index];
        approvedThreads.push(idBox);
        api.sendMessage("✅ Your group has been approved!\n📝 Enjoy using the bot!", idBox);
        pendingThreads.splice(index, 1);
        successCount++;
      }
    }

    fs.writeFileSync(dataPath, JSON.stringify(approvedThreads, null, 2));
    fs.writeFileSync(dataPendingPath, JSON.stringify(pendingThreads, null, 2));

    return successCount > 0 
      ? api.sendMessage(`✅ Successfully approved ${successCount} group(s).`, threadID, messageID) 
      : api.sendMessage("❎ No groups were approved. Please check the serial numbers.", threadID, messageID);
  } else if (handleReply.type === "remove") {
    const idsToRemove = body.split(" ").map(num => parseInt(num) - 1).filter(index => approvedThreads[index]);
    if (idsToRemove.length) {
      for (const index of idsToRemove) {
        const idBox = approvedThreads[index];
        approvedThreads.splice(index, 1);
        await api.removeUserFromGroup(api.getCurrentUserID(), idBox); // Bot leaves group
      }
      fs.writeFileSync(dataPath, JSON.stringify(approvedThreads, null, 2));
      return api.sendMessage(`✅ Successfully removed boxes:\n${idsToRemove.map(index => approvedThreads[index]).join(", ")}`, threadID, messageID);
    }
    return api.sendMessage("❎ No groups found to remove.", threadID, messageID);
  }
};

module.exports.run = async ({ event, api, args, Threads }) => {
  const { threadID, messageID } = event;
  let approvedThreads = JSON.parse(fs.readFileSync(dataPath));
  let pendingThreads = JSON.parse(fs.readFileSync(dataPendingPath));
  let idBox = args[0] ? args[0] : threadID;

  if (args[0] === "list" || args[0] === "l") {
    let msg = "[ Approved Groups List ]\n";
    for (let [index, id] of approvedThreads.entries()) {
      let name = "Unknown Name";
      try {
        name = (await Threads.getData(id)).threadInfo.name || "Unknown Name";
      } catch (e) {}
      msg += `\n${index + 1}. ${name}\n🧬 ID: ${id}`;
    }
    return api.sendMessage(`${msg}\n\n📌 Reply with the serial number to remove the group.`, threadID, (error, info) => {
      if (!error) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          type: "remove",
        });
      }
    }, messageID);
  }

  if (args[0] === "pending" || args[0] === "p") {
    let msg = `[ Pending Groups List ]\n`;
    for (let [index, id] of pendingThreads.entries()) {
      let threadName = "Unknown Name";
      try {
        threadName = (await Threads.getData(id)).threadInfo.threadName || "Unknown Name";
      } catch (e) {}
      msg += `\n${index + 1}. ${threadName}\n🧬 ID: ${id}`;
    }
    return api.sendMessage(`${msg}\n\n📌 Reply with serial numbers (or 'all') to approve groups.`, threadID, (error, info) => {
      if (!error) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          type: "pending",
        });
      }
    }, messageID);
  }

  if (args[0] === "help" || args[0] === "h") {
    const prefix = (await Threads.getData(String(threadID))).data.PREFIX || global.config.PREFIX;
    return api.sendMessage(`[ Box Approval Manager ]\n\n` +
      `${prefix}${this.config.name} l/list => View approved groups list\n` +
      `${prefix}${this.config.name} p/pending => View pending groups list\n` +
      `${prefix}${this.config.name} d/del [ID] => Remove a group from approved list\n` +
      `${prefix}${this.config.name} [ID] => Approve a specific group ID`, threadID, messageID);
  }

  if (args[0] === "del" || args[0] === "d") {
    idBox = args[1] || threadID;
    if (!approvedThreads.includes(idBox)) {
      return api.sendMessage("❎ This group was not approved previously.", threadID, messageID);
    }
    approvedThreads = approvedThreads.filter(id => id !== idBox);
    fs.writeFileSync(dataPath, JSON.stringify(approvedThreads, null, 2));
    await api.removeUserFromGroup(api.getCurrentUserID(), idBox); // Bot leaves group
    return api.sendMessage(`✅ Group ${idBox} has been removed from the approved list.`, threadID, messageID);
  }

  if (isNaN(parseInt(idBox))) {
    return api.sendMessage("❎ Invalid Group ID!", threadID, messageID);
  }

  if (approvedThreads.includes(idBox)) {
    return api.sendMessage(`❎ Group ${idBox} is already approved.`, threadID, messageID);
  }

  approvedThreads.push(idBox);
  pendingThreads = pendingThreads.filter(id => id !== idBox);
  fs.writeFileSync(dataPath, JSON.stringify(approvedThreads, null, 2));
  fs.writeFileSync(dataPendingPath, JSON.stringify(pendingThreads, null, 2));
  api.sendMessage("✅ Your group has been approved!\n📝 Enjoy using the bot!", idBox);
  return api.sendMessage(`✅ Successfully approved group ${idBox}.`, threadID, messageID);
};
