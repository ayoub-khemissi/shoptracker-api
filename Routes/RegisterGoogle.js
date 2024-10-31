import api from "../Modules/Api.js";
import { signAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validateEmail } from "../Modules/DataValidation.js";
import { cleanStringData, clearSensitiveData } from "../Modules/DataTransformation.js";
import { verifyGoogleJwt } from "../Modules/GoogleAuth.js";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";
import { getSubscriptionDetails } from "../Modules/Stripe.js";

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

        if (user.disabled) {
            const valuesB = [false, user.id];
            const queryB = "UPDATE user SET disabled=? WHERE id=?";
            await Database.execute(queryB, valuesB);
        }

        const valuesC = [user.id, subscriptionActive];
        const queryC = "SELECT p.stripe_price_id, s.stripe_subscription_id FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.plan_id=p.id";
        const [resultC] = await Database.execute(queryC, valuesC);

        if (resultC.length > 0) {
            user.subscription = resultC[0];

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

    const jwt = signAuthJwt({ email: user.email, id: user.id });
    const data = clearSensitiveData({ ...user });

    res.cookie("jwt", jwt, { httpOnly: true, secure: SHOPTRACKER_FRONT_HTTPSECURE, sameSite: "strict", domain: SHOPTRACKER_FRONT_DOMAIN, maxAge: jwtExpirationTime });
    res.status(201).json({ data: data, msg: "User successfully created." });
});
