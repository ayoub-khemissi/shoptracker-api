import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validatePhone } from "../Modules/DataValidation.js";

api.patch("/phone/update/", async function (req, res) {
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

    const { phone } = req.body;

    if (!validatePhone(phone)) {
        res.status(400).json({ data: null, msg: "Invalid phone format." });
        return;
    }

    const valuesA = [phone, jwt.id];
    const queryA = "UPDATE user SET phone=? WHERE id=?";
    await Database.execute(queryA, valuesA);

    res.status(200).json({ data: null, msg: "User phone successfully updated." });
});
