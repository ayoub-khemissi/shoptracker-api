import api from "../Modules/Api.js";
import { signAuthJwt } from "../Modules/Auth.js";
import { hashPassword } from "../Modules/Crypto.js";
import Database from "../Modules/Database.js";
import { validateEmail, validateHash512 } from "../Modules/DataValidation.js";
import { clearSensitiveData } from "../Modules/DataTransformation.js";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";

const { SHOPTRACKER_API_HTTPSECURE } = Config;
const { jwtExpirationTime } = Constants;

api.post("/login/classical", async function (req, res) {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
        res.status(400).json({ data: null, msg: "Invalid email format." });
        return;
    }

    if (!validateHash512(password)) {
        res.status(400).json({ data: null, msg: "Invalid password format." });
        return;
    }

    const valuesA = [email];
    const queryA = "SELECT * FROM user WHERE email=?";
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

    const jwt = signAuthJwt({ email: resultA[0].email, id: resultA[0].id });
    const data = clearSensitiveData({ ...resultA[0] });

    res.cookie("jwt", jwt, { httpOnly: true, secure: SHOPTRACKER_API_HTTPSECURE, maxAge: jwtExpirationTime });
    res.status(200).json({ data: data, msg: "User successfully logged in." });
});
