import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import {
    validateBoolean,
    validateNumber,
    validateTrackStatus,
    validateUrl,
} from "../Modules/DataValidation.js";
import { cleanData } from "../Modules/DataTransformation.js";
import { retrieveSubscription } from "../Modules/Stripe.js";
import Constants from "../Utils/Constants.js";

const {
    trackStatusEnabled,
    trackStatusEnabledDefaultMaxProducts,
    trackStatusDisabledDefaultMaxProducts,
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
    const trackStatus = req.body.trackStatus;

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

    if (!validateTrackStatus(trackStatus)) {
        res.status(400).json({ data: null, msg: "Invalid trackStatus format." });
        return;
    }

    const valuesA = [jwt.id, trackStatus];
    const queryA = "SELECT 1 FROM track WHERE user_id=? AND status_id=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    const valuesB = [jwt.id, jwt.id];
    const queryB =
        "SELECT stripe_subscription_id FROM subscription WHERE user_id=? AND created_at=(SELECT MAX(created_at) FROM subscription WHERE user_id=?)";
    const [resultB] = await Database.execute(queryB, valuesB);

    let trackStatusMaxProducts =
        trackStatus === trackStatusEnabled
            ? trackStatusEnabledDefaultMaxProducts
            : trackStatusDisabledDefaultMaxProducts;
    if (resultB.length > 0) {
        const subscription = await retrieveSubscription(resultB[0].stripe_subscription_id);

        if (
            (subscription && subscription.status !== "canceled") ||
            subscription.ended_at > Date.now()
        ) {
            const metadata = subscription.metadata;
            if (metadata) {
                trackStatusMaxProducts = parseInt(
                    trackStatus === trackStatusEnabled
                        ? parseInt(metadata.track_enabled_max_products)
                        : parseInt(metadata.track_disabled_max_products),
                );
            }
        }
    }

    if (resultA.length >= trackStatusMaxProducts) {
        res.status(403).json({ data: null, msg: "Track request forbidden." });
        return;
    }

    const valuesC = [
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
    const queryC =
        "INSERT INTO track (user_id, url, additional_info, track_stock, track_price, track_price_threshold, status_id, extraction_rule_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    await Database.execute(queryC, valuesC);

    res.status(200).json({ data: null, msg: "Track request successfully sent." });
});
