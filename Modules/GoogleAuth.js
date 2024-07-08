import { OAuth2Client } from 'google-auth-library';
import Constants from '../Utils/Constants.js';

const { googleSignWebClientId } = Constants;

const client = new OAuth2Client(googleSignWebClientId);

export async function verifyGoogleJwt(googleJwt) {
    try {
        return !!await client.verifyIdToken({
            idToken: googleJwt,
            audience: googleSignWebClientId
        });
    } catch (error) {
        return false;
    }
}
