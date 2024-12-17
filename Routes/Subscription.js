import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { getSubscriptionDetails } from "../Modules/Stripe.js";
import Constants from "../Utils/Constants.js";

const { subscriptionActive } = Constants;

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
    const queryA = "SELECT p.stripe_price_id, s.stripe_subscription_id FROM subscription s, plan p WHERE s.user_id=? AND s.status_id=? AND s.plan_id=p.id";
    const [resultA] = await Database.execute(queryA, valuesA);

    let subscription = null;
    if (resultA.length > 0) {
        subscription = resultA[0];

        const subscriptionDetails = await getSubscriptionDetails(subscription.stripe_subscription_id);
        subscription = { ...subscription, ...subscriptionDetails };
    } else {
        subscription = {
            stripe_price_id: null,
            stripe_subscription_id: null,
            start_date: null,
            next_payment_date: null,
            payment_method: null,
            invoice_history: [],
        }
    }

    res.status(200).json({ data: subscription, msg: "Subscription successfully found." });
});