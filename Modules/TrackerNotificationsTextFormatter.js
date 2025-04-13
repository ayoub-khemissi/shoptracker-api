import fs from "fs";
import Constants from "../Utils/Constants.js";

const { textTemplatesPath } = Constants;

const verifyPhoneCodePlaceholder = "{{VERIFY_PHONE_CODE}}";

const formatBodyForVerifyPhoneCode = (verifyPhoneCode) => {
    const template = fs
        .readFileSync(`${textTemplatesPath}/text_template_verify_phone_code.txt`, "utf-8")
        .toString();
    return template.replaceAll(verifyPhoneCodePlaceholder, verifyPhoneCode);
};

export { formatBodyForVerifyPhoneCode };