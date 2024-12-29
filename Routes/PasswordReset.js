import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import { generateSalt, hashPassword } from "../Modules/Crypto.js";
import Database from "../Modules/Database.js";
import { validatePassword } from "../Modules/DataValidation.js";

api.patch("/password/reset", async function (req, res) {
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

    const { newPassword } = req.body;

    if (!validatePassword(newPassword)) {
        res.status(400).json({ data: null, msg: "Invalid new password format." });
        return;
    }

    const passwordSalt = generateSalt();
    const passwordHash = hashPassword(newPassword, passwordSalt);

    const valuesB = [passwordHash, passwordSalt, null, Date.now(), jwt.id];
    const queryB =
        "UPDATE user SET password_hash=?, password_salt=?, reset_password_code=?, updated_at=? WHERE id=?";
    await Database.execute(queryB, valuesB);

    res.status(200).json({ data: null, msg: "Password reset successfully." });
});
