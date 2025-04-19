import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { createCheckoutSession, createCustomer, retrievePrice } from "../Modules/Stripe.js";
import Constants from "../Utils/Constants.js";

const { subscriptionActive } = Constants;

api.post("/checkout/session", async function (req, res) {
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

    const { stripePriceId } = req.body;

    const price = await retrievePrice(stripePriceId);
    if (!price || !price.active) {
        res.status(400).json({ data: null, msg: "Stripe price not found or disabled." });
        return;
    }

    const valuesA = [jwt.id];
    const queryA = "SELECT email, stripe_customer_id FROM user WHERE id=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length === 0) {
        res.status(404).json({ data: null, msg: "User not found." });
        return;
    }

    const user = resultA[0];

    const valuesB = [jwt.id, subscriptionActive];
    const queryB = "SELECT stripe_price_id FROM plan WHERE id=(SELECT plan_id FROM subscription WHERE user_id=? AND status_id=?)";
    const [resultB] = await Database.execute(queryB, valuesB);

    if (resultB.length > 0) {
        const { stripe_price_id } = resultB[0];

        if (stripe_price_id === stripePriceId) {
            res.status(400).json({ data: null, msg: "This subscription is already active." });
            return;
        }
    }

    if (!user.stripe_customer_id) {
        const customer = await createCustomer({ email: user.email });
        user.stripe_customer_id = customer.id;

        const valuesC = [customer.id, jwt.id];
        const queryC = "UPDATE user SET stripe_customer_id=? WHERE id=?";
        await Database.execute(queryC, valuesC);
    }

    const valuesD = [jwt.id];
    const queryD =
        "SELECT MIN(created_at) AS first_subscription_date FROM subscription WHERE user_id=?";
    const [resultD] = await Database.execute(queryD, valuesD);

    const { first_subscription_date } = resultD[0];
    const isFirstSubscription = first_subscription_date === null;

    const session = await createCheckoutSession(
        user.stripe_customer_id,
        stripePriceId,
        isFirstSubscription,
    );

    if (!session) {
        res.status(400).json({ data: null, msg: "Failed to create a checkout session." });
        return;
    }

    res.status(200).json({
        data: session.id,
        msg: "Checkout session successfully created.",
    });
});
