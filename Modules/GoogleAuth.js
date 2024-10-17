import { OAuth2Client } from "google-auth-library";
import Config from "../Utils/Config.js";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = Config;

const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

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
        }));
    } catch (error) {
        return false;
    }
}
