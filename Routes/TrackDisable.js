import api from "../Modules/Api.js";
import { verifyJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validateNumber } from "../Modules/DataValidation.js";
import Constants from "../Utils/Constants.js";

const {
    trackStatusDisabled,
    trackStatusEnabled,
    subscriptionActive,
    defaultTrackDisabledMaxProducts,
} = Constants;

api.patch("/track/disable", async function (req, res) {
    const jwt = verifyJwt(req.cookies?.jwt);

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

    const { id } = req.body;

    if (!validateNumber(id)) {
        res.status(400).json({ data: null, msg: "Invalid id format." });
        return;
    }

    const valuesA = [jwt.id, id];
    const queryA = "SELECT status_id FROM track WHERE user_id=? AND id=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length === 0) {
        res.status(403).json({ data: null, msg: "Track disable request denied, track not found." });
        return;
    }

    if (resultA[0].status_id !== trackStatusEnabled) {
        res.status(403).json({
            data: null,
            msg: "Track disable request denied, track is not enabled so you cannot disable it.",
        });
        return;
    }

    let trackDisabledMaxProducts = defaultTrackDisabledMaxProducts;

    const valuesB = [jwt.id, subscriptionActive];
    const queryB =
        "SELECT p.track_disabled_max_products FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.plan_id=p.id";
    const [resultB] = await Database.execute(queryB, valuesB);

    const valuesC = [jwt.id, trackStatusDisabled];
    const queryC =
        "SELECT COUNT(*) AS total_tracks_disabled FROM track WHERE user_id=? AND status_id=?";
    const [resultC] = await Database.execute(queryC, valuesC);

    if (resultB.length > 0) {
        trackDisabledMaxProducts = resultA[0].track_disabled_max_products;
    }

    if (resultC[0].total_tracks_disabled >= trackDisabledMaxProducts) {
        res.status(403).json({
            data: null,
            msg: `Track disable request denied, reached tracklist max products limit: ${trackDisabledMaxProducts}`,
        });
        return;
    }

    const valuesD = [trackStatusDisabled, id];
    const queryD = "UPDATE track SET status_id=? WHERE id=?";
    await Database.execute(queryD, valuesD);

    res.status(200).json({ data: null, msg: "Track successfully disabled." });
});
