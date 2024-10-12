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
    const queryA = "SELECT t.id, t.url, t.name, t.description, t.currency, t.additional_info, t.track_stock, t.track_price, t.track_price_threshold, t.status_id, t.created_at, t.updated_at, (SELECT tc.normal_price FROM track_check tc WHERE tc.track_id = t.id ORDER BY tc.created_at ASC LIMIT 1) AS first_normal_price, (SELECT tc.discounted_price FROM track_check tc WHERE tc.track_id = t.id ORDER BY tc.created_at ASC LIMIT 1) AS first_discounted_price FROM track t WHERE t.user_id = ?";
    const [resultA] = await Database.execute(queryA, valuesA);

    for (const track of resultA) {
        const valuesB = [track.id, track.id];
        const queryB = "SELECT tc.id, tc.created_at, tc.discounted_price AS discounted_price, tc.normal_price AS normal_price, tc.availability AS availability FROM track_check tc JOIN (SELECT id, created_at, discounted_price, normal_price, availability, LAG(discounted_price) OVER (ORDER BY created_at) AS prev_discounted_price, LAG(normal_price) OVER (ORDER BY created_at) AS prev_normal_price, LAG(availability) OVER (ORDER BY created_at) AS prev_availability FROM track_check WHERE created_at >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 6 MONTH)) * 1000 AND track_id=?) ptc ON tc.id = ptc.id WHERE (tc.discounted_price <> ptc.prev_discounted_price OR tc.normal_price <> ptc.prev_normal_price OR tc.availability <> ptc.prev_availability) AND tc.track_id=? ORDER BY tc.created_at DESC";
        const [resultB] = await Database.execute(queryB, valuesB);

        track.track_checks = [...resultB];
    }

    res.status(200).json({ data: resultA, msg: "Tracklist successfully found." });
});
