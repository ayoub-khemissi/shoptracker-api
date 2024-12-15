/**
 * Validate whether the given email is in a valid format.
 *
 * @param {string} email The email to validate.
 * @returns {boolean} true if the email is valid, false otherwise.
 */
export function validateEmail(email) {
    const emailRegex = /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return email && emailRegex.test(email);
}

/**
 * Validate whether the given password is strong enough.
 *
 * The password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character.
 *
 * @param {string} password The password to validate.
 * @returns {boolean} true if the password is valid, false otherwise.
 */
export function validatePassword(password) {
    const hashRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return password && hashRegex.test(password);
}

/**
 * Validate whether the given URL is in a valid format.
 *
 * The URL must start with http:// or https://, followed by one or more alphanumeric characters, followed by a period, followed by a valid top-level domain (like .com, .net, etc.), and finally followed by any valid URL characters.
 *
 * @param {string} url The URL to validate.
 * @returns {boolean} true if the URL is valid, false otherwise.
 */
export function validateUrl(url) {
    const urlRegex =
        /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$/;
    return url && urlRegex.test(url);
}

/**
 * Validate whether the given data is a boolean.
 *
 * @param {*} data The data to validate.
 * @returns {boolean} true if the data is a boolean, false otherwise.
 */
export function validateBoolean(data) {
    return typeof data === "boolean";
}

/**
 * Validate whether the given data is a number.
 *
 * @param {*} data The data to validate.
 * @returns {boolean} true if the data is a number, false otherwise.
 */
export function validateNumber(data) {
    return typeof data === "number";
}

/**
 * Validate whether the given code is in a valid format.
 *
 * The code must be a string of exactly 8 characters, consisting of lowercase letters and digits.
 *
 * @param {string} code The code to validate.
 * @param {number} [codeRequiredLength=16] The length of the code required.
 * @returns {boolean} true if the code is valid, false otherwise.
 */
export function validateCode(code, codeRequiredLength = 16) {
    const codeRegex = new RegExp(`^[0-9a-f]{${codeRequiredLength}}$`);
    return code && codeRegex.test(code);
}
