import crypto from "crypto";

export function generateSalt() {
    return crypto
        .randomBytes(Math.ceil(32 / 2))
        .toString("hex")
        .slice(0, 32);
}

export function hashPassword(password, salt) {
    if (!password || !salt) {
        return null;
    }

    const hash = crypto.createHmac("sha512", salt);
    hash.update(password);
    const value = hash.digest("hex");
    return value;
}
