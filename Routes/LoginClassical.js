import api from "../Modules/Api.js";
import { signAuthJwt } from "../Modules/Auth.js";
import { hashPassword } from "../Modules/Crypto.js";
import Database from "../Modules/Database.js";
import { validateEmail, validatePassword } from "../Modules/DataValidation.js";
import { clearSensitiveData } from "../Modules/DataTransformation.js";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";
import { retrieveSubscription } from "../Modules/Stripe.js";
import { cloneObject, mergeObjects } from "../Utils/ObjectHandler.js";

const { SHOPTRACKER_FRONT_HTTPSECURE, SHOPTRACKER_FRONT_DOMAIN, SHOPTRACKER_COOKIES_SAME_SITE } = Config;
const { jwtExpirationTime, subscriptionActive, defaultSubscriptionDetails } = Constants;

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

    if (resultA.length === 0 || resultA[0].disabled) {
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
    const queryB =
        "SELECT p.stripe_price_id, s.stripe_subscription_id FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.plan_id=p.id";
    const [resultB] = await Database.execute(queryB, valuesB);

    if (resultB.length > 0) {
        user.subscription = resultB[0];

        const subscriptionDetails = await retrieveSubscription(
            user.subscription.stripe_subscription_id,
        );
        user.subscription = mergeObjects(user.subscription, subscriptionDetails);
    } else {
        user.subscription = cloneObject(defaultSubscriptionDetails);
    }

    const valuesC = [user.id];
    const queryC =
        "SELECT MIN(created_at) AS first_subscription_date FROM subscription WHERE user_id=?";
    const [resultC] = await Database.execute(queryC, valuesC);

    const { first_subscription_date } = resultC[0];
    user.subscription.first_subscription_date = first_subscription_date || null;

    const jwt = signAuthJwt({ email: user.email, id: user.id });
    const data = clearSensitiveData(cloneObject(user));

    res.cookie("jwt", jwt, {
        httpOnly: true,
        secure: SHOPTRACKER_FRONT_HTTPSECURE,
        sameSite: SHOPTRACKER_COOKIES_SAME_SITE,
        domain: SHOPTRACKER_FRONT_DOMAIN,
        maxAge: jwtExpirationTime,
    });
    res.status(200).json({ data: data, msg: "User successfully logged in." });
});
