import api from "../Modules/Api.js";
import { signJwt } from "../Modules/Auth.js";
import { generateSalt, hashPassword } from "../Modules/Crypto.js";
import Database from "../Modules/Database.js";
import { validateEmail, validatePassword } from "../Modules/DataValidation.js";
import { cleanStringData, clearSensitiveData } from "../Modules/DataTransformation.js";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";
import { retrieveSubscription } from "../Modules/Stripe.js";
import { verifyRecaptchaToken } from "../Modules/GoogleRecaptcha.js";
import { cloneObject, mergeObjects } from "../Modules/ObjectHandler.js";

const { SHOPTRACKER_FRONT_HTTPSECURE, SHOPTRACKER_FRONT_DOMAIN, SHOPTRACKER_COOKIES_SAME_SITE } =
    Config;
const { jwtExpirationTime, subscriptionActive, defaultSubscriptionDetails } = Constants;

api.post("/register/classical", async function (req, res) {
    const { email, password, recaptchaToken } = req.body;
    const referrerCode = cleanStringData(req.body.referrerCode);

    if (!recaptchaToken) {
        res.status(400).json({ data: null, msg: "reCAPTCHA token is required." });
        return;
    }

    if (!(await verifyRecaptchaToken(recaptchaToken, req.ip))) {
        res.status(401).json({ data: null, msg: "reCAPTCHA verification failed." });
        return;
    }

    const cleanEmail = cleanStringData(email);
    const cleanPassword = cleanStringData(password);

    if (!validateEmail(cleanEmail)) {
        res.status(400).json({ data: null, msg: "Invalid email format." });
        return;
    }

    if (!validatePassword(cleanPassword)) {
        res.status(400).json({ data: null, msg: "Invalid password format." });
        return;
    }

    const valuesA = [cleanEmail];
    const queryA = "SELECT id, disabled FROM user WHERE email=?";
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
        } else {
            res.status(409).json({ data: null, msg: "User already exists." });
            return;
        }
    }

    const passwordSalt = generateSalt();
    const passwordHash = hashPassword(cleanPassword, passwordSalt);

    const valuesC = [referrerCode];
    const queryC = "SELECT id FROM referrer WHERE code=?";
    const [resultC] = await Database.execute(queryC, valuesC);

    const referrerId = resultC.length > 0 ? resultC[0].id : null;

    const valuesD = [
        cleanEmail,
        passwordSalt,
        passwordHash,
        true,
        false,
        false,
        false,
        true,
        null,
        null,
        referrerId,
        Date.now(),
    ];
    const queryD =
        "INSERT INTO user (email, password_salt, password_hash, alert_email, alert_sms, alert_browser, alert_push, marketing_email, alert_browser_subscription, alert_push_subscription, referrer_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_salt=VALUES(password_salt), password_hash=VALUES(password_hash), alert_email=VALUES(alert_email), alert_sms=VALUES(alert_sms), alert_browser=VALUES(alert_browser), alert_push=VALUES(alert_push), marketing_email=VALUES(marketing_email), alert_browser_subscription=VALUES(alert_browser_subscription), alert_push_subscription=VALUES(alert_push_subscription), referrer_id=VALUES(referrer_id), updated_at=VALUES(created_at)";
    const [resultD] = await Database.execute(queryD, valuesD);

    if (resultD.affectedRows === 0) {
        res.status(400).json({ data: null, msg: "User not inserted." });
        return;
    }

    const valuesE = [resultD.insertId];
    const queryE = "SELECT * FROM user WHERE id=?";
    const [resultE] = await Database.execute(queryE, valuesE);

    if (resultE.length === 0) {
        res.status(404).json({ data: null, msg: "User not found." });
        return;
    }

    const user = resultE[0];

    const valuesF = [user.id, subscriptionActive];
    const queryF =
        "SELECT p.stripe_price_id, s.stripe_subscription_id FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.plan_id=p.id";
    const [resultF] = await Database.execute(queryF, valuesF);

    if (resultF.length > 0) {
        user.subscription = resultF[0];

        const subscriptionDetails = await retrieveSubscription(
            user.subscription.stripe_subscription_id,
        );
        user.subscription = mergeObjects(user.subscription, subscriptionDetails);
    } else {
        user.subscription = cloneObject(defaultSubscriptionDetails);
    }

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
