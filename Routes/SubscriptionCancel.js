import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { cancelSubscription, retrieveSubscription } from "../Modules/Stripe.js";
import Constants from "../Utils/Constants.js";

const { subscriptionActive, subscriptionCanceled } = Constants;

api.delete("/subscription/cancel", async function (req, res) {
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
    const queryA = "SELECT stripe_subscription_id FROM subscription WHERE user_id=? AND status_id=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length === 0) {
        res.status(404).json({ data: null, msg: "No active subscription found for the user." });
        return;
    }

    const stripeSubscriptionId = resultA[0].stripe_subscription_id;

    const subscription = await retrieveSubscription(stripeSubscriptionId);
    if (!subscription) {
        res.status(400).json({ data: null, msg: "Stripe subscription not found or invalid." });
        return;
    }

    if (subscription.status !== "active") {
        res.status(400).json({ data: null, msg: "Stripe subscription not active." });
        return;
    }

    const canceledSubscription = await cancelSubscription(stripeSubscriptionId);

    if (!canceledSubscription) {
        res.status(400).json({ data: null, msg: "Stripe subscription cannot be canceled." });
        return;
    }

    const valuesB = [subscriptionCanceled, stripeSubscriptionId];
    const queryB = "UPDATE subscription SET status_id=? WHERE stripe_subscription_id=?";
    await Database.execute(queryB, valuesB);

    res.status(200).json({ data: null, msg: "Subscription successfully canceled." });
});
