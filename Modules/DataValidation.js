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
 * @param {string} code The code to validate.
 * @param {number} [codeRequiredSize=16] The size of the code required.
 * @returns {boolean} true if the code is valid, false otherwise.
 */
export function validateCode(code, codeRequiredSize = 16) {
    const codeRegex = new RegExp(`^[0-9a-f]{${codeRequiredSize}}$`);
    return code && codeRegex.test(code);
}

/**
 * Validate whether the given digits is in a valid format.
 *
 * @param {string} digits The digits to validate.
 * @param {number} [digitsRequiredSize=6] The size of the digits required.
 * @returns {boolean} true if the digits is valid, false otherwise.
 */
export function validateDigits(digits, digitsRequiredSize = 6) {
    const digitsRegex = new RegExp(`^\\d{${digitsRequiredSize}}$`);
    return digits && digitsRegex.test(digits);
}

/**
 * Validate whether the given phone number is in a valid format.
 *
 * The phone number must start with a plus sign (+) followed by 10 to 15 digits.
 *
 * @param {string} phone The phone number to validate.
 * @returns {boolean} true if the phone number is valid, false otherwise.
 */
export function validatePhone(phone) {
    const phoneRegex = /^\+\d{10,15}$/;
    return phone && phoneRegex.test(phone);
}

/**
 * Validate whether the given data is a string.
 *
 * @param {*} data The data to validate.
 * @returns {boolean} true if the data is a string, false otherwise.
 */
export function validateString(data) {
    return typeof data === "string";
}

/**
 * Validate whether the given data is an object.
 *
 * @param {*} data The data to validate.
 * @returns {boolean} true if the data is an object, false otherwise.
 */
export function validateObject(data) {
    return typeof data === "object" && data !== null && !Array.isArray(data);
}

/**
 * Validate whether the given browser subscription is in a valid format.
 *
 * The subscription must be an object with the following properties:
 * - endpoint: a valid URL
 * - keys: an object with the following properties:
 *   - p256dh: a string of at least 1 character
 *   - auth: a string of at least 1 character
 * - expirationTime: a number, null, or undefined
 *
 * @param {Object} subscription The subscription to validate.
 * @returns {boolean} true if the subscription is valid, false otherwise.
 */
export function validateBrowserSubscription(subscription) {
    return subscription === null || (validateObject(subscription) && validateUrl(subscription.endpoint) && validateObject(subscription.keys) && validateString(subscription.keys.p256dh) && subscription.keys.p256dh.length > 0 && validateString(subscription.keys.auth) && subscription.keys.auth.length > 0 && (typeof subscription.expirationTime === "number" || subscription.expirationTime === null || subscription.expirationTime === undefined));
}

/**
 * Validate whether the given push subscription is in a valid format.
 *
 * @param {Object} subscription The subscription to validate.
 * @returns {boolean} true if the subscription is valid, false otherwise.
 */
export function validatePushSubscription(subscription) {
    return subscription === null || validateObject(subscription);
}
    