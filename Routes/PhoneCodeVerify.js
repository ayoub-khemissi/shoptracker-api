import api from "../Modules/Api.js";
import { verifyJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validateDigits } from "../Modules/DataValidation.js";
import Constants from "../Utils/Constants.js";

const { verifyPhoneCodeLength, codeExpirationTime } = Constants;

api.post("/phone/code/verify", async function (req, res) {
    const jwt = verifyJwt(req.cookies?.jwt);

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

    const { verifyPhoneCode } = req.body;

    if (!validateDigits(verifyPhoneCode, verifyPhoneCodeLength)) {
        res.status(400).json({ data: null, msg: "Invalid verify phone code format." });
        return;
    }

    const valuesA = [jwt.id];
    const queryA = "SELECT verify_phone_code, phone_candidate, updated_at FROM user WHERE id=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    const { verify_phone_code, phone_candidate, updated_at } = resultA[0];

    if (Number(verify_phone_code) !== Number(verifyPhoneCode)) {
        res.status(400).json({ data: null, msg: "Invalid verify phone code." });
        return;
    }

    const valuesB = [phone_candidate, jwt.id];
    const queryB = "SELECT 1 FROM user WHERE phone=? AND id<>?";
    const [resultB] = await Database.execute(queryB, valuesB);

    if (resultB.length > 0) {
        res.status(409).json({ data: null, msg: "Phone number is already taken." });
        return;
    }

    if (Date.now() - updated_at > codeExpirationTime) {
        res.status(400).json({ data: null, msg: "Verify phone code expired." });
        return;
    }

    const valuesC = [phone_candidate, true, null, null, null, Date.now(), jwt.id];
    const queryC =
        "UPDATE user SET phone=?, alert_sms=?, verify_phone_code=?, phone_candidate=?, verify_phone_code_created_at=?, updated_at=? WHERE id=?";
    await Database.execute(queryC, valuesC);

    res.status(200).json({ data: null, msg: "Verify phone code successfully validated." });
});
