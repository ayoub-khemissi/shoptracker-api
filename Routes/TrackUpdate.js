import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import {
    validateBoolean,
    validateNumber
} from "../Modules/DataValidation.js";

api.patch("/track/update", async function (req, res) {
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

    const { id, trackStock, trackPrice } = req.body;
    const trackPriceThreshold = req.body.trackPriceThreshold ?? null;

    if (!validateNumber(id)) {
        res.status(400).json({ data: null, msg: "Invalid id format." });
        return;
    }

    if (!validateBoolean(trackStock)) {
        res.status(400).json({ data: null, msg: "Invalid trackStock format." });
        return;
    }

    if (!validateBoolean(trackPrice)) {
        res.status(400).json({ data: null, msg: "Invalid trackPrice format." });
        return;
    }

    if (!trackStock && !trackPrice) {
        res.status(400).json({ data: null, msg: "Invalid trackStock & trackPrice format." });
        return;
    }

    if (trackPrice && (!validateNumber(trackPriceThreshold) || trackPriceThreshold < 1)) {
        res.status(400).json({ data: null, msg: "Invalid trackPriceThreshold format." });
        return;
    }

    const valuesA = [jwt.id, id];
    const queryA = "SELECT 1 FROM track WHERE user_id=? AND id=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length < 1) {
        res.status(403).json({ data: null, msg: "Track update denied, track not found." });
        return;
    }

    const valuesB = [
        trackStock,
        trackPrice,
        trackPriceThreshold,
        id
    ];
    const queryB =
        "UPDATE track SET track_stock=?, track_price=?, track_price_threshold=? WHERE id=?";
    await Database.execute(queryB, valuesB);

    res.status(200).json({ data: null, msg: "Track successfully updated." });
});
