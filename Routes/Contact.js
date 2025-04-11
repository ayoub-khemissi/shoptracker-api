import api from "../Modules/Api.js";
import { verifyRecaptchaToken } from '../Modules/GoogleRecaptcha.js';
import { sendEmail } from '../Modules/Mailer.js';
import { cleanStringData } from '../Modules/DataTransformation.js';
import Config from '../Utils/Config.js';
import { formatBodyForContactForm } from '../Modules/ServicesMailFormatter.js';

const { SHOPTRACKER_MAILER_DEFAULT_MAIL } = Config;

api.post('/contact', async (req, res) => {
    const { email, subject, content, recaptchaToken } = req.body;

    if (!recaptchaToken) {
        return res.status(400).json({ data: null, msg: "reCAPTCHA token is required." });
    }

    if (!(await verifyRecaptchaToken(recaptchaToken))) {
        return res.status(400).json({ data: null, msg: "Invalid reCAPTCHA token" });
    }

    const cleanEmail = cleanStringData(email);
    const cleanSubject = cleanStringData(subject);
    const cleanContent = cleanStringData(content);

    if (!cleanEmail || !cleanSubject || !cleanContent) {
        return res.status(400).json({ data: null, msg: "All fields are required." });
    }

    const body = formatBodyForContactForm(cleanEmail, cleanSubject, cleanContent);

    const emailSent = await sendEmail(
        SHOPTRACKER_MAILER_DEFAULT_MAIL,
        cleanSubject,
        body,
        'Contact'
    );

    if (!emailSent) {
        return res.status(500).json({ data: null, msg: "Failed to send contact message." });
    }

    return res.status(200).json({
        data: { email: cleanEmail, subject: cleanSubject },
        msg: "Contact message sent successfully."
    });
});
