import Stripe from "stripe";
import Config from "../Utils/Config.js";
import Log from "./Log.js";

const { STRIPE_API_KEY, SHOPTRACKER_FRONT_PORT, SHOPTRACKER_FRONT_HOSTNAME, SHOPTRACKER_FRONT_HTTPSECURE } = Config;

const stripe = new Stripe(STRIPE_API_KEY);

export async function updateCustomer(customerId, updateData) {
    try {
        return await stripe.customers.update(customerId, updateData);
    } catch (error) {
        Log.error(`@Stripe:updateCustomer - Error updating customer: ${error}`);
        return null;
    }
}

export async function retrieveCustomer(customerId) {
    try {
        return await stripe.customers.retrieve(customerId);
    } catch (error) {
        Log.error(`@Stripe:retrieveCustomer - Error retrieving customer: ${error}`);
        return null;
    }
}

export async function cancelSubscriptionWithRefund(subscriptionId) {
    try {
        return await stripe.subscriptions.del(subscriptionId, {
            prorate: true
        });
    } catch (error) {
        Log.error(`@Stripe:cancelSubscriptionWithRefund - Error canceling subscription with refund: ${error}`);
        return null;
    }
}

export async function cancelSubscriptionAtPeriodEnd(subscriptionId) {
    try {
        return await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });
    } catch (error) {
        Log.error(`@Stripe:cancelSubscriptionAtPeriodEnd - Error scheduling subscription cancellation: ${error}`);
        return null;
    }
}

export async function updateSubscription(subscriptionId, newPriceId, newMetadata = {}) {
    try {
        return await stripe.subscriptions.update(subscriptionId, {
            items: [{
                id: subscriptionId,
                price: newPriceId,
            }],
            metadata: newMetadata
        });
    } catch (error) {
        Log.error(`@Stripe:updateSubscription - Error updating subscription: ${error}`);
        return null;
    }
}

export async function retrieveSubscription(subscriptionId) {
    try {
        return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
        Log.error(`@Stripe:retrieveSubscription - Error retrieving subscription: ${error}`);
        return null;
    }
}

export async function createCheckoutSession(customerId, priceId) {
    const frontBaseUrl = `http${SHOPTRACKER_FRONT_HTTPSECURE ? "s" : ""}://${SHOPTRACKER_FRONT_HOSTNAME}${SHOPTRACKER_FRONT_HTTPSECURE ? "" : `:${SHOPTRACKER_FRONT_PORT}`}`;

    try {
        const checkoutSessionParams = {
            payment_method_types: ["card", "paypal"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${frontBaseUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontBaseUrl}/subscribe`,
        };

        if (customerId) {
            checkoutSessionParams.customer = customerId;
        }

        const session = await stripe.checkout.sessions.create(checkoutSessionParams);
        return session;
    } catch (error) {
        Log.error(`@Stripe:createCheckoutSession - Error creating checkout session: ${error}`);
        return null;
    }
}

export async function retrievePrice(priceId) {
    try {
        return await stripe.prices.retrieve(priceId);
    } catch (error) {
        Log.error(`@Stripe:retrievePrice - Error retrieving price: ${error}`);
        return null;
    }
}
