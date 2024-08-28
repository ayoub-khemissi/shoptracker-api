export function validateEmail(email) {
    const emailRegex = /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return email && emailRegex.test(email);
}

export function validateName(name) {
    const nameRegex = /^(?=.{2,}$)[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
    return name && nameRegex.test(name);
}

export function validateAddress(address) {
    const addressRegex = /^[0-9A-Za-z\s.,\-'/#()]+$/;
    return address && addressRegex.test(address);
}

export function validateZipcode(zipcode) {
    const zipcodeRegex = /^[0-9A-Za-z\s]{3,10}$/;
    return zipcode && zipcodeRegex.test(zipcode);
}

export function validateHash512(hash) {
    const hashRegex = /^[a-fA-F0-9]{128}$/;
    return hash && hashRegex.test(hash);
}

export function validateUrl(url) {
    const urlRegex =
        /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$/;
    return url && urlRegex.test(url);
}

export function validateBoolean(data) {
    return typeof data === "boolean";
}

export function validateNumber(data) {
    return typeof data === "number";
}
