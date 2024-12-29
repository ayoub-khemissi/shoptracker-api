import nodemailer from "nodemailer";
import Log from "./Log.js";
import Config from "../Utils/Config.js";

const {
    SHOPTRACKER_MAILER_HOST,
    SHOPTRACKER_MAILER_PORT,
    SHOPTRACKER_MAILER_USER,
    SHOPTRACKER_MAILER_PASSWORD,
    SHOPTRACKER_MAILER_DEFAULT_MAIL,
} = Config;

const transporter = nodemailer.createTransport({
    host: SHOPTRACKER_MAILER_HOST,
    port: SHOPTRACKER_MAILER_PORT,
    secure: false,
    auth: {
        user: SHOPTRACKER_MAILER_USER,
        pass: SHOPTRACKER_MAILER_PASSWORD,
    },
});

export const sendEmail = async (to, subject, html, service = "Support") => {
    try {
        await transporter.sendMail({
            from: `"ShopTracker ${service} Service" <${SHOPTRACKER_MAILER_DEFAULT_MAIL}>`,
            to: to,
            subject: subject,
            html: html,
        });

        return true;
    } catch (error) {
        Log.error("An error occurred while sending the email: " + error);
        return false;
    }
};
