/*
 * Clones an object.
 * @param {Object} obj - The object to clone.
 * @returns {Object} - The cloned object.
 */
export function cloneObject(obj) {
    if (!obj || typeof obj !== "object") {
        return obj;
    }

    return JSON.parse(JSON.stringify(obj));
}

/*
 * Merges two objects into a new object.
 * @param {Object} obj1 - The first object.
 * @param {Object} obj2 - The second object.
 * @returns {Object} - The merged object.
 */
export function mergeObjects(obj1, obj2) {
    if (!obj1 || !obj2 || typeof obj1 !== "object" || typeof obj2 !== "object") {
        return obj1 || obj2;
    }

    return { ...obj1, ...obj2 };
}