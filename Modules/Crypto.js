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
 * @param {number} [size=16] The size of the code to generate.
 * @returns {string} The generated code.
 */
export function generateCode(size = 16) {
    const finalSize = size < 1 ? 16 : size;
    return crypto.randomBytes(finalSize / 2).toString("hex");
}

/**
 * Generates a random number of the given size.
 *
 * @param {number} [size=6] The size of the number to generate.
 * @returns {number} The generated number.
 */
export function generateDigits(size = 6) {
    const finalSize = size < 1 ? 6 : size;

    const min = 10 ** (finalSize - 1);
    const max = 10 ** finalSize;
    return (crypto.getRandomValues(new Uint32Array(1))[0] % (max - min)) + min;
}
