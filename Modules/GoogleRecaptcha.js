import Config from "../Utils/Config.js";
import Recaptcha from "google-recaptcha";
import util from "util";

const { GOOGLE_RECAPTCHA_SECRET_KEY } = Config;

const recaptcha = new Recaptcha({ secret: GOOGLE_RECAPTCHA_SECRET_KEY });

/**
 * Verifies a given reCAPTCHA token.
 *
 * @param {string} token A reCAPTCHA token.
 * @param {string} remoteIp The remote IP address.
 *
 * @returns {Promise<boolean>} Whether the verification was successful.
 */
export async function verifyRecaptchaToken(token, remoteIp) {
    try {
        const verifyAsync = util.promisify(recaptcha.verify).bind(recaptcha);

        const result = await verifyAsync({
            response: token,
            remoteip: remoteIp
        });

        return result?.success && result?.score > 0.5;
    } catch (error) {
        return false;
    }
}
