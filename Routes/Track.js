import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import {
    validateBoolean,
    validateNumber,
    validateUrl,
} from "../Modules/DataValidation.js";
import { cleanData } from "../Modules/DataTransformation.js";
import Constants from "../Utils/Constants.js";

const {
    trackStatusEnabled,
    trackStatusDisabled,
    defaultTrackEnabledMaxProducts,
    defaultTrackDisabledMaxProducts,
    defaultTrackUserMaxSearchesPerDay,
    trackExtractionRuleFull,
} = Constants;

api.post("/track", async function (req, res) {
    const jwt = verifyAuthJwt(extractJwt(req.headers.authorization));

    if (!jwt) {
        res.status(401).json({ data: null, msg: "Unauthorized." });
        return;
    }

    const url = cleanData(req.body.url);
    const additionalInfo = cleanData(req.body.additionalInfo ?? "");
    const trackStock = req.body.trackStock;
    const trackPrice = req.body.trackPrice;
    const trackPriceThreshold = req.body.trackPriceThreshold ?? null;

    if (!validateUrl(url)) {
        res.status(400).json({ data: null, msg: "Invalid url format." });
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

    const valuesA = [jwt.id, jwt.id];
    const queryA =
        "SELECT track_enabled_max_products, track_disabled_max_products, track_user_max_searches_per_day FROM subscription WHERE user_id=? AND created_at=(SELECT MAX(created_at) FROM subscription WHERE user_id=?)";
    const [resultA] = await Database.execute(queryA, valuesA);

    const valuesB = [jwt.id, trackStatusEnabled, jwt.id, trackStatusDisabled];
    const queryB =
        "SELECT (SELECT COUNT(*) FROM track WHERE user_id=? AND status_id=?) AS total_tracks_enabled, (SELECT COUNT(*) FROM track WHERE user_id=? AND status_id=?) AS total_tracks_disabled FROM track";
    const [resultB] = await Database.execute(queryB, valuesB);

    const valuesC = [jwt.id, trackStatusEnabled, jwt.id, trackStatusDisabled];
    const queryC =
        "SELECT COUNT(*) AS total_tracks_today FROM track WHERE created_at >= UNIX_TIMESTAMP(CURDATE()) * 1000 AND created_at < UNIX_TIMESTAMP(CURDATE() + INTERVAL 1 DAY) * 1000";
    const [resultC] = await Database.execute(queryC, valuesC);

    const valuesD = [jwt.id, url, trackStatusEnabled, trackStatusDisabled];
    const queryD =
        "SELECT 1 FROM track WHERE user_id=? AND url=? AND status_id IN (?, ?)";
    const [resultD] = await Database.execute(queryD, valuesD);

    const trackEnabledMaxProducts = resultA.length > 0 ? resultA[0].track_enabled_max_products : defaultTrackEnabledMaxProducts;
    const trackDisabledMaxProducts = resultA.length > 0 ? resultA[0].track_disabled_max_products : defaultTrackDisabledMaxProducts;
    const trackUserMaxSearchesPerDay = resultA.length > 0 ? resultA[0].track_user_max_searches_per_day : defaultTrackUserMaxSearchesPerDay;

    let trackStatus;
    if (resultB[0].total_tracks_enabled >= trackEnabledMaxProducts) {
        if (resultB[0].total_tracks_disabled >= trackDisabledMaxProducts) {
            res.status(403).json({ data: null, msg: `Track request denied, reached tracklist max products limit: ${trackDisabledMaxProducts}` });
            return;
        } else {
            trackStatus = trackStatusDisabled;
        }
    } else {
        trackStatus = trackStatusEnabled;
    }

    if (resultC[0].total_tracks_today >= trackUserMaxSearchesPerDay) {
        res.status(403).json({ data: null, msg: `Track request denied, reached user max searches per day limit: ${trackUserMaxSearchesPerDay}` });
        return;
    }

    if (resultD.length > 0) {
        res.status(403).json({ data: null, msg: "Track request denied, product already in tracklist." });
        return;
    }

    const valuesE = [
        jwt.id,
        url,
        additionalInfo,
        trackStock,
        trackPrice,
        trackPriceThreshold,
        trackStatus,
        trackExtractionRuleFull,
        Date.now(),
    ];
    const queryE =
        "INSERT INTO track (user_id, url, additional_info, track_stock, track_price, track_price_threshold, status_id, extraction_rule_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    await Database.execute(queryE, valuesE);

    res.status(200).json({ data: null, msg: "Track request successfully sent." });
});
