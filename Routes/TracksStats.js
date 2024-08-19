import api from "../Modules/Api.js";
import Database from "../Modules/Database.js";
import Constants from "../Utils/Constants.js";

const { trackStatusEnabled } = Constants;

api.get("/track/stats", async function (req, res) {
    const valuesA = [trackStatusEnabled];
    const queryA =
        "SELECT (SELECT COUNT(*) FROM track WHERE status_id=?) total_tracks_enabled, (SELECT COUNT(*) FROM track_check) total_track_checks";
    const [resultA] = await Database.execute(queryA, valuesA);

    const { total_tracks_enabled, total_track_checks } = resultA[0];

    res.status(200).json({ data: { totalTracksEnabled: total_tracks_enabled, totalTrackChecks: total_track_checks }, msg: "Track stats successfully found." });
});
