import fs from "fs";
import Constants from "../Utils/Constants.js";
import { convertMillisecondsToText, formatPrice } from "../Modules/TextFormatter.js";
import Config from "../Utils/Config.js";

const { mailTemplatesPath } = Constants;
const {
    SHOPTRACKER_FRONT_HTTPSECURE,
    SHOPTRACKER_FRONT_HOSTNAME,
    SHOPTRACKER_FRONT_PORT,
    SHOPTRACKER_MAILER_DEFAULT_MAIL,
} = Config;

const resetPasswordCodePlaceholder = "{{RESET_PASSWORD_CODE}}";

const contactFormPlaceholders = {
    email: "{{EMAIL}}",
    subject: "{{SUBJECT}}",
    content: "{{CONTENT}}",
};

const subscriptionPlaceholders = {
    planName: "{{PLAN_NAME}}",
    startDate: "{{START_DATE}}",
    nextPaymentDate: "{{NEXT_PAYMENT_DATE}}",
    paymentMethod: "{{PAYMENT_METHOD}}",
    price: "{{PRICE}}",
    currency: "{{CURRENCY}}",
    billingPeriod: "{{BILLING_PERIOD}}",
    maxProducts: "{{MAX_PRODUCTS}}",
    checkInterval: "{{CHECK_INTERVAL}}",
    maxWishlistProducts: "{{MAX_WISHLIST_PRODUCTS}}",
    maxSearchesPerDay: "{{MAX_SEARCHES_PER_DAY}}",
    frontUrl: "{{FRONT_URL}}",
    supportEmail: "{{SUPPORT_EMAIL}}",
};

const dateFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
};

/**
 * Formats the body of a reset password email using the email template.
 * @param {string} resetPasswordCode - The reset code to insert into the email.
 * @returns {string} The formatted email body.
 */
export const formatBodyForResetPassword = (resetPasswordCode) => {
    const template = fs
        .readFileSync(`${mailTemplatesPath}/mail_template_reset_password.html`, "utf-8")
        .toString();
    return template.replaceAll(resetPasswordCodePlaceholder, resetPasswordCode);
};

/**
 * Formats the body of a subscription confirmation email using the email template.
 * @param {Object} plan - The plan details including name, price, currency, etc.
 * @param {Object} subscriptionDetails - The subscription details including start date, next payment, etc.
 * @returns {string} The formatted email body.
 */
export const formatBodyForSubscriptionConfirmation = (plan, subscriptionDetails) => {
    const template = fs
        .readFileSync(`${mailTemplatesPath}/mail_template_subscription_confirmation.html`, "utf-8")
        .toString();

    const startDate = new Date(subscriptionDetails.start_date).toLocaleDateString(
        "en-GB",
        dateFormatOptions,
    );
    const nextPaymentDate = new Date(subscriptionDetails.next_payment_date).toLocaleDateString(
        "en-GB",
        dateFormatOptions,
    );

    const checkInterval = convertMillisecondsToText(plan.track_check_interval);

    const frontUrl = `http${SHOPTRACKER_FRONT_HTTPSECURE ? "s" : ""}://${SHOPTRACKER_FRONT_HOSTNAME}${SHOPTRACKER_FRONT_HTTPSECURE ? "" : `:${SHOPTRACKER_FRONT_PORT}`}`;

    const formattedPrice = formatPrice(subscriptionDetails.invoice_history[0].amount);

    return template
        .replace(subscriptionPlaceholders.planName, plan.name)
        .replace(subscriptionPlaceholders.startDate, startDate)
        .replace(subscriptionPlaceholders.nextPaymentDate, nextPaymentDate)
        .replace(subscriptionPlaceholders.paymentMethod, subscriptionDetails.payment_method)
        .replace(subscriptionPlaceholders.price, formattedPrice)
        .replace(subscriptionPlaceholders.currency, subscriptionDetails.currency.toUpperCase())
        .replace(subscriptionPlaceholders.billingPeriod, subscriptionDetails.billing_period)
        .replace(subscriptionPlaceholders.maxProducts, plan.track_enabled_max_products)
        .replace(subscriptionPlaceholders.checkInterval, checkInterval)
        .replace(subscriptionPlaceholders.maxWishlistProducts, plan.track_disabled_max_products)
        .replace(subscriptionPlaceholders.maxSearchesPerDay, plan.track_user_max_searches_per_day)
        .replace(subscriptionPlaceholders.frontUrl, frontUrl)
        .replace(subscriptionPlaceholders.supportEmail, SHOPTRACKER_MAILER_DEFAULT_MAIL);
};

/**
 * Formats the body of a contact form email using the email template.
 * @param {string} email - The email address of the sender.
 * @param {string} subject - The subject of the contact form.
 * @param {string} content - The content of the contact form.
 * @returns {string} The formatted email body.
 */
export const formatBodyForContactForm = (email, subject, content) => {
    const template = fs
        .readFileSync(`${mailTemplatesPath}/mail_template_contact_form.html`, "utf-8")
        .toString();

    return template
        .replace(contactFormPlaceholders.email, email)
        .replace(contactFormPlaceholders.subject, subject)
        .replace(contactFormPlaceholders.content, content);
};
