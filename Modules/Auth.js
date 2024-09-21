import jwt from "jsonwebtoken";
import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";

const { SHOPTRACKER_API_JWT_SECRET } = Config;
const { jwtExpirationTime } = Constants;

export function verifyAuthJwt(authJwt) {
    try {
        return jwt.verify(authJwt, SHOPTRACKER_API_JWT_SECRET);
    } catch (error) {
        return false;
    }
}

export function signAuthJwt(authPayload) {
    try {
        return jwt.sign(authPayload, SHOPTRACKER_API_JWT_SECRET, { algorithm: "HS512", expiresIn: jwtExpirationTime });
    } catch (error) {
        return null;
    }
}

export function extractJwt(cookies) {
    if (!cookies || typeof cookies !== "object" || !cookies.jwt) {
        return null;
    }

    return cookies.jwt;
}
