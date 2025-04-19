import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { retrieveSubscription } from "../Modules/Stripe.js";
import Constants from "../Utils/Constants.js";
import { cloneObject, mergeObjects } from "../Utils/ObjectHandler.js";

const { subscriptionActive, defaultSubscriptionDetails } = Constants;

api.get("/subscription", async function (req, res) {
    const jwt = verifyAuthJwt(extractJwt(req.cookies));

    if (!jwt) {
        res.status(401).json({ data: null, msg: "Unauthorized." });
        return;
    }

    const valuesAuth = [jwt.id, false];
    const queryAuth = "SELECT 1 FROM user WHERE id=? AND disabled=?";
    const [resultAuth] = await Database.execute(queryAuth, valuesAuth);

    if (resultAuth.length === 0) {
        res.status(404).json({ data: null, msg: "User not found or disabled." });
        return;
    }

    const valuesA = [jwt.id, subscriptionActive];
    const queryA =
        "SELECT p.stripe_price_id, s.stripe_subscription_id FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.plan_id=p.id";
    const [resultA] = await Database.execute(queryA, valuesA);

    let subscription = cloneObject(defaultSubscriptionDetails);
    if (resultA.length > 0) {
        subscription = resultA[0];

        const subscriptionDetails = await retrieveSubscription(
            subscription.stripe_subscription_id,
        );
        subscription = mergeObjects(subscription, subscriptionDetails);
    }

    const valuesD = [jwt.id];
    const queryD =
        "SELECT MIN(created_at) AS first_subscription_date FROM subscription WHERE user_id=?";
    const [resultD] = await Database.execute(queryD, valuesD);

    const { first_subscription_date } = resultD[0];
    subscription.first_subscription_date = first_subscription_date || null;

    res.status(200).json({ data: subscription, msg: "Subscription successfully found." });
});
