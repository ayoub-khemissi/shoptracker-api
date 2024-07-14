export function cleanData(data) {
    if (!data) { return null; }

    return String(data).trim();
}

export function clearSensitiveData(data) {
    if (!data) { return null; }

    delete data.password_salt;
    delete data.password_hash;
    delete data.disabled;
    return data;
}

export function capitalize(data) {
    if (!data || typeof data !== "string" || data.length === 0) { return null; }

    return data.charAt(0).toUpperCase() + data.slice(1).toLowerCase();
}

export function lowerize(data) {
    if (!data || typeof data !== "string" || data.length === 0) { return null; }

    return data.toLowerCase();
}
