import jwt from "jsonwebtoken";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";

const { SHOPTRACKER_API_JWT_SECRET } = Config;
const { jwtExpirationTime } = Constants;

/**
 * Verifies the given JWT token.
 *
 * @param {string} authJwt JWT token to verify
 * @return {boolean|object} Decoded payload of the JWT token if valid, otherwise false
 */
export function verifyAuthJwt(authJwt) {
    try {
        return jwt.verify(authJwt, SHOPTRACKER_API_JWT_SECRET);
    } catch (error) {
        return false;
    }
}

/**
 * Signs a JWT token with the given payload.
 *
 * @param {object} authPayload Payload to sign into the JWT token
 * @return {string|null} Signed JWT token if successful, otherwise null
 */
export function signAuthJwt(authPayload) {
    try {
        return jwt.sign(authPayload, SHOPTRACKER_API_JWT_SECRET, { algorithm: "HS512", expiresIn: jwtExpirationTime });
    } catch (error) {
        return null;
    }
}

/**
 * Extracts a JWT token from the given cookies object.
 *
 * @param {object} [cookies] Cookies object to extract the JWT token from
 * @return {string|null} The extracted JWT token if found, otherwise null
 */
export function extractJwt(cookies) {
    if (!cookies || typeof cookies !== "object" || !cookies.jwt) {
        return null;
    }

    return cookies.jwt;
}
