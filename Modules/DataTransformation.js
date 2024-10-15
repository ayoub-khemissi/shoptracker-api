/**
 * Clean a string by removing leading and trailing whitespace and setting it to null if empty.
 *
 * @param {string} data The string to clean.
 * @returns {string|null} The cleaned string, or null if empty.
 */
export function cleanStringData(data) {
    if (!data || typeof data !== "string" || data.length === 0) {
        return null;
    }

    return String(data).trim();
}

/**
 * Clear sensitive data from a user object.
 *
 * @param {Object} data The user object to clear.
 * @returns {Object|null} The cleared user object, or null if the input is null.
 */
export function clearSensitiveData(data) {
    if (!data) {
        return null;
    }

    delete data.password_salt;
    delete data.password_hash;
    delete data.disabled;

    return data;
}
