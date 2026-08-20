const leaveNoti = require('../../modules/events/leaveNoti.js');

module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");

    return async function ({ event }) {
        const { threadID, logMessageType, logMessageData, author } = event;
        const { setData, getData, delData, createData } = Threads;

        try {
            let threadData = await getData(threadID);
            if (!threadData) {
                logger('গ্রুপের ডাটা বিদ্যমান নেই: ' + threadID, '[ERROR]');
                return;
            }

            let dataThread = threadData.threadInfo || {};
            dataThread.adminIDs = dataThread.adminIDs || [];
            dataThread.participantIDs = dataThread.participantIDs || [];

            switch (logMessageType) {
                case "log:thread-admins": {
                    if (logMessageData.ADMIN_EVENT == "add_admin") {
                        dataThread.adminIDs.push({ id: logMessageData.TARGET_ID });
                        api.sendMessage(`✅ মোট ${dataThread.adminIDs.length} জন অ্যাডমিন আপডেট করা হয়েছে।`, threadID);
                    } else if (logMessageData.ADMIN_EVENT == "remove_admin") {
                        dataThread.adminIDs = dataThread.adminIDs.filter(item => item.id != logMessageData.TARGET_ID);
                        api.sendMessage(`✅ মোট ${dataThread.adminIDs.length} জন অ্যাডমিন আপডেট করা হয়েছে।`, threadID);
                    }
                    logger('গ্রুপের অ্যাডমিন লিস্ট রিফ্রেশ করা হয়েছে: ' + threadID, '[UPDATE DATA]');
                    await setData(threadID, { threadInfo: dataThread });
                    break;
                }
                case "log:thread-name": {
                    logger('গ্রুপের নাম আপডেট করা হয়েছে: ' + threadID, '[UPDATE DATA]');
                    dataThread.threadName = logMessageData.name;
                    await setData(threadID, { threadInfo: dataThread });
                    api.sendMessage(`📝 গ্রুপের নতুন নাম দেওয়া হয়েছে: ${logMessageData.name}`, threadID);
                    break;
                }
                case 'log:unsubscribe': {
                    const userFbId = logMessageData.leftParticipantFbId;
                    if (userFbId == api.getCurrentUserID()) {
                        logger('বট গ্রুপ থেকে রিমুভ হওয়ায় ডাটা মুছে ফেলা হচ্ছে: ' + threadID, '[DELETE DATA THREAD]');
                        const index = global.data.allThreadID?.findIndex(item => item == threadID);
                        if (index > -1) global.data.allThreadID.splice(index, 1);
                        await delData(threadID);
                        return;
                    } else {
                        (await leaveNoti.run({ api, event, Users, Threads }));
                        const participantIndex = dataThread.participantIDs.findIndex(item => item == userFbId);
                        if (participantIndex > -1) dataThread.participantIDs.splice(participantIndex, 1);

                        const adminIndex = dataThread.adminIDs.findIndex(item => item.id == userFbId);
                        if (adminIndex > -1) {
                            dataThread.adminIDs.splice(adminIndex, 1);
                        }

                        logger('ইউজারের ডাটা মুছে ফেলা হয়েছে: ' + userFbId, '[DELETE DATA USER]');
                        await setData(threadID, { threadInfo: dataThread });
                    }
                    break;
                }
            }
        } catch (e) {
            console.error('ডাটা আপডেট করার সময় ত্রুটি দেখা দিয়েছে: ' + e);
        }
        return;
    };
};
