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

    resetPasswordCodeLength: 16,

    logLevelDebug: 1,
    logLevelInfo: 2,
    logLevelWarn: 3,
    logLevelError: 4,

    appId: 1,
};

export default Constants;
