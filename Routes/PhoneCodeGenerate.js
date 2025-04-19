import api from "../Modules/Api.js";
import { generateDigits } from "../Modules/Crypto.js";
import Database from "../Modules/Database.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Constants from "../Utils/Constants.js";
import { sendWhatsAppMessage } from "../Modules/Twilio.js";
import { validatePhone } from "../Modules/DataValidation.js";
import { formatBodyForVerifyPhoneCode } from "../Modules/TrackerNotificationsTextFormatter.js";
import { convertMillisecondsToText } from "../Utils/TextFormatter.js";

const { verifyPhoneCodeLength, codeExpirationTime } = Constants;

api.post("/phone/code/generate", async function (req, res) {
    const jwt = verifyAuthJwt(extractJwt(req.cookies));

    if (!jwt) {
        res.status(401).json({ data: null, msg: "Unauthorized." });
        return;
    }

    const valuesAuth = [jwt.id, false];
    const queryAuth = "SELECT 1 FROM user WHERE id=? AND disabled=?";
    const [resultAuth] = await Database.execute(queryAuth, valuesAuth);

    if (resultAuth.length === 0) {
        res.status(404).json({ data: null, msg: "User not found or disabled." });
        return;
    }

    const { phone } = req.body;

    if (!validatePhone(phone)) {
        res.status(400).json({ data: null, msg: "Invalid phone format." });
        return;
    }

    const valuesA = [phone, jwt.id];
    const queryA = "SELECT 1 FROM user WHERE phone=? AND id<>?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length > 0) {
        res.status(409).json({ data: null, msg: "Phone number is already taken." });
        return;
    }

    const valuesB = [jwt.id];
    const queryB = "SELECT phone_candidate, updated_at FROM user WHERE id=?";
    const [resultB] = await Database.execute(queryB, valuesB);

    const { phone_candidate, updated_at } = resultB[0];

    const timeLeft = convertMillisecondsToText(codeExpirationTime - (Date.now() - updated_at));

    if (Number(phone_candidate) === Number(phone) && Date.now() - updated_at < codeExpirationTime) {
        res.status(429).json({
            data: null,
            msg: `Verify phone code already sent, please check your WhatsApp or wait ${timeLeft}.`,
        });
        return;
    }

    const verifyPhoneCode = generateDigits(verifyPhoneCodeLength);

    const valuesC = [verifyPhoneCode, phone, Date.now(), jwt.id];
    const queryC =
        "UPDATE user SET verify_phone_code=?, phone_candidate=?, updated_at=? WHERE id=?";
    await Database.execute(queryC, valuesC);

    const textBody = formatBodyForVerifyPhoneCode(verifyPhoneCode);

    if (!(await sendWhatsAppMessage(phone, textBody))) {
        res.status(500).json({ data: null, msg: "Text not sent." });
        return;
    }

    res.status(200).json({ data: null, msg: "Verify phone code successfully sent." });
});
