import api from "../Modules/Api.js";
import { generateSalt, hashPassword } from "../Modules/Crypto.js";
import Database from "../Modules/Database.js";
import { validateCode, validateEmail, validatePassword } from "../Modules/DataValidation.js";
import Constants from "../Utils/Constants.js";

const { resetPasswordCodeLength } = Constants;

api.patch("/password/code/reset", async function (req, res) {
    const { email, resetPasswordCode, newPassword } = req.body;

    if (!validateEmail(email)) {
        res.status(400).json({ data: null, msg: "Invalid email format." });
        return;
    }

    if (!validateCode(resetPasswordCode, resetPasswordCodeLength)) {
        res.status(400).json({ data: null, msg: "Invalid resetPasswordCode format." });
        return;
    }

    if (!validatePassword(newPassword)) {
        res.status(400).json({ data: null, msg: "Invalid new password format." });
        return;
    }

    const valuesA = [email, false];
    const queryA = "SELECT reset_password_code FROM user WHERE email=? AND disabled=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length === 0) {
        res.status(404).json({ data: null, msg: "User not found or disabled." });
        return;
    }

    const user = resultA[0];

    if (user.reset_password_code !== resetPasswordCode) {
        res.status(400).json({ data: null, msg: "Invalid reset password code." });
        return;
    }

    const passwordSalt = generateSalt();
    const passwordHash = hashPassword(newPassword, passwordSalt);

    const valuesB = [passwordHash, passwordSalt, null, Date.now(), email];
    const queryB =
        "UPDATE user SET password_hash=?, password_salt=?, reset_password_code=?, updated_at=? WHERE email=?";
    await Database.execute(queryB, valuesB);

    res.status(200).json({ data: null, msg: "Password reset successfully." });
});
