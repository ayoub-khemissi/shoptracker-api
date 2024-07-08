export function validateEmail(email) {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
}

export function validateName(name) {
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ]+([-' ][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
    return nameRegex.test(name);
}

export function validateHash512(hash) {
    const hashRegex = /^[a-fA-F0-9]{128}$/;
    return hashRegex.test(hash);
}

export function validateUrl(url) {
    const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)(:\d+)?(\/[^\s]*)?$/;
    return urlRegex.test(url);
}

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