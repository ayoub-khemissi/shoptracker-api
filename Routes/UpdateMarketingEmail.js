import api from "../Modules/Api.js";
import { verifyJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";

api.patch("/update/marketing/email", async function (req, res) {
    const { token, enabled } = req.body;

    const jwt = verifyJwt(token || req.cookies?.jwt);

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

    const values = [enabled, Date.now(), jwt.id];
    const query = "UPDATE user SET marketing_email=?, updated_at=? WHERE id=?";
    await Database.execute(query, values);

    res.status(200).json({ data: null, msg: "User marketing email subscription successfully updated." });
});
