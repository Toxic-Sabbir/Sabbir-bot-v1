'use strict';
export const config = {
    name: 'pay',
    version: '1.0.0',
    role: 0,
    author: ['Sky'],
    viDesc: 'Chuyển tiền cho người khác.',
    enDesc: 'Transfer money to other user.',
    category: ["Tiền bạc", "Economy"],
    usages: "[tag @] [money]",
    timestamp: 5
};

export const languages = {
    "vi_VN": {
        "missingTag": "[ PAY ] Bạn phải tag người cần chuyển tiền",
        "overTagLength": "[ PAY ] Vui lòng chỉ tag một người duy nhất",
        "userNotExist": "[ PAY ] Người dùng bạn cần chuyển không tồn tại trong hệ thống!",
        "invalidInput": "[ PAY ] Số tiền bạn nhập không phù hợp để chuyển",
        "payerNotExist": "[ PAY ] Hiện tại bạn không tồn tại trong hệ thống, vui lòng chờ 5 giây sau đó thử lại",
        "notEnoughMoney": "[ PAY ] Bạn không đủ tiền để thực hiện giao dịch!",
        "paySuccess": "[ PAY ] Đã chuyển thành công %1$ (15% tax) cho người dùng: %2",
        "error": "[ PAY ] Đã xảy ra lỗi không mong muốn trong lúc thực hiện giao dịch"
    },
    "en_US": {
        "missingTag": "[ PAY ] No recipient tagged.",
        "overTagLength": "[ PAY ] You have to tag at no more than one recipient.",
        "userNotExist": "[ PAY ] Invalid recipient(s).",
        "invalidInput": "[ PAY ] Invailid amount.",
        "payerNotExist": "[ PAY ] Please wait 5 seconds to be fully registered as right now you are not a member yet.",
        "notEnoughMoney": "[ PAY ] Insufficient fund. Please check your amount.",
        "paySuccess": "[ PAY ] Successfully transfered %1$ to %2 (15% tax included)",
        "error": "[ PAY ] Unknown error occured, please contact administrator."
    }
}

export async function onMessage({ api, event, Users, args, getText }) {
    const { threadID, messageID, senderID } = event;
    var targetID = String(args[1]);
    var moneyPay = (args.slice(2, args.length)).join(" ") || 0;

    if (event.type == "message_reply") {
        const mention = event.messageReply.senderID;
        var name = (await Users.getData(mention)).name;
        if (!isNaN(args[0])) {
            const money = parseInt(args[0]);
            let balance = (await Users.getData(senderID)).money;
            if (money <= 0) return api.sendMessage(getText("missingTag"), threadID, messageID);
            if (money > balance) return api.sendMessage(getText("notEnoughMoney"), threadID, messageID);
            else {
                return api.sendMessage({ body: getText("paySuccess", `${name}`, `${args[0]}`) }, threadID, async() => {
                    await Users.setData(mention, { money: money + parseInt(moneyPay) });
                    await Users.setData(senderID, { money: money - parseInt(moneyPay) });
                }, messageID);
            }
        } else return api.sendMessage(getText('invalidInput'), threadID, messageID);
    }

    if (isNaN(targetID)) {
        const mention = Object.keys(event.mentions);
        if (mention.length == 0) return api.sendMessage(getText("missingTag"), threadID, messageID);
        if (mention.length > 1) return api.sendMessage(getText("overTagLength"), threadID, messageID);
        args = args.join(" ");
        targetID = String(mention[0]);
        moneyPay = (args.slice(args.indexOf(event.mentions[mention[0]]) + (event.mentions[mention[0]] || "").length + 1, args.length)) || null;
    }

    if (!global.data.allUserID.includes(targetID)) return api.sendMessage(getText("userNotExist"), threadID, messageID);

    if (isNaN(moneyPay) && moneyPay < 1) return api.sendMessage(getText("invalidInput"), threadID, messageID);
    const taxed = (parseInt(moneyPay) * 15) / 100;

    try {
        const moneyPayer = (await getData(senderID)).money;
        if (!moneyPayer) return api.sendMessage(getText("payerNotExist"), threadID, messageID);
        if (moneyPayer < moneyPay) return api.sendMessage(getText("notEnoughMoney"), threadID, messageID);
        const nameTarget = (await Users.getData(targetID)).name;
        await Users.setData(senderID, { money: money - parseInt(moneyPay) });
        await Users.setData(targetID, { money: money + parseInt(moneyPay) });
        return api.sendMessage(getText("paySuccess", (parseInt(moneyPay) - taxed), `${targetID} - ${nameTarget}`), threadID, messageID);
    } catch { return api.sendMessage(getText("error"), threadID, messageID) }
}