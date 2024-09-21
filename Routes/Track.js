import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import {
    validateBoolean,
    validateNumber,
    validateUrl,
} from "../Modules/DataValidation.js";
import { cleanStringData } from "../Modules/DataTransformation.js";
import Constants from "../Utils/Constants.js";
import { retrieveSubscription } from "../Modules/Stripe.js";

const {
    trackStatusEnabled,
    trackStatusDisabled,
    defaultTrackEnabledMaxProducts,
    defaultTrackDisabledMaxProducts,
    defaultTrackUserMaxSearchesPerDay,
    trackExtractionRuleFull,
    subscriptionActive
} = Constants;

api.post("/track", async function (req, res) {
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

    const { trackStock, trackPrice } = req.body;
    const url = cleanStringData(req.body.url);
    const additionalInfo = cleanStringData(req.body.additionalInfo) ?? "";
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

    const valuesA = [jwt.id, subscriptionActive];
    const queryA =
        "SELECT s.stripe_subscription_id, p.track_enabled_max_products, p.track_disabled_max_products, p.track_user_max_searches_per_day FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.stripe_price_id=p.stripe_price_id";
    const [resultA] = await Database.execute(queryA, valuesA);

    const valuesB = [jwt.id, trackStatusEnabled, jwt.id, trackStatusDisabled];
    const queryB =
        "SELECT (SELECT COUNT(*) FROM track WHERE user_id=? AND status_id=?) AS total_tracks_enabled, (SELECT COUNT(*) FROM track WHERE user_id=? AND status_id=?) AS total_tracks_disabled";
    const [resultB] = await Database.execute(queryB, valuesB);

    const valuesC = [jwt.id, trackStatusEnabled, jwt.id, trackStatusDisabled];
    const queryC =
        "SELECT COUNT(*) AS total_tracks_today FROM track WHERE created_at >= UNIX_TIMESTAMP(CURDATE()) * 1000 AND created_at < UNIX_TIMESTAMP(CURDATE() + INTERVAL 1 DAY) * 1000";
    const [resultC] = await Database.execute(queryC, valuesC);

    const valuesD = [jwt.id, url, trackStatusEnabled, trackStatusDisabled];
    const queryD =
        "SELECT 1 FROM track WHERE user_id=? AND url=? AND status_id IN (?, ?)";
    const [resultD] = await Database.execute(queryD, valuesD);

    let trackEnabledMaxProducts = defaultTrackEnabledMaxProducts;
    let trackDisabledMaxProducts = defaultTrackDisabledMaxProducts;
    let trackUserMaxSearchesPerDay = defaultTrackUserMaxSearchesPerDay;

    if (resultA.length > 0) {
        const subscription = await retrieveSubscription(resultA[0].stripe_subscription_id);

        if (subscription.status === "active") {
            trackEnabledMaxProducts = resultA[0].track_enabled_max_products;
            trackDisabledMaxProducts = resultA[0].track_disabled_max_products;
            trackUserMaxSearchesPerDay = resultA[0].track_user_max_searches_per_day;
        }
    }

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
        res.status(409).json({ data: null, msg: "Track request denied, product already in tracklist." });
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
