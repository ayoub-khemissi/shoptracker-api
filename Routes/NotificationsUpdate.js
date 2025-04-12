import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validateBoolean, validateBrowserSubscription, validatePushSubscription } from "../Modules/DataValidation.js";

api.patch("/notifications/update/", async function (req, res) {
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

    const { alertEmail, alertSms, alertBrowser, alertPush, alertBrowserSubscription, alertPushSubscription } = req.body;

    if (!validateBoolean(alertEmail)) {
        res.status(400).json({ data: null, msg: "Invalid alertEmail format." });
        return;
    }

    if (!validateBoolean(alertSms)) {
        res.status(400).json({ data: null, msg: "Invalid alertSms format." });
        return;
    }

    if (!validateBoolean(alertBrowser)) {
        res.status(400).json({ data: null, msg: "Invalid alertBrowser format." });
        return;
    }

    if (!validateBoolean(alertPush)) {
        res.status(400).json({ data: null, msg: "Invalid alertPush format." });
        return;
    }

    if (!validateBrowserSubscription(alertBrowserSubscription)) {
        res.status(400).json({ data: null, msg: "Invalid alertBrowserSubscription format." });
        return;
    }

    if (!validatePushSubscription(alertPushSubscription)) {
        res.status(400).json({ data: null, msg: "Invalid alertPushSubscription format." });
        return;
    }

    const valuesA = [
        alertEmail,
        alertSms,
        alertBrowser,
        alertPush,
        alertBrowserSubscription,
        alertPushSubscription,
        Date.now(),
        jwt.id,
    ];
    const queryA =
        "UPDATE user SET alert_email=?, alert_sms=?, alert_browser=?, alert_push=?, alert_browser_subscription=?, alert_push_subscription=?, updated_at=? WHERE id=?";
    await Database.execute(queryA, valuesA);

    res.status(200).json({ data: null, msg: "User notifications successfully updated." });
});
