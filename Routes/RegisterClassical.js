import api from "../Modules/Api.js";
import { signAuthJwt } from "../Modules/Auth.js";
import { generateSalt, hashPassword } from "../Modules/Crypto.js";
import Database from "../Modules/Database.js";
import { cleanData, clearSensitiveData, validateEmail, validateHash512 } from "../Modules/DataValidation.js";

api.post("/register/classical", async function (req, res) {
    const email = cleanData(req.body.email);
    const password = cleanData(req.body.password);

    if (!validateEmail(email)) {
        return res.status(400).json({ data: null, msg: "Invalid email format." });
    }

    if (!validateHash512(password)) {
        return res.status(400).json({ data: null, msg: "Invalid password format." });
    }

    const valuesA = [email];
    const queryA = "SELECT email FROM user WHERE email=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length > 0) {
        res.status(409).json({ data: null, msg: "User already exists." });
        return;
    }

    const passwordSalt = generateSalt();
    const passwordHash = hashPassword(password, passwordSalt);

    const valuesB = [email, passwordSalt, passwordHash, true, true, true, true, Date.now()];
    const queryB = "INSERT INTO user (email, password_salt, password_hash, alert_email, alert_text, alert_browser_notification, alert_push_notification, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const [resultB] = await Database.execute(queryB, valuesB);

    if (resultB.length === 0) {
        res.status(400).json({ data: null, msg: "User not inserted." });
        return;
    }

    const valuesC = [resultB.insertId];
    const queryC = "SELECT * FROM user WHERE id = ?";
    const [resultC] = await Database.execute(queryC, valuesC);

    if (resultC.length === 0) {
        res.status(404).json({ data: null, msg: "User not found." });
        return;
    }

    const data = clearSensitiveData({ ...resultC[0], jwt: signAuthJwt({ email: resultC[0].email }) });

    res.status(201).json({ data: data, msg: "User successfully created." });
});
