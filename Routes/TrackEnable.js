import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validateNumber } from "../Modules/DataValidation.js";
import { retrieveSubscription } from "../Modules/Stripe.js";
import Constants from "../Utils/Constants.js";

const {
    trackStatusEnabled,
    defaultTrackEnabledMaxProducts
} = Constants;

api.patch("/track/enable", async function (req, res) {
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

    const id = req.body.id;

    if (!validateNumber(id)) {
        res.status(400).json({ data: null, msg: "Invalid id format." });
        return;
    }

    const valuesA = [jwt.id, id];
    const queryA = "SELECT status_id FROM track WHERE user_id=? AND id=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length === 0) {
        res.status(403).json({ data: null, msg: "Track enable request denied, track not found." });
        return;
    }

    if (resultA[0].status_id === trackStatusEnabled) {
        res.status(409).json({ data: null, msg: "Track enable request denied, track already enabled." });
        return;
    }

    const valuesB = [jwt.id, jwt.id];
    const queryB =
        "SELECT stripe_subscription_id, track_enabled_max_products FROM subscription WHERE user_id=? AND created_at=(SELECT MAX(created_at) FROM subscription WHERE user_id=?)";
    const [resultB] = await Database.execute(queryB, valuesB);

    const valuesC = [jwt.id, trackStatusEnabled];
    const queryC =
        "SELECT COUNT(*) AS total_tracks_enabled FROM track WHERE user_id=? AND status_id=?";
    const [resultC] = await Database.execute(queryC, valuesC);

    let trackEnabledMaxProducts = defaultTrackEnabledMaxProducts;

    if (resultB.length > 0) {
        const subscription = await retrieveSubscription(resultA[0].stripe_subscription_id);

        if (subscription.status === "active") {
            trackEnabledMaxProducts = resultA[0].track_enabled_max_products;
        }
    }

    if (resultC[0].total_tracks_enabled >= trackEnabledMaxProducts) {
        res.status(403).json({ data: null, msg: `Track enable request denied, reached tracklist max products limit: ${trackEnabledMaxProducts}` });
        return;
    }

    const valuesD = [trackStatusEnabled, id];
    const queryD = "UPDATE track SET status_id=? WHERE id=?";
    await Database.execute(queryD, valuesD);

    res.status(200).json({ data: null, msg: "Track successfully enabled." });
});
