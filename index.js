import api from "./Modules/Api.js";
import Config from "./Utils/Config.js";
import Log from "./Modules/Log.js";

import "./Routes/RegisterClassical.js";
import "./Routes/RegisterGoogle.js";
import "./Routes/LoginClassical.js";
import "./Routes/LoginGoogle.js";
import "./Routes/Track.js";
import "./Routes/NotificationsUpdate.js";
import "./Routes/TracksStats.js";
import "./Routes/Tracklist.js";
import "./Routes/TrackUpdate.js";
import "./Routes/TrackDelete.js";
import "./Routes/TrackEnable.js";
import "./Routes/TrackDisable.js";
import "./Routes/CheckoutSession.js";
import "./Routes/SubscriptionCancel.js";
import "./Routes/AccountDelete.js";
import "./Routes/StripeWebhook.js";
import "./Routes/Logout.js";
import "./Routes/PasswordCodeGenerate.js";
import "./Routes/PasswordCodeVerify.js";
import "./Routes/PasswordCodeReset.js";
import "./Routes/PasswordReset.js";
import "./Routes/Subscription.js";
import "./Routes/Contact.js";
import "./Routes/PhoneCodeGenerate.js";
import "./Routes/PhoneCodeVerify.js";
import "./Routes/SubscriptionReactivate.js";
import "./Routes/Dashboard.js";
import "./Routes/UpdateMarketingEmail.js";

// eslint-disable-next-line
api.use((err, req, res, next) => {
    const originalUrl = req?.originalUrl || "";
    const errorMessage = err?.message || "";
    const stack = err?.stack || "";
    const msg = `Internal server error - Route ${originalUrl} - ${errorMessage}`;

    Log.error(`${msg} - ${stack}`);

    res.status(err.status || 500).json({
        data: null,
        msg: msg,
    });
});

const {
    SHOPTRACKER_API_HTTPSECURE,
    SHOPTRACKER_API_HOSTNAME,
    SHOPTRACKER_API_PORT,
} = Config;

api.listen(SHOPTRACKER_API_PORT, SHOPTRACKER_API_HOSTNAME, async function () {
    Log.info(
        `API listening on http${SHOPTRACKER_API_HTTPSECURE ? "s" : ""}://${SHOPTRACKER_API_HOSTNAME}:${SHOPTRACKER_API_PORT}/.`
    );
});
