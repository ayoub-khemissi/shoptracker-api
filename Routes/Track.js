import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { cleanData, validateBoolean, validateUrl } from "../Modules/DataValidation.js";
import Constants from "../Utils/Constants.js";

const { trackStatusEnabled } = Constants;

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

    if (!validateUrl(url)) {
        return res.status(400).json({ data: null, msg: "Invalid url format." });
    }

    if (!validateBoolean(trackStock)) {
        return res.status(400).json({ data: null, msg: "Invalid trackStock format." });
    }

    if (!validateBoolean(trackPrice)) {
        return res.status(400).json({ data: null, msg: "Invalid trackPrice format." });
    }

    const valuesA = [jwt.id, url, additionalInfo, trackStock, trackPrice, trackStatusEnabled, Date.now()];
    const queryA = "INSERT INTO track (user_id, url, additional_info, track_stock, track_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
    await Database.execute(queryA, valuesA);

    res.status(200).json({ data: null, msg: "Track request successfully sent." });
});
