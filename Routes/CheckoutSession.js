import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { createCheckoutSession, createCustomer, retrievePrice } from "../Modules/Stripe.js";

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

    const { priceId } = req.body;

    if (!await retrievePrice(priceId)) {
        res.status(400).json({ data: null, msg: "Stripe price not found or invalid." });
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

    if (!user.stripe_customer_id) {
        const customer = await createCustomer({ email: user.email });
        user.stripe_customer_id = customer.id;

        const valuesB = [customer.id, jwt.id];
        const queryB = "UPDATE user SET stripe_customer_id=? WHERE id=?";
        await Database.execute(queryB, valuesB);
    }

    const session = await createCheckoutSession(user.stripe_customer_id, priceId);

    if (!session) {
        res.status(500).json({ data: null, msg: "Failed to create checkout session." });
        return;
    }

    res.status(200).json({ data: { sessionId: session.id }, msg: "Checkout session successfully created." });
});
