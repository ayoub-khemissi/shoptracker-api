import api from "../Modules/Api.js";
import { signAuthJwt } from "../Modules/Auth.js";
import { generateSalt, hashPassword } from "../Modules/Crypto.js";
import Database from "../Modules/Database.js";
import { validateEmail, validatePassword } from "../Modules/DataValidation.js";
import { cleanStringData, clearSensitiveData } from "../Modules/DataTransformation.js";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";
import { getSubscriptionDetails } from "../Modules/Stripe.js";

const { SHOPTRACKER_FRONT_HTTPSECURE, SHOPTRACKER_FRONT_DOMAIN } = Config;
const { jwtExpirationTime, subscriptionActive } = Constants;

api.post("/register/classical", async function (req, res) {
    const email = cleanStringData(req.body.email);
    const password = cleanStringData(req.body.password);

    if (!validateEmail(email)) {
        res.status(400).json({ data: null, msg: "Invalid email format." });
        return;
    }

    if (!validatePassword(password)) {
        res.status(400).json({ data: null, msg: "Invalid password format." });
        return;
    }

    const valuesA = [email];
    const queryA = "SELECT 1 FROM user WHERE email=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length > 0) {
        res.status(409).json({ data: null, msg: "User already exists." });
        return;
    }

    const passwordSalt = generateSalt();
    const passwordHash = hashPassword(password, passwordSalt);

    const valuesB = [email, passwordSalt, passwordHash, true, true, true, true, Date.now()];
    const queryB =
        "INSERT INTO user (email, password_salt, password_hash, alert_email, alert_text, alert_browser_notification, alert_push_notification, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
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

    const valuesD = [user.id, subscriptionActive];
    const queryD = "SELECT p.stripe_price_id, s.stripe_subscription_id FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.plan_id=p.id";
    const [resultD] = await Database.execute(queryD, valuesD);

    if (resultD.length > 0) {
        user.subscription = resultB[0];

        const subscriptionDetails = await getSubscriptionDetails(user.subscription.stripe_subscription_id);
        user.subscription = { ...user.subscription, ...subscriptionDetails };
    } else {
        user.subscription = {
            stripe_price_id: null,
            stripe_subscription_id: null,
            start_date: null,
            next_payment_date: null,
            payment_method: null,
            invoice_history: [],
        }
    }

    const jwt = signAuthJwt({ email: user.email, id: user.id })
    const data = clearSensitiveData({ ...user });

    res.cookie("jwt", jwt, { httpOnly: true, secure: SHOPTRACKER_FRONT_HTTPSECURE, sameSite: "strict", domain: SHOPTRACKER_FRONT_DOMAIN, maxAge: jwtExpirationTime });
    res.status(201).json({ data: data, msg: "User successfully created." });
});
