import fs from "fs";
import Constants from "../Utils/Constants.js";

const { mailTemplatesPath } = Constants;

const resetPasswordCodePlaceholder = "{{RESET_PASSWORD_CODE}}";

/**
 * Formats the body of a reset password email using the email template.
 * @param {string} resetPasswordCode - The reset code to insert into the email.
 * @returns {string} The formatted email body.
 */
export const formatBodyForResetPassword = (resetPasswordCode) => {
    const template = fs.readFileSync(`${mailTemplatesPath}/mail_template_reset_password.html`, "utf-8").toString();
    return template.replaceAll(resetPasswordCodePlaceholder, resetPasswordCode);
};
