/**
 * @param {number} ms
 * @returns {string}
 * @description
 * Takes a number of milliseconds and converts it to a human-readable string.
 * If the input is not a number, it returns the input unchanged.
 * The output looks like this:
 * - Less than a second: "in a second"
 * - Less than a minute: "X seconds"
 * - Less than an hour: "X minutes"
 * - More than an hour: "X hours"
 * @example
 * convertMillisecondsToText(5000) // returns "in 5 seconds"
 */
export function convertMillisecondsToText(ms) {
    if (typeof ms !== "number") {
        return ms;
    }

    const second = 1000;
    const minute = 60 * second;
    const hour = 60 * minute;

    if (ms < second) {
        return "in a second";
    } else if (ms < minute) {
        let seconds = Math.floor(ms / second);
        return seconds + (seconds === 1 ? " second" : " seconds");
    } else if (ms < hour) {
        let minutes = Math.floor(ms / minute);
        return minutes + (minutes === 1 ? " minute" : " minutes");
    } else {
        let hours = Math.floor(ms / hour);
        return hours + (hours === 1 ? " hour" : " hours");
    }
}

/**
 * @param {number|string} price
 * @returns {string}
 * @description
 * Takes a number or a string, and returns a human-readable string.
 * The output is the number or string formatted as a price
 * with a comma as the decimal separator and spaces as the thousand separator.
 * @example
 * formatPrice(9.99) // returns "9,99"
 * formatPrice("9.99") // returns "9,99"
 */
export function formatPrice(price) {
    if (typeof price !== "number" && typeof price !== "string") {
        return price;
    }

    let [integerPart, decimalPart] = String(price).replace(".", ",").split(",");

    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
}
