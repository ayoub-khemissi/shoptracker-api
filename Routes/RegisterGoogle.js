import api from "../Modules/Api.js";
import { signAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validateEmail } from "../Modules/DataValidation.js";
import { cleanStringData, clearSensitiveData } from "../Modules/DataTransformation.js";
import { verifyGoogleJwt } from "../Modules/GoogleAuth.js";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";
import { getSubscriptionDetails } from "../Modules/Stripe.js";

const { SHOPTRACKER_FRONT_HTTPSECURE, SHOPTRACKER_FRONT_DOMAIN, SHOPTRACKER_COOKIES_SAME_SITE } = Config;
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
            user.disabled = false;
            user.alert_email = true;
            user.alert_sms = !!user.phone;
            user.alert_browser = !!user.alert_browser_subscription;
            user.alert_push = !!user.alert_push_subscription;
            user.alert_browser_subscription = null;
            user.alert_push_subscription = null;

            const valuesB = [
                user.disabled,
                user.alert_email,
                user.alert_sms,
                user.alert_browser,
                user.alert_push,
                user.alert_browser_subscription,
                user.alert_push_subscription,
                Date.now(),
                user.id,
            ];
            const queryB =
                "UPDATE user SET disabled=?, alert_email=?, alert_sms=?, alert_browser=?, alert_push=?, alert_browser_subscription=?, alert_push_subscription=?, updated_at=? WHERE id=?";
            await Database.execute(queryB, valuesB);
        }

        const valuesC = [user.id, subscriptionActive];
        const queryC =
            "SELECT p.stripe_price_id, s.stripe_subscription_id FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.plan_id=p.id";
        const [resultC] = await Database.execute(queryC, valuesC);

        if (resultC.length > 0) {
            user.subscription = resultC[0];

            const subscriptionDetails = await getSubscriptionDetails(
                user.subscription.stripe_subscription_id,
            );
            user.subscription = { ...user.subscription, ...subscriptionDetails };
        } else {
            user.subscription = {
                stripe_price_id: null,
                stripe_subscription_id: null,
                start_date: null,
                next_payment_date: null,
                payment_method: null,
                invoice_history: [],
            };
        }

        const jwt = signAuthJwt({ email: user.email, id: user.id });
        const data = clearSensitiveData({ ...user });

        res.cookie("jwt", jwt, {
            httpOnly: true,
            secure: SHOPTRACKER_FRONT_HTTPSECURE,
            sameSite: SHOPTRACKER_COOKIES_SAME_SITE,
            domain: SHOPTRACKER_FRONT_DOMAIN,
            maxAge: jwtExpirationTime,
        });
        res.status(200).json({ data: data, msg: "User successfully logged in." });
        return;
    }

    const valuesB = [email, true, false, false, false, null, null, Date.now()];
    const queryB =
        "INSERT INTO user (email, alert_email, alert_sms, alert_browser, alert_push, alert_browser_subscription, alert_push_subscription, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
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
    const queryD =
        "SELECT p.stripe_price_id, s.stripe_subscription_id FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.plan_id=p.id";
    const [resultD] = await Database.execute(queryD, valuesD);

    if (resultD.length > 0) {
        user.subscription = resultB[0];

        const subscriptionDetails = await getSubscriptionDetails(
            user.subscription.stripe_subscription_id,
        );
        user.subscription = { ...user.subscription, ...subscriptionDetails };
    } else {
        user.subscription = {
            stripe_price_id: null,
            stripe_subscription_id: null,
            start_date: null,
            next_payment_date: null,
            payment_method: null,
            invoice_history: [],
        };
    }

    const jwt = signAuthJwt({ email: user.email, id: user.id });
    const data = clearSensitiveData({ ...user });

    res.cookie("jwt", jwt, {
        httpOnly: true,
        secure: SHOPTRACKER_FRONT_HTTPSECURE,
        sameSite: SHOPTRACKER_COOKIES_SAME_SITE,
        domain: SHOPTRACKER_FRONT_DOMAIN,
        maxAge: jwtExpirationTime,
    });
    res.status(201).json({ data: data, msg: "User successfully created." });
});
