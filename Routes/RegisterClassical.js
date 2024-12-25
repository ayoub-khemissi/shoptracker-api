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
const { jwtExpirationTime, subscriptionActive, cookiesSameSite } = Constants;

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
    const queryA = "SELECT id, disabled FROM user WHERE email=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length > 0) {
        const user = resultA[0];

        if (user.disabled) {
            user.disabled = false;
            user.alert_email = true;
            user.alert_text = !!user.phone;
            user.alert_browser_notification = true;
            user.alert_push_notification = true;

            const valuesB = [user.disabled, user.alert_email, user.alert_text, user.alert_browser_notification, user.alert_push_notification, user.id];
            const queryB = "UPDATE user SET disabled=?, alert_email=?, alert_text=?, alert_browser_notification=?, alert_push_notification=? WHERE id=?";
            await Database.execute(queryB, valuesB);
        } else {
            res.status(409).json({ data: null, msg: "User already exists." });
            return;
        }
    }

    const passwordSalt = generateSalt();
    const passwordHash = hashPassword(password, passwordSalt);

    const valuesC = [email, passwordSalt, passwordHash, true, false, true, true, Date.now()];
    const queryC = "INSERT INTO user (email, password_salt, password_hash, alert_email, alert_text, alert_browser_notification, alert_push_notification, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_salt=VALUES(password_salt), password_hash=VALUES(password_hash), alert_email=VALUES(alert_email), alert_text=VALUES(alert_text), alert_browser_notification=VALUES(alert_browser_notification), alert_push_notification=VALUES(alert_push_notification), created_at=VALUES(created_at)";
    const [resultC] = await Database.execute(queryC, valuesC);

    if (resultC.affectedRows === 0) {
        res.status(400).json({ data: null, msg: "User not inserted." });
        return;
    }

    const valuesD = [resultC.insertId];
    const queryD = "SELECT * FROM user WHERE id=?";
    const [resultD] = await Database.execute(queryD, valuesD);

    if (resultD.length === 0) {
        res.status(404).json({ data: null, msg: "User not found." });
        return;
    }

    const user = resultD[0];

    const valuesE = [user.id, subscriptionActive];
    const queryE = "SELECT p.stripe_price_id, s.stripe_subscription_id FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.plan_id=p.id";
    const [resultE] = await Database.execute(queryE, valuesE);

    if (resultE.length > 0) {
        user.subscription = resultE[0];

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

    res.cookie("jwt", jwt, { httpOnly: true, secure: SHOPTRACKER_FRONT_HTTPSECURE, sameSite: cookiesSameSite, domain: SHOPTRACKER_FRONT_DOMAIN, maxAge: jwtExpirationTime });
    res.status(201).json({ data: data, msg: "User successfully created." });
});
