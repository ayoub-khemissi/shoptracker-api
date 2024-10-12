import api from "../Modules/Api.js";
import { signAuthJwt } from "../Modules/Auth.js";
import { hashPassword } from "../Modules/Crypto.js";
import Database from "../Modules/Database.js";
import { validateEmail, validatePassword } from "../Modules/DataValidation.js";
import { clearSensitiveData } from "../Modules/DataTransformation.js";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";

const { SHOPTRACKER_FRONT_HTTPSECURE } = Config;
const { jwtExpirationTime, subscriptionActive } = Constants;

api.post("/login/classical", async function (req, res) {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
        res.status(400).json({ data: null, msg: "Invalid email format." });
        return;
    }

    if (!validatePassword(password)) {
        res.status(400).json({ data: null, msg: "Invalid password format." });
        return;
    }

    const valuesA = [email];
    const queryA = "SELECT * FROM user WHERE email=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length === 0) {
        res.status(404).json({ data: null, msg: "Bad credentials." });
        return;
    }

    const user = resultA[0];

    const passwordSalt = user.password_salt;
    const passwordHash = hashPassword(password, passwordSalt);
    const realPasswordHash = user.password_hash;

    if (!passwordSalt || !passwordHash || !realPasswordHash || passwordHash !== realPasswordHash) {
        res.status(404).json({ data: null, msg: "Bad credentials." });
        return;
    }

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

    res.cookie("jwt", jwt, { httpOnly: true, secure: SHOPTRACKER_FRONT_HTTPSECURE, maxAge: jwtExpirationTime, sameSite: "lax" });
    res.status(200).json({ data: data, msg: "User successfully logged in." });
});
