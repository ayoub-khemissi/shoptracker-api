import api from "../Modules/Api.js";
import { generateCode } from "../Modules/Crypto.js";
import Database from "../Modules/Database.js";
import { validateEmail } from "../Modules/DataValidation.js";
import { sendEmail } from "../Modules/Mailer.js";
import { formatBodyForResetPassword } from "../Modules/ServicesMailFormatter.js";
import Constants from "../Utils/Constants.js";

const { resetPasswordCodeLength } = Constants;

api.post("/password/code/generate", async function (req, res) {
    const { email } = req.body;

    if (!validateEmail(email)) {
        res.status(400).json({ data: null, msg: "Invalid email format." });
        return;
    }

    const valuesA = [email, false];
    const queryA = "SELECT 1 FROM user WHERE email=? AND disabled=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length === 0) {
        res.status(404).json({ data: null, msg: "User not found or disabled." });
        return;
    }

    const resetPasswordCode = generateCode(resetPasswordCodeLength / 2);

    const valuesB = [resetPasswordCode, Date.now(), email];
    const queryB = "UPDATE user SET reset_password_code=?, updated_at=? WHERE email=?";
    await Database.execute(queryB, valuesB);

    const emailBody = formatBodyForResetPassword(resetPasswordCode);

    if (!(await sendEmail(email, "🔒 Reset password", emailBody))) {
        res.status(500).json({ data: null, msg: "Email not sent." });
        return;
    }

    res.status(200).json({ data: null, msg: "Reset password code successfully sent." });
});
