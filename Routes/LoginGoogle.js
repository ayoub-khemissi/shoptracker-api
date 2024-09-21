import api from "../Modules/Api.js";
import { signAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validateEmail, validateName, validateUrl } from "../Modules/DataValidation.js";
import { cleanStringData, clearSensitiveData } from "../Modules/DataTransformation.js";
import { verifyGoogleJwt } from "../Modules/GoogleAuth.js";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";

const { SHOPTRACKER_API_HTTPSECURE } = Config;
const { jwtExpirationTime } = Constants;

api.post("/login/google", async function (req, res) {
    const email = cleanStringData(req.body.email);
    const firstname = cleanStringData(req.body.firstname);
    const photo = cleanStringData(req.body.photo);
    const googleJwt = cleanStringData(req.body.googleJwt);

    if (!validateEmail(email)) {
        res.status(400).json({ data: null, msg: "Invalid email format." });
        return;
    }

    if (!validateName(firstname)) {
        res.status(400).json({ data: null, msg: "Invalid firstname format." });
        return;
    }

    if (!validateUrl(photo)) {
        res.status(400).json({ data: null, msg: "Invalid photo format." });
        return;
    }

    if (!(await verifyGoogleJwt(googleJwt))) {
        res.status(401).json({ data: null, msg: "Invalid Google JWT." });
        return;
    }

    const valuesA = [email];
    const queryA = "SELECT * FROM user WHERE email=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    let data = null;
    let jwt = null;
    if (resultA.length === 0) {
        const valuesB = [email, firstname, photo, true, true, true, true, Date.now()];
        const queryB =
            "INSERT INTO user (email, firstname, photo, alert_email, alert_text, alert_browser_notification, alert_push_notification, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
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

        data = clearSensitiveData({ ...resultC[0] });
        jwt = signAuthJwt({ email: resultC[0].email, id: resultC[0].id });
    } else {
        data = clearSensitiveData({ ...resultA[0] });
        jwt = signAuthJwt({ email: resultA[0].email, id: resultA[0].id });
    }

    res.cookie("jwt", jwt, { httpOnly: true, secure: SHOPTRACKER_API_HTTPSECURE, maxAge: jwtExpirationTime });
    res.status(200).json({ data: data, msg: "User successfully logged in." });
});
