import { OAuth2Client } from "google-auth-library";
import Config from "../Utils/Config.js";

const { SHOPTRACKER_GOOGLE_SIGN_WEB_CLIENT_ID } = Config;

const client = new OAuth2Client(SHOPTRACKER_GOOGLE_SIGN_WEB_CLIENT_ID);

/**
 * Verifies a given Google JWT.
 *
 * @param {string} googleJwt A Google JWT token.
 *
 * @returns {Promise<boolean>} Whether the verification was successful.
 */
export async function verifyGoogleJwt(googleJwt) {
    try {
        return !!(await client.verifyIdToken({
            idToken: googleJwt,
            audience: SHOPTRACKER_GOOGLE_SIGN_WEB_CLIENT_ID,
        }));
    } catch (error) {
        return false;
    }
}
