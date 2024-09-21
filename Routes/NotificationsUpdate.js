import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validateBoolean } from "../Modules/DataValidation.js";

api.patch("/notifications/update/", async function (req, res) {
    const jwt = verifyAuthJwt(extractJwt(req.headers.authorization));

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

    const { alertEmail, alertText, alertBrowserNotification, alertPushNotification } = req.body;

    if (!validateBoolean(alertEmail)) {
        res.status(400).json({ data: null, msg: "Invalid alertEmail format." });
        return;
    }

    if (!validateBoolean(alertText)) {
        res.status(400).json({ data: null, msg: "Invalid alertText format." });
        return;
    }

    if (!validateBoolean(alertBrowserNotification)) {
        res.status(400).json({ data: null, msg: "Invalid alertBrowserNotification format." });
        return;
    }

    if (!validateBoolean(alertPushNotification)) {
        res.status(400).json({ data: null, msg: "Invalid alertPushNotification format." });
        return;
    }

    const valuesA = [
        alertEmail,
        alertText,
        alertBrowserNotification,
        alertPushNotification,
        Date.now(),
        jwt.id,
    ];
    const queryA =
        "UPDATE user SET alert_email=?, alert_text=?, alert_browser_notification=?, alert_push_notification=?, updated_at=? WHERE id=?";
    await Database.execute(queryA, valuesA);

    res.status(200).json({ data: null, msg: "User notifications successfully updated." });
});
