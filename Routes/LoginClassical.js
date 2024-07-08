import api from "../Modules/Api.js";
import { hashPassword } from "../Modules/Crypto.js";
import Database from "../Modules/Database.js";
import { clearSensitiveData, validateEmail, validateHash512 } from "../Modules/DataValidation.js";

api.post("/login/classical", async function (req, res) {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
        return res.status(400).json({ data: null, msg: "Invalid email format." });
    }

    if (!validateHash512(password)) {
        return res.status(400).json({ data: null, msg: "Invalid password format." });
    }

    const valuesA = [email];
    const queryA = `SELECT * FROM user WHERE email=?`;
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length === 0) {
        res.status(401).json({ data: null, msg: "Bad credentials." });
        return;
    }

    const passwordSalt = resultA[0].password_salt;
    const passwordHash = hashPassword(password, passwordSalt);
    const realPasswordHash = resultA[0].password_hash;

    if (!passwordSalt || !passwordHash || !realPasswordHash || passwordHash !== realPasswordHash) {
        res.status(401).json({ data: null, msg: "Bad credentials." });
        return;
    }

    const data = clearSensitiveData(resultA[0]);

    res.status(200).json({ data: data, msg: "User successfully logged in." });
});
