import { OAuth2Client } from "google-auth-library";
import Config from "../Utils/Config.js";

const { googleSignWebClientId } = Config;

const client = new OAuth2Client(googleSignWebClientId);

export async function verifyGoogleJwt(googleJwt) {
    try {
        return !!(await client.verifyIdToken({
            idToken: googleJwt,
            audience: googleSignWebClientId,
        }));
    } catch (error) {
        return false;
    }
}
