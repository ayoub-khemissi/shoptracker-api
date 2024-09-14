import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { createCheckoutSession, retrievePrice } from "../Modules/Stripe.js";

api.post("/checkout/session", async function (req, res) {
    const jwt = verifyAuthJwt(extractJwt(req.headers.authorization));

    if (!jwt) {
        res.status(401).json({ data: null, msg: "Unauthorized." });
        return;
    }

    const { priceId } = req.body;

    if (!await retrievePrice(priceId)) {
        res.status(400).json({ data: null, msg: "Stripe price not found or invalid." });
        return;
    }

    const valuesA = [jwt.id];
    const queryA = "SELECT stripe_customer_id FROM user WHERE id=?";
    const [resultA] = await Database.execute(queryA, valuesA);

    if (resultA.length === 0) {
        res.status(404).json({ data: null, msg: "User not found." });
        return;
    }

    const session = await createCheckoutSession(resultA[0].stripe_customer_id, priceId);

    if (!session) {
        res.status(500).json({ data: null, msg: "Failed to create checkout session." });
        return;
    }

    res.status(200).json({ data: { sessionId: session.id }, msg: "Checkout session successfully created." });
});
