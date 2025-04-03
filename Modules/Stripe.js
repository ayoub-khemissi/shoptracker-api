import Stripe from "stripe";
import Config from "../Utils/Config.js";
import Log from "./Log.js";

const {
    STRIPE_API_KEY,
    STRIPE_WEBHOOK_KEY,
    SHOPTRACKER_FRONT_PORT,
    SHOPTRACKER_FRONT_HOSTNAME,
    SHOPTRACKER_FRONT_HTTPSECURE,
} = Config;

const stripe = new Stripe(STRIPE_API_KEY);

export async function createCustomer(customerData) {
    try {
        return await stripe.customers.create({
            ...customerData,
        });
    } catch (error) {
        Log.error(`@Stripe:createCustomer - Error creating customer: ${error}`);
        return null;
    }
}

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

export async function cancelSubscription(subscriptionId) {
    try {
        return await stripe.subscriptions.cancel(subscriptionId, {
            prorate: true,
        });
    } catch (error) {
        Log.error(`@Stripe:cancelSubscription - Error canceling subscription: ${error}`);
        return null;
    }
}

export async function updateSubscription(subscriptionId, newPriceId) {
    try {
        return await stripe.subscriptions.update(subscriptionId, {
            items: [
                {
                    id: subscriptionId,
                    price: newPriceId,
                },
            ],
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
        return await stripe.checkout.sessions.create({
            payment_method_types: ["card", "paypal"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${frontBaseUrl}/settings?tab=subscription`,
            cancel_url: `${frontBaseUrl}/pricing`,
            customer: customerId,
        });
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

export function constructEvent(body, stripeSignature) {
    try {
        return stripe.webhooks.constructEvent(body, stripeSignature, STRIPE_WEBHOOK_KEY);
    } catch (error) {
        Log.error(`@Stripe:constructEvent - Error construct event: ${error}`);
        return null;
    }
}

export async function getSubscriptionDetails(subscriptionId) {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        let paymentMethodText = null;
        if (subscription.default_payment_method) {
            const paymentMethod = await stripe.paymentMethods.retrieve(
                subscription.default_payment_method,
            );

            switch (paymentMethod?.type) {
                case "card":
                    paymentMethodText = `${paymentMethod.card.brand} ${paymentMethod.card.last4}`;
                    break;
                case "paypal":
                    paymentMethodText = "PayPal";
                    break;
                case "sepa_debit":
                    paymentMethodText = "SEPA";
                    break;
                default:
                    paymentMethodText = paymentMethod.type
                        ?.toLocaleUpperCase()
                        .replaceAll("_", " ");
                    break;
            }
        }

        const invoices = await stripe.invoices.list({
            subscription: subscriptionId,
            limit: 6,
            status: "paid",
        });

        const invoiceHistory = invoices.data
            .filter((invoice) => invoice.amount_paid > 0 || invoice.amount_paid < 0)
            .map((invoice) => ({
                number: invoice.number,
                date: invoice.created * 1000,
                amount: (invoice.amount_paid / 100).toFixed(2),
                currency: invoice.currency,
                url: invoice.hosted_invoice_url,
            }));

        const startDate = subscription.start_date * 1000;
        const nextPaymentDate = subscription.current_period_end * 1000;

        return {
            start_date: startDate,
            next_payment_date: nextPaymentDate,
            payment_method: paymentMethodText,
            invoice_history: invoiceHistory,
            billing_period: subscription.items.data[0].price.recurring.interval,
            currency: subscription.items.data[0].price.currency
        };
    } catch (error) {
        Log.error(
            `@Stripe:getSubscriptionDetails - Error retrieving subscription details: ${error}`,
        );
        return null;
    }
}
