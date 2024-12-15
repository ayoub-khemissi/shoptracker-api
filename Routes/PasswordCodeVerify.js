import api from "../Modules/Api.js";
import Database from "../Modules/Database.js";
import { validateCode, validateEmail } from "../Modules/DataValidation.js";
import Constants from "../Utils/Constants.js";

const { resetPasswordCodeLength } = Constants;

api.post("/password/code/verify", async function (req, res) {
    const { email, resetPasswordCode } = req.body;

    if (!validateEmail(email)) {
        res.status(400).json({ data: null, msg: "Invalid email format." });
        return;
    }

    if (!validateCode(resetPasswordCode, resetPasswordCodeLength)) {
        res.status(400).json({ data: null, msg: "Invalid reset password code format." });
        return;
    }

    const valuesA = [email, false];
    const queryA = "SELECT reset_password_code FROM user WHERE email=? AND disabled=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length === 0) {
        res.status(404).json({ data: null, msg: "User not found or disabled." });
        return;
    }

    const user = resultA[0];

    if (user.reset_password_code !== resetPasswordCode) {
        res.status(400).json({ data: null, msg: "Invalid reset password code." });
        return;
    }

    res.status(200).json({ data: null, msg: "Reset password code successfully verified." });
});
