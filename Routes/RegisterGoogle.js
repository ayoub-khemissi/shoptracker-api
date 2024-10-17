import api from "../Modules/Api.js";
import { signAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validateEmail } from "../Modules/DataValidation.js";
import { cleanStringData, clearSensitiveData } from "../Modules/DataTransformation.js";
import { verifyGoogleJwt } from "../Modules/GoogleAuth.js";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";

const { SHOPTRACKER_FRONT_HTTPSECURE, SHOPTRACKER_FRONT_DOMAIN } = Config;
const { jwtExpirationTime, subscriptionActive } = Constants;

api.post("/register/google", async function (req, res) {
    const email = cleanStringData(req.body.email);
    const googleJwt = cleanStringData(req.body.googleJwt);

    if (!validateEmail(email)) {
        res.status(400).json({ data: null, msg: "Invalid email format." });
        return;
    }

    if (!(await verifyGoogleJwt(googleJwt))) {
        res.status(401).json({ data: null, msg: "Invalid Google JWT." });
        return;
    }

    const valuesA = [email];
    const queryA = "SELECT * FROM user WHERE email=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length > 0) {
        const user = resultA[0];

        const valuesB = [user.id, subscriptionActive];
        const queryB = "SELECT stripe_price_id, track_check_interval, track_enabled_max_products, track_disabled_max_products, track_user_max_searches_per_day FROM plan WHERE id=(SELECT plan_id FROM subscription WHERE user_id=? AND status_id=?)";
        const [resultB] = await Database.execute(queryB, valuesB);

        if (resultB.length > 0) {
            user.subscription = resultB[0];
        } else {
            const valuesC = [];
            const queryC = "SELECT stripe_price_id, track_check_interval, track_enabled_max_products, track_disabled_max_products, track_user_max_searches_per_day FROM plan WHERE stripe_price_id IS NULL";
            const [resultC] = await Database.execute(queryC, valuesC);

            if (resultC.length === 0) {
                res.status(400).json({ data: null, msg: "Free plan not found." });
                return;
            }

            user.subscription = resultC[0];
        }

        const jwt = signAuthJwt({ email: user.email, id: user.id });
        const data = clearSensitiveData({ ...user });

        res.cookie("jwt", jwt, { httpOnly: true, secure: SHOPTRACKER_FRONT_HTTPSECURE, sameSite: "strict", domain: SHOPTRACKER_FRONT_DOMAIN, maxAge: jwtExpirationTime });
        res.status(200).json({ data: data, msg: "User successfully logged in." });
        return;
    }

    const valuesB = [email, true, true, true, true, Date.now()];
    const queryB =
        "INSERT INTO user (email, alert_email, alert_text, alert_browser_notification, alert_push_notification, created_at) VALUES (?, ?, ?, ?, ?, ?)";
    const [resultB] = await Database.execute(queryB, valuesB);

    if (resultB.affectedRows === 0) {
        res.status(400).json({ data: null, msg: "User not inserted." });
        return;
    }

    const valuesC = [resultB.insertId];
    const queryC = "SELECT * FROM user WHERE id = ?";
    const [resultC] = await Database.execute(queryC, valuesC);

    if (resultC.length === 0) {
        res.status(404).json({ data: null, msg: "User not found." });
        return;
    }

    const user = resultC[0];

    const valuesD = [];
    const queryD = "SELECT stripe_price_id, track_check_interval, track_enabled_max_products, track_disabled_max_products, track_user_max_searches_per_day FROM plan WHERE stripe_price_id IS NULL";
    const [resultD] = await Database.execute(queryD, valuesD);

    if (resultD.length === 0) {
        res.status(400).json({ data: null, msg: "Free plan not found." });
        return;
    }

    user.subscription = resultD[0];

    const jwt = signAuthJwt({ email: user.email, id: user.id });
    const data = clearSensitiveData({ ...user });

    res.cookie("jwt", jwt, { httpOnly: true, secure: SHOPTRACKER_FRONT_HTTPSECURE, sameSite: "strict", domain: SHOPTRACKER_FRONT_DOMAIN, maxAge: jwtExpirationTime });
    res.status(201).json({ data: data, msg: "User successfully created." });
});
