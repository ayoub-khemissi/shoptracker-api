import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import Constants from "../Utils/Constants.js";

const { trackStatusDeleted } = Constants;

api.get("/tracklist", async function (req, res) {
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

    const valuesA = [jwt.id, trackStatusDeleted];
    const queryA =
        "SELECT t.id, t.url, t.name, t.description, t.currency, t.additional_info, t.track_stock, t.track_price, t.track_price_threshold, t.status_id, t.created_at, t.updated_at, (SELECT tco.price FROM track_check_ok tco WHERE tco.track_id = t.id ORDER BY tco.created_at ASC LIMIT 1) AS initial_price, (SELECT tco.availability FROM track_check_ok tco WHERE tco.track_id = t.id ORDER BY tco.created_at ASC LIMIT 1) AS availability FROM track t WHERE t.user_id = ? AND t.status_id <> ?";
    const [resultA] = await Database.execute(queryA, valuesA);

    for (const track of resultA) {
        const valuesB = [track.id, track.id, track.id, track.id];
        const queryB =
            "SELECT * FROM (SELECT id, created_at, price, availability FROM (SELECT tco.id, tco.created_at, tco.price, tco.availability FROM track_check_ok tco JOIN (SELECT id, created_at, price, availability, LAG(price) OVER (ORDER BY created_at) AS prev_price, LAG(availability) OVER (ORDER BY created_at) AS prev_availability FROM track_check_ok WHERE created_at >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 6 MONTH)) * 1000 AND track_id = ?) ptco ON tco.id = ptco.id WHERE (tco.price <> ptco.prev_price OR tco.availability <> ptco.prev_availability) AND tco.track_id = ? ORDER BY tco.created_at DESC LIMIT 10) AS limited_changes UNION ALL SELECT first_check.id, first_check.created_at, first_check.price, first_check.availability FROM (SELECT tc_first.id, tc_first.created_at, tc_first.price, tc_first.availability FROM track_check_ok tc_first WHERE tc_first.track_id = ? ORDER BY tc_first.created_at ASC LIMIT 1) first_check UNION ALL SELECT last_check.id, last_check.created_at, last_check.price, last_check.availability FROM (SELECT tc_last.id, tc_last.created_at, tc_last.price, tc_last.availability FROM track_check_ok tc_last WHERE tc_last.track_id = ? ORDER BY tc_last.created_at DESC LIMIT 1) last_check) AS combined_results GROUP BY id, created_at, price, availability ORDER BY created_at ASC";
        const [resultB] = await Database.execute(queryB, valuesB);

        track.track_checks_ok = [...resultB];

        const valuesC = [track.id];
        const queryC = "SELECT tcko.id, tcko.created_at, tckor.title, tckor.reason FROM track_check_ko tcko JOIN track_check_ko_reason tckor ON tcko.reason_id = tckor.id WHERE tcko.track_id = ? ORDER BY tcko.created_at ASC LIMIT 5";
        const [resultC] = await Database.execute(queryC, valuesC);
        track.track_checks_ko = [...resultC];
    }

    res.status(200).json({ data: resultA, msg: "Tracklist successfully found." });
});
