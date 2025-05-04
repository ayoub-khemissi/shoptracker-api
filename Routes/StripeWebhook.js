import api from "../Modules/Api.js";
import Database from "../Modules/Database.js";
import Log from "../Modules/Log.js";
import { cancelSubscription, constructEvent, retrieveSubscription } from "../Modules/Stripe.js";
import { sendEmail } from "../Modules/Mailer.js";
import { formatBodyForSubscriptionConfirmation } from "../Modules/ServicesMailFormatter.js";
import Constants from "../Utils/Constants.js";

const { subscriptionActive, subscriptionCanceled } = Constants;

api.post("/stripe/webhook", async function (req, res) {
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
                const priceId = subscription.items.data[0].price.id;

                const valuesA = [subscription.customer];
                const queryA = "SELECT id, email FROM user WHERE stripe_customer_id=?";
                const [resultA] = await Database.execute(queryA, valuesA);

                if (resultA.length === 0) {
                    Log.error(
                        `/stripe-webhook:customer.subscription.created - No user found for stripe_customer_id=${subscription.customer} & subscription=${subscription.id} & price=${priceId}`,
                    );
                    res.sendStatus(400);
                    return;
                }

                const user = resultA[0];

                const valuesB = [user.id, subscriptionActive];
                const queryB =
                    "SELECT stripe_subscription_id FROM subscription WHERE user_id=? AND status_id=?";
                const [resultB] = await Database.execute(queryB, valuesB);

                for (const sub of resultB) {
                    if (!(await cancelSubscription(sub.stripe_subscription_id))) {
                        Log.error(
                            `/stripe-webhook:customer.subscription.created - Old subscription failed to cancel subscription=${sub.stripe_subscription_id} for user=${user.id}-${user.email}`,
                        );
                        res.sendStatus(400);
                        return;
                    }
                }

                const valuesD = [priceId];
                const queryD =
                    "SELECT id, name, price, track_enabled_max_products, track_disabled_max_products, track_check_interval, track_user_max_searches_per_day FROM plan WHERE stripe_price_id=?";
                const [resultD] = await Database.execute(queryD, valuesD);

                if (resultD.length === 0) {
                    Log.error(
                        `/stripe-webhook:customer.subscription.created - No plan found for stripe_customer_id=${subscription.customer} & subscription=${subscription.id} & price=${priceId}`,
                    );
                    res.sendStatus(400);
                    return;
                }

                const plan = resultD[0];

                const valuesE = [user.id, subscription.id, plan.id, subscriptionActive, Date.now()];
                const queryE =
                    "INSERT INTO subscription (user_id, stripe_subscription_id, plan_id, status_id, created_at) VALUES (?, ?, ?, ?, ?)";
                const [resultE] = await Database.execute(queryE, valuesE);

                if (resultE.affectedRows === 0) {
                    Log.error(
                        `/stripe-webhook:customer.subscription.created - Subscription failed to insert in database subscription=${subscription.id} for user=${user.id}-${user.email}`,
                    );
                    res.sendStatus(400);
                    return;
                }

                // Get subscription details for email
                const subscriptionDetails = await retrieveSubscription(subscription.id);

                if (!subscriptionDetails) {
                    Log.error(
                        `/stripe-webhook:customer.subscription.created - Subscription failed to get subscription details subscription=${subscription.id} for user=${user.id}-${user.email}`,
                    );
                    res.sendStatus(400);
                    return;
                }

                // Format and send confirmation email
                const emailBody = formatBodyForSubscriptionConfirmation(plan, subscriptionDetails);

                await sendEmail(
                    user.email,
                    "Welcome to Your New ShopTracker Plan! 🎉",
                    emailBody,
                    "Subscription",
                );
            }
            break;

        case "customer.subscription.deleted":
            {
                const subscription = event.data.object;
                const valuesA = [subscription.id, subscriptionActive];
                const queryA =
                    "SELECT stripe_subscription_id FROM subscription WHERE stripe_subscription_id=? AND status_id=?";
                const [resultA] = await Database.execute(queryA, valuesA);

                if (resultA.length === 0) {
                    Log.error(
                        `/stripe-webhook:customer.subscription.deleted - No subscription found for stripe_subscription_id=${subscription.id}`,
                    );
                    res.sendStatus(400);
                    return;
                }

                const valuesB = [subscriptionCanceled, Date.now(), subscription.id];
                const queryB = "UPDATE subscription SET status_id=?, updated_at=? WHERE stripe_subscription_id=?";
                await Database.execute(queryB, valuesB);
            }
            break;

        case "invoice.paid":
            {
                const invoice = event.data.object;

                const valuesA = [invoice.customer];
                const queryA = "SELECT id, email FROM user WHERE stripe_customer_id=?";
                const [resultA] = await Database.execute(queryA, valuesA);

                if (resultA.length === 0) {
                    Log.error(
                        `/stripe-webhook:invoice.paid - No user found for stripe_customer_id=${invoice.customer}`,
                    );
                    res.sendStatus(400);
                    return;
                }

                const user = resultA[0];

                const valuesB = [invoice.id, user.id, invoice.amount_paid, invoice.currency, invoice.discount_code, Date.now()];
                const queryB =
                    "INSERT INTO invoice (invoice_id, user_id, amount_paid, currency, discount_code, created_at) VALUES (?, ?, ?, ?, ?, ?)";
                const [resultB] = await Database.execute(queryB, valuesB);

                if (resultB.affectedRows === 0) {
                    Log.error(
                        `/stripe-webhook:invoice.paid - Invoice failed to insert in database invoice=${invoice.id} for user=${user.id}-${user.email}`,
                    );
                    res.sendStatus(400);
                    return;
                }
            }
            break;

        default:
            break;
    }

    res.send();
});
