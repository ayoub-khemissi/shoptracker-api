import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";

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

    const valuesA = [jwt.id];
    const queryA = "SELECT t.id, t.url, t.name, t.description, t.currency, t.additional_info, t.track_stock, t.track_price, t.track_price_threshold, t.status_id, t.created_at, t.updated_at, (SELECT tc.price FROM track_check tc WHERE tc.track_id = t.id ORDER BY tc.created_at ASC LIMIT 1) AS initial_price, (SELECT tc.availability FROM track_check tc WHERE tc.track_id = t.id ORDER BY tc.created_at ASC LIMIT 1) AS availability FROM track t WHERE t.user_id = ?";
    const [resultA] = await Database.execute(queryA, valuesA);

    for (const track of resultA) {
        const valuesB = [track.id, track.id, track.id, track.id];
        const queryB = "SELECT * FROM (SELECT tc.id, tc.created_at, tc.price, tc.availability FROM track_check tc JOIN (SELECT id, created_at, price, availability, LAG(price) OVER (ORDER BY created_at) AS prev_price, LAG(availability) OVER (ORDER BY created_at) AS prev_availability FROM track_check WHERE created_at >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 6 MONTH)) * 1000 AND track_id = ?) ptc ON tc.id = ptc.id WHERE (tc.price <> ptc.prev_price OR tc.availability <> ptc.prev_availability) AND tc.track_id = ? UNION ALL SELECT first_check.id, first_check.created_at, first_check.price, first_check.availability FROM (SELECT tc_first.id, tc_first.created_at, tc_first.price, tc_first.availability FROM track_check tc_first WHERE tc_first.track_id = ? ORDER BY tc_first.created_at ASC LIMIT 1) first_check UNION ALL SELECT last_check.id, last_check.created_at, last_check.price, last_check.availability FROM (SELECT tc_last.id, tc_last.created_at, tc_last.price, tc_last.availability FROM track_check tc_last WHERE tc_last.track_id = ? ORDER BY tc_last.created_at DESC LIMIT 1) last_check) AS combined_results GROUP BY id ORDER BY created_at ASC";
        const [resultB] = await Database.execute(queryB, valuesB);

        track.track_checks = [...resultB];
    }

    res.status(200).json({ data: resultA, msg: "Tracklist successfully found." });
});
