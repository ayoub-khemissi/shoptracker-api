import api from "../Modules/Api.js";
import { signAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { cleanData, clearSensitiveData, validateEmail, validateName, validateUrl } from "../Modules/DataValidation.js";
import { verifyGoogleJwt } from "../Modules/GoogleAuth.js";

api.post("/register/google", async function (req, res) {
    const email = cleanData(req.body.email);
    const firstname = cleanData(req.body.firstname);
    const photo = cleanData(req.body.photo);
    const googleJwt = cleanData(req.body.googleJwt);

    if (!validateEmail(email)) {
        return res.status(400).json({ data: null, msg: "Invalid email format." });
    }

    if (!validateName(firstname)) {
        return res.status(400).json({ data: null, msg: "Invalid firstname format." });
    }

    if (!validateUrl(photo)) {
        return res.status(400).json({ data: null, msg: "Invalid photo format." });
    }

    if (!await verifyGoogleJwt(googleJwt)) {
        return res.status(401).json({ data: null, msg: "Invalid Google JWT." });
    }

    const valuesA = [email];
    const queryA = "SELECT * FROM user WHERE email=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length > 0) {
        const data = clearSensitiveData({ ...resultA[0], jwt: signAuthJwt({ email: resultA[0].email, id: resultA[0].id }) });
        res.status(200).json({ data: data, msg: "User successfully logged in." });
        return;
    }

    const valuesB = [email, firstname, photo, true, true, true, true, Date.now()];
    const queryB = "INSERT INTO user (email, firstname, photo, alert_email, alert_text, alert_browser_notification, alert_push_notification, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
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

    const data = clearSensitiveData({ ...resultC[0], jwt: signAuthJwt({ email: resultC[0].email, id: resultC[0].id }) });

    res.status(201).json({ data: data, msg: "User successfully created." });
});
