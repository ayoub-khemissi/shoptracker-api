import api from "../Modules/Api.js";
import { signJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validateEmail } from "../Modules/DataValidation.js";
import { cleanStringData, clearSensitiveData } from "../Modules/DataTransformation.js";
import { verifyGoogleJwt } from "../Modules/GoogleAuth.js";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";
import { retrieveSubscription } from "../Modules/Stripe.js";
import { cloneObject, mergeObjects } from "../Modules/ObjectHandler.js";

const { SHOPTRACKER_FRONT_HTTPSECURE, SHOPTRACKER_FRONT_DOMAIN, SHOPTRACKER_COOKIES_SAME_SITE } =
    Config;
const { jwtExpirationTime, subscriptionActive, defaultSubscriptionDetails } = Constants;

api.post("/register/google", async function (req, res) {
    const email = cleanStringData(req.body.email);
    const googleJwt = cleanStringData(req.body.googleJwt);
    const referrerCode = cleanStringData(req.body.referrerCode);

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
            user.marketing_email = true;
            user.alert_browser_subscription = null;
            user.alert_push_subscription = null;

            const valuesB = [
                user.disabled,
                user.alert_email,
                user.alert_sms,
                user.alert_browser,
                user.alert_push,
                user.marketing_email,
                user.alert_browser_subscription,
                user.alert_push_subscription,
                Date.now(),
                user.id,
            ];
            const queryB =
                "UPDATE user SET disabled=?, alert_email=?, alert_sms=?, alert_browser=?, alert_push=?, marketing_email=?, alert_browser_subscription=?, alert_push_subscription=?, updated_at=? WHERE id=?";
            await Database.execute(queryB, valuesB);
        }

        const valuesC = [user.id, subscriptionActive];
        const queryC =
            "SELECT p.stripe_price_id, s.stripe_subscription_id FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.plan_id=p.id";
        const [resultC] = await Database.execute(queryC, valuesC);

        if (resultC.length > 0) {
            user.subscription = resultC[0];

            const subscriptionDetails = await retrieveSubscription(
                user.subscription.stripe_subscription_id,
            );
            user.subscription = mergeObjects(user.subscription, subscriptionDetails);
        } else {
            user.subscription = cloneObject(defaultSubscriptionDetails);
        }

        const valuesD = [user.id];
        const queryD =
            "SELECT MIN(created_at) AS first_subscription_date, MAX(created_at) AS last_subscription_date FROM subscription WHERE user_id=?";
        const [resultD] = await Database.execute(queryD, valuesD);

        const { first_subscription_date, last_subscription_date } = resultD[0];
        user.subscription.first_subscription_date = first_subscription_date || null;
        user.subscription.last_subscription_date = last_subscription_date || null;

        const jwt = signJwt({ email: user.email, id: user.id });
        const data = clearSensitiveData(cloneObject(user));

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

    const valuesB = [referrerCode];
    const queryB = "SELECT id FROM referrer WHERE code=?";
    const [resultB] = await Database.execute(queryB, valuesB);

    const referrerId = resultB.length > 0 ? resultB[0].id : null;

    const valuesC = [email, true, false, false, false, true, null, null, referrerId, Date.now()];
    const queryC =
        "INSERT INTO user (email, alert_email, alert_sms, alert_browser, alert_push, marketing_email, alert_browser_subscription, alert_push_subscription, referrer_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const [resultC] = await Database.execute(queryC, valuesC);

    if (resultC.affectedRows === 0) {
        res.status(400).json({ data: null, msg: "User not inserted." });
        return;
    }

    const valuesD = [resultC.insertId];
    const queryD = "SELECT * FROM user WHERE id = ?";
    const [resultD] = await Database.execute(queryD, valuesD);

    if (resultD.length === 0) {
        res.status(404).json({ data: null, msg: "User not found." });
        return;
    }

    const user = resultD[0];

    const valuesE = [user.id, subscriptionActive];
    const queryE =
        "SELECT p.stripe_price_id, s.stripe_subscription_id FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.plan_id=p.id";
    const [resultE] = await Database.execute(queryE, valuesE);

    if (resultE.length > 0) {
        user.subscription = resultE[0];

        const subscriptionDetails = await retrieveSubscription(
            user.subscription.stripe_subscription_id,
        );
        user.subscription = mergeObjects(user.subscription, subscriptionDetails);
    } else {
        user.subscription = cloneObject(defaultSubscriptionDetails);
    }

    const valuesF = [user.id];
    const queryF =
        "SELECT MIN(created_at) AS first_subscription_date, MAX(created_at) AS last_subscription_date FROM subscription WHERE user_id=?";
    const [resultF] = await Database.execute(queryF, valuesF);

    const { first_subscription_date, last_subscription_date } = resultF[0];
    user.subscription.first_subscription_date = first_subscription_date || null;
    user.subscription.last_subscription_date = last_subscription_date || null;

    const jwt = signJwt({ email: user.email, id: user.id });
    const data = clearSensitiveData(cloneObject(user));

    res.cookie("jwt", jwt, {
        httpOnly: true,
        secure: SHOPTRACKER_FRONT_HTTPSECURE,
        sameSite: SHOPTRACKER_COOKIES_SAME_SITE,
        domain: SHOPTRACKER_FRONT_DOMAIN,
        maxAge: jwtExpirationTime,
    });
    res.status(201).json({ data: data, msg: "User successfully created." });
});
