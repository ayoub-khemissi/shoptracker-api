import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import Constants from "../Utils/Constants.js";

const { subscriptionActive, trackStatusDeleted } = Constants;

api.delete("/account/delete/", async function (req, res) {
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

    const valuesA = [jwt.id, subscriptionActive];
    const queryA = "SELECT 1 FROM subscription WHERE user_id=? AND status_id=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length > 0) {
        res.status(400).json({ data: null, msg: "User has an active subscription." });
        return;
    }

    const valuesB = [trackStatusDeleted, jwt.id];
    const queryB = "UPDATE track SET status_id=? WHERE user_id=?";
    await Database.execute(queryB, valuesB);

    const valuesC = [false, false, false, false, true, Date.now(), jwt.id];
    const queryC = "UPDATE user SET alert_email=?, alert_text=?, alert_browser_notification=?, alert_push_notification=?, disabled=?, updated_at=? WHERE id=?";
    await Database.execute(queryC, valuesC);

    res.status(200).json({ data: null, msg: "User account successfully deleted." });
});
