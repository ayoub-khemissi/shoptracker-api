import jwt from "jsonwebtoken";
import Constants from "../Utils/Constants.js";

const { apiJwtSecret } = Constants;

export function verifyAuthJwt(authJwt) {
    try {
        return !!jwt.verify(authJwt, apiJwtSecret);
    } catch (error) {
        return false;
    }
}

export function signAuthJwt(authPayload) {
    try {
        return jwt.sign(authPayload, apiJwtSecret);
    } catch (error) {
        return null;
    }
}
