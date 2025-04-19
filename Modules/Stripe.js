import Stripe from "stripe";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";
import Log from "./Log.js";

const {
    STRIPE_API_KEY,
    STRIPE_WEBHOOK_KEY,
    SHOPTRACKER_FRONT_PORT,
    SHOPTRACKER_FRONT_HOSTNAME,
    SHOPTRACKER_FRONT_HTTPSECURE,
} = Config;
const { subscriptionTrialPeriodDays } = Constants;

const stripe = new Stripe(STRIPE_API_KEY);

/**
 * Creates a new customer in Stripe.
 * @param {Object} customerData - The data for the new customer.
 * @returns {Promise<Object> | null} The created customer or null if an error occurs.
 */
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

/**
 * Cancels a subscription in Stripe.
 * @param {string} subscriptionId - The ID of the subscription to cancel.
 * @param {boolean} cancelAtPeriodEnd - Whether to cancel the subscription at the end of the current period.
 * @returns {Promise<Object> | null} The canceled subscription or null if an error occurs.
 */
export async function cancelSubscription(subscriptionId, cancelAtPeriodEnd = false) {
    try {
        return await stripe.subscriptions.cancel(subscriptionId, {
            cancel_at_period_end: cancelAtPeriodEnd,
        });
    } catch (error) {
        Log.error(`@Stripe:cancelSubscription - Error canceling subscription: ${error}`);
        return null;
    }
}

/**
 * Creates a checkout session for a subscription.
 * @param {string} customerId - The ID of the customer.
 * @param {string} priceId - The ID of the price.
 * @param {boolean} isFirstSubscription - Whether this is the user's first subscription.
 * @returns {Promise<Object> | null} The created checkout session or null if an error occurs.
 */
export async function createCheckoutSession(customerId, priceId, isFirstSubscription = false) {
    const frontBaseUrl = `http${SHOPTRACKER_FRONT_HTTPSECURE ? "s" : ""}://${SHOPTRACKER_FRONT_HOSTNAME}${SHOPTRACKER_FRONT_HTTPSECURE ? "" : `:${SHOPTRACKER_FRONT_PORT}`}`;

    try {
        const sessionParams = {
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
        };
        if (isFirstSubscription) {
            sessionParams.subscription_data = {
                trial_period_days: subscriptionTrialPeriodDays,
            };
        }
        return await stripe.checkout.sessions.create(sessionParams);
    } catch (error) {
        Log.error(`@Stripe:createCheckoutSession - Error creating checkout session: ${error}`);
        return null;
    }
}

/**
 * Retrieves the details of a price from Stripe.
 * @param {string} priceId - The ID of the price to retrieve.
 * @returns {Promise<Object>} The details of the price.
 */
export async function retrievePrice(priceId) {
    try {
        return await stripe.prices.retrieve(priceId);
    } catch (error) {
        Log.error(`@Stripe:retrievePrice - Error retrieving price: ${error}`);
        return null;
    }
}

/**
 * Constructs a webhook event from the provided body and signature.
 * @param {string} body - The body of the webhook request.
 * @param {string} stripeSignature - The signature of the webhook request.
 * @returns {Event | null} The constructed event or null if an error occurs.
 */
export function constructEvent(body, stripeSignature) {
    try {
        return stripe.webhooks.constructEvent(body, stripeSignature, STRIPE_WEBHOOK_KEY);
    } catch (error) {
        Log.error(`@Stripe:constructEvent - Error construct event: ${error}`);
        return null;
    }
}

/**
 * Retrieves the details of a subscription from Stripe.
 * @param {string} subscriptionId - The ID of the subscription to retrieve.
 * @returns {Promise<Object>} The details of the subscription.
 */
export async function retrieveSubscription(subscriptionId) {
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
        const billingPeriod = subscription.items.data[0].price.recurring.interval;
        const currency = subscription.items.data[0].price.currency;
        const trialEnd = subscription.trial_end * 1000;

        return {
            start_date: startDate,
            next_payment_date: nextPaymentDate,
            payment_method: paymentMethodText,
            invoice_history: invoiceHistory,
            billing_period: billingPeriod,
            currency: currency,
            trial_end: trialEnd,
        };
    } catch (error) {
        Log.error(
            `@Stripe:retrieveSubscription - Error retrieving subscription details: ${error}`,
        );
        return null;
    }
}
