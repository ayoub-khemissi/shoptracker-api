const Constants = {
    trackStatusEnabled: 1,
    trackStatusDisabled: 2,
    trackStatusInvalid: 3,
    trackStatusDeleted: 4,
    trackStatusFinished: 5,

    trackExtractionRuleFull: 1,
    trackExtractionRulePartial: 2,

    trackCheckOk: 1,
    trackCheckKo: 2,

    defaultTrackEnabledMaxProducts: 1,
    defaultTrackDisabledMaxProducts: 3,
    defaultTrackUserMaxSearchesPerDay: 3,

    subscriptionActive: 1,
    subscriptionCanceled: 2,

    jwtExpirationTime: 30 * 24 * 60 * 60 * 1000,

    mailTemplatesPath: "Resources/MailTemplates",
    textTemplatesPath: "Resources/TextTemplates",

    resetPasswordCodeLength: 16,
    verifyPhoneCodeLength: 6,

    codeExpirationTime: 15 * 60 * 1000,

    subscriptionTrialPeriodDays: 7,

    logLevelDebug: 1,
    logLevelInfo: 2,
    logLevelWarn: 3,
    logLevelError: 4,

    defaultSubscriptionDetails: {
        stripe_price_id: null,
        stripe_subscription_id: null,
        start_date: null,
        next_payment_date: null,
        payment_method: null,
        invoice_history: [],
        billing_period: null,
        currency: null,
        trial_end: null,
        status: null,
        cancel_at_period_end: null,
        first_subscription_date: null,
        last_subscription_date: null,
    },

    appId: 1,
};

export default Constants;
