import Constants from "../Utils/Constants.js";

const { trackStatusEnabled, trackStatusDisabled } = Constants;

export function validateEmail(email) {
    const emailRegex = /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/;
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
    const urlRegex = /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$/;
    return urlRegex.test(url);
}

export function validateBoolean(data) {
    return typeof data === "boolean";
}

export function validateNumber(data) {
    return typeof data === "number";
}

export function validateTrackStatus(data) {
    return data === trackStatusEnabled || data === trackStatusDisabled;
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
