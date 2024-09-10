import jwt from "jsonwebtoken";
import Config from "../Utils/Config.js";

const { SHOPTRACKER_API_JWT_SECRET } = Config;

export function verifyAuthJwt(authJwt) {
    try {
        return jwt.verify(authJwt, SHOPTRACKER_API_JWT_SECRET);
    } catch (error) {
        return false;
    }
}

export function signAuthJwt(authPayload) {
    try {
        return jwt.sign(authPayload, SHOPTRACKER_API_JWT_SECRET, { algorithm: "HS512", expiresIn: "30 days" });
    } catch (error) {
        return null;
    }
}

export function extractJwt(authorizationHeader) {
    if (!authorizationHeader) {
        return null;
    }

    const parts = authorizationHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return null;
    }

    return parts[1];
}
