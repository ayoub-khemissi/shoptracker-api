import api from "../Modules/Api.js";
import { signAuthJwt } from "../Modules/Auth.js";
import { generateSalt, hashPassword } from "../Modules/Crypto.js";
import Database from "../Modules/Database.js";
import { validateEmail, validateHash512 } from "../Modules/DataValidation.js";
import { cleanStringData, clearSensitiveData } from "../Modules/DataTransformation.js";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";

const { SHOPTRACKER_API_HTTPSECURE } = Config;
const { jwtExpirationTime } = Constants;

api.post("/register/classical", async function (req, res) {
    const email = cleanStringData(req.body.email);
    const password = cleanStringData(req.body.password);

    if (!validateEmail(email)) {
        res.status(400).json({ data: null, msg: "Invalid email format." });
        return;
    }

    if (!validateHash512(password)) {
        res.status(400).json({ data: null, msg: "Invalid password format." });
        return;
    }

    const valuesA = [email];
    const queryA = "SELECT 1 FROM user WHERE email=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length > 0) {
        res.status(409).json({ data: null, msg: "User already exists." });
        return;
    }

    const passwordSalt = generateSalt();
    const passwordHash = hashPassword(password, passwordSalt);

    const valuesB = [email, passwordSalt, passwordHash, true, true, true, true, Date.now()];
    const queryB =
        "INSERT INTO user (email, password_salt, password_hash, alert_email, alert_text, alert_browser_notification, alert_push_notification, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const [resultB] = await Database.execute(queryB, valuesB);

    if (resultB.affectedRows === 0) {
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

    const jwt = signAuthJwt({ email: resultC[0].email, id: resultC[0].id })
    const data = clearSensitiveData({ ...resultC[0] });

    res.cookie("jwt", jwt, { httpOnly: true, secure: SHOPTRACKER_API_HTTPSECURE, maxAge: jwtExpirationTime, sameSite: "lax" });
    res.status(201).json({ data: data, msg: "User successfully created." });
});
