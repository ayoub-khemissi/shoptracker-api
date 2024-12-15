import crypto from "crypto";

/**
 * Generates a cryptographically secure random salt value for use in hashing
 * passwords. The generated salt is a 32-character long hexadecimal string.
 *
 * @return {string} The generated salt value.
 */
export function generateSalt() {
    return crypto
        .randomBytes(Math.ceil(32 / 2))
        .toString("hex")
        .slice(0, 32);
}

/**
 * Hashes the given password using the given salt value. The salt value should
 * be a 32-character long hexadecimal string generated using the
 * generateSalt() function. The returned hash is a 64-character long
 * hexadecimal string.
 *
 * @param {string} password The password to hash.
 * @param {string} salt The salt value to use when hashing.
 * @return {string} The hashed password.
 */
export function hashPassword(password, salt) {
    if (!password || !salt) {
        return null;
    }

    return crypto.createHmac("sha512", salt).update(password).digest("hex");
}

/**
 * Generates a random code of the given size.
 *
 * @param {number} [bytesSize=16] The size of the code to generate, in bytes.
 * @returns {string} The generated code.
 */
export function generateCode(bytesSize = 16) {
    return crypto.randomBytes(bytesSize).toString("hex");
}
