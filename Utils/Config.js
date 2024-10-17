const {
    SHOPTRACKER_FRONT_PORT,
    SHOPTRACKER_FRONT_HOSTNAME,
    SHOPTRACKER_FRONT_DOMAIN,
    SHOPTRACKER_FRONT_HTTPSECURE,
    SHOPTRACKER_API_PORT,
    SHOPTRACKER_API_HOSTNAME,
    SHOPTRACKER_API_HTTPSECURE,
    SHOPTRACKER_API_JWT_SECRET,
    SHOPTRACKER_DB_HOST,
    SHOPTRACKER_DB_PORT,
    SHOPTRACKER_DB_USER,
    SHOPTRACKER_DB_PASSWORD,
    SHOPTRACKER_DB_DATABASE,
    SHOPTRACKER_LOG_LEVEL,
    STRIPE_API_KEY,
    STRIPE_WEBHOOK_KEY,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    // eslint-disable-next-line no-undef
} = process.env;

const Config = {
    SHOPTRACKER_API_PORT: SHOPTRACKER_API_PORT,
    SHOPTRACKER_API_HOSTNAME: SHOPTRACKER_API_HOSTNAME,
    SHOPTRACKER_FRONT_DOMAIN: SHOPTRACKER_FRONT_DOMAIN,
    SHOPTRACKER_API_HTTPSECURE:
        String(SHOPTRACKER_API_HTTPSECURE) === "1" || String(SHOPTRACKER_API_HTTPSECURE).toLowerCase() === "true",
    SHOPTRACKER_FRONT_PORT: SHOPTRACKER_FRONT_PORT,
    SHOPTRACKER_FRONT_HOSTNAME: SHOPTRACKER_FRONT_HOSTNAME,
    SHOPTRACKER_FRONT_HTTPSECURE:
        String(SHOPTRACKER_FRONT_HTTPSECURE) === "1" || String(SHOPTRACKER_FRONT_HTTPSECURE).toLowerCase() === "true",
    SHOPTRACKER_API_JWT_SECRET: SHOPTRACKER_API_JWT_SECRET,
    SHOPTRACKER_DB_HOST: SHOPTRACKER_DB_HOST,
    SHOPTRACKER_DB_PORT: SHOPTRACKER_DB_PORT,
    SHOPTRACKER_DB_USER: SHOPTRACKER_DB_USER,
    SHOPTRACKER_DB_PASSWORD: SHOPTRACKER_DB_PASSWORD,
    SHOPTRACKER_DB_DATABASE: SHOPTRACKER_DB_DATABASE,
    SHOPTRACKER_LOG_LEVEL: SHOPTRACKER_LOG_LEVEL,
    STRIPE_API_KEY: STRIPE_API_KEY,
    STRIPE_WEBHOOK_KEY: STRIPE_WEBHOOK_KEY,
    GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: GOOGLE_CLIENT_SECRET,
};

export default Config;
