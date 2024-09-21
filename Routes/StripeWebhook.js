import api from "../Modules/Api.js";
import Database from "../Modules/Database.js";
import Log from "../Modules/Log.js";
import { cancelSubscription, constructEvent } from "../Modules/Stripe.js";
import Constants from "../Utils/Constants.js";

const { subscriptionActive, subscriptionCanceled } = Constants;

api.post('/stripe/webhook', async function (req, res) {
    const stripeSignature = req.headers["stripe-signature"];

    const event = constructEvent(req.body, stripeSignature);

    if (!event) {
        res.sendStatus(400);
        return;
    }

    switch (event.type) {
        case "customer.subscription.created":
            {
                const subscription = event.data.object;
                const { id: customerId, email: customerEmail } = subscription.customer;
                const priceId = subscription.items.data[0].price.id;

                const valuesA = [customerId, customerEmail];
                const queryA = "SELECT id FROM user WHERE stripe_customer_id=? OR email=?";
                const [resultA] = await Database.execute(queryA, valuesA);

                if (resultA.length === 0) {
                    Log.error(`/stripe-webhook:customer.subscription.created - No user found for stripe_customer_id=${customerId} & email=${customerEmail} & subscription=${subscription.id} & price=${priceId}`);
                    res.sendStatus(400);
                    return;
                }

                const user = resultA[0];

                const valuesB = [user.id, subscriptionActive];
                const queryB = "SELECT stripe_subscription_id FROM subscription WHERE user_id=? AND status_id=?";
                const [resultB] = await Database.execute(queryB, valuesB);

                for (const sub of resultB) {
                    if (await cancelSubscription(sub.stripe_subscription_id)) {
                        const valuesC = [subscriptionCanceled, sub.stripe_subscription_id];
                        const queryC = "UPDATE subscription SET status_id=? WHERE stripe_subscription_id=?";
                        await Database.execute(queryC, valuesC);
                    } else {
                        Log.error(`/stripe-webhook:customer.subscription.created - Old subscription failed to cancel ${sub.stripe_subscription_id} for user=${user.id}-${user.email}`);
                    }
                }

                const valuesD = [user.id, subscription.id, priceId, subscriptionActive, Date.now()];
                const queryD = "INSERT INTO subscription (user_id, stripe_subscription_id, stripe_price_id, status_id, created_at) VALUES (?, ?, ?, ?, ?, ?)";
                await Database.execute(queryD, valuesD);
            }
            break;

        case "customer.subscription.deleted":
            break;

        case "customer.subscription.updated":
            break;

        default:
            break;
    }

    res.send();
});