import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validateNumber } from "../Modules/DataValidation.js";
import Constants from "../Utils/Constants.js";

const {
    trackStatusDisabled,
    trackStatusEnabled
} = Constants;

api.patch("/track/disable", async function (req, res) {
    const jwt = verifyAuthJwt(extractJwt(req.headers.authorization));

    if (!jwt) {
        res.status(401).json({ data: null, msg: "Unauthorized." });
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
        res.status(403).json({ data: null, msg: "Track disable request denied, track not found." });
        return;
    }

    if (resultA[0].status_id !== trackStatusEnabled) {
        res.status(403).json({ data: null, msg: "Track disable request denied, track is not enabled so you cannot disable it." });
        return;
    }

    const valuesD = [trackStatusDisabled, id];
    const queryD = "UPDATE track SET status_id=? WHERE id=?";
    await Database.execute(queryD, valuesD);

    res.status(200).json({ data: null, msg: "Track successfully disabled." });
});
