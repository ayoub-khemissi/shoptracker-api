import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import Constants from "../Utils/Constants.js";

const { subscriptionActive, trackStatusDisabled } = Constants;

api.post("/account/delete/", async function (req, res) {
    const jwt = verifyAuthJwt(extractJwt(req.headers.authorization));

    if (!jwt) {
        res.status(401).json({ data: null, msg: "Unauthorized." });
        return;
    }

    const valuesA = [jwt.id, false];
    const queryA = "SELECT 1 FROM user WHERE id=? AND disabled=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length === 0) {
        res.status(404).json({ data: null, msg: "User not found or disabled." });
        return;
    }

    const valuesB = [jwt.id, subscriptionActive];
    const queryB = "SELECT 1 FROM subscription WHERE user_id=? AND status_id=?";
    const [resultB] = await Database.execute(queryB, valuesB);

    if (resultB.length > 0) {
        res.status(400).json({ data: null, msg: "User has an active subscription." });
        return;
    }

    const valuesC = [trackStatusDisabled, jwt.id];
    const queryC = "UPDATE track SET status_id=? WHERE user_id=?";
    await Database.execute(queryC, valuesC);

    const valuesD = [null, false, false, false, false, true, Date.now(), jwt.id];
    const queryD = "UPDATE user SET photo=?, alert_email=?, alert_text=?, alert_browser_notification=?, alert_push_notification=?, disabled=?, updated_at=? WHERE id=?";
    await Database.execute(queryD, valuesD);

    res.status(200).json({ data: null, msg: "User account successfully deleted." });
});
