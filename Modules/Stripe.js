import Stripe from "stripe";
import Config from "../Utils/Config.js";
import Log from "./Log.js";

const { stripeApiKey } = Config;

const stripe = new Stripe(stripeApiKey);

export async function createPaymentMethod(cardNumber, expMonth, expYear, cvc) {
    try {
        return stripe.paymentMethods.create({
            type: "card",
            card: {
                number: cardNumber,
                exp_month: expMonth,
                exp_year: expYear,
                cvc: cvc,
            },
        });
    } catch (error) {
        Log.error("@Stripe:createPaymentMethod - an error occurred: " + error);
        return null;
    }
}

export async function createCustomer(email, paymentMethodId, firstname, lastname, city, country, address, zipcode) {
    try {
        return stripe.customers.create({
            email,
            payment_method: paymentMethodId,
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
            name: `${firstname} ${lastname}`,
            address: {
                city: city,
                country: country,
                line1: address,
                postal_code: zipcode,
            },
        });
    } catch (error) {
        Log.error("@Stripe:createCustomer - an error occurred: " + error);
        return null;
    }
}

export async function createSubscription(customerId, priceId) {
    try {
        return stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            expand: ["latest_invoice.payment_intent"],
        });
    } catch (error) {
        Log.error("@Stripe:createSubscription - an error occurred: " + error);
        return null;
    }
}

export async function createPrice(productId, unitAmount, currency) {
    try {
        return stripe.prices.create({
            unit_amount: unitAmount,
            currency: currency,
            recurring: {
                interval: "month",
            },
            product: productId,
        });
    } catch (error) {
        Log.error("@Stripe:createPrice - an error occurred: " + error);
        return null;
    }
}

export async function createRefund(paymentIntentId, amount) {
    try {
        return stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount,
        });
    } catch (error) {
        Log.error("@Stripe:createRefund - an error occurred: " + error);
        return null;
    }
}

export async function cancelSubscription(subscriptionId) {
    try {
        return stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
        Log.error("@Stripe:cancelSubscription - an error occurred: " + error);
        return null;
    }
}

export async function updatePaymentMethod(paymentMethodId, cardNumber, expMonth, expYear, cvc) {
    try {
        return stripe.paymentMethods.update(paymentMethodId, {
            card: {
                number: cardNumber,
                exp_month: expMonth,
                exp_year: expYear,
                cvc: cvc,
            },
        });
    } catch (error) {
        Log.error("@Stripe:updatePaymentMethod - an error occurred: " + error);
        return null;
    }
}

export async function updateCustomer(customerId, updatedInfo) {
    return stripe.customers.update(customerId, updatedInfo);
}

export async function retrieveCustomer(customerId) {
    try {
        return await stripe.customers.retrieve(customerId);
    } catch (error) {
        Log.error("@Stripe:retrieveCustomer - an error occurred: " + error);
        return null;
    }
}

export async function retrievePaymentMethod(paymentMethodId) {
    try {
        return await stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
        Log.error("@Stripe:retrievePaymentMethod - an error occurred: " + error);
        return null;
    }
}

export async function retrieveInvoice(invoiceId) {
    try {
        return stripe.invoices.retrieve(invoiceId, {
            expand: ["payment_intent"],
        });
    } catch (error) {
        Log.error("@Stripe:retrieveInvoice - an error occurred: " + error);
        return null;
    }
}

export async function retrieveSubscription(subscriptionId) {
    try {
        return stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["latest_invoice.payment_intent"],
        });
    } catch (error) {
        Log.error("@Stripe:retrieveSubscription - an error occurred: " + error);
        return null;
    }
}

export async function listCustomerSubscriptions(customerId) {
    try {
        return stripe.subscriptions.list({
            customer: customerId,
        });
    } catch (error) {
        Log.error("@Stripe:listCustomerSubscriptions - an error occurred: " + error);
        return null;
    }
}
