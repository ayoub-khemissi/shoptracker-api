import twilio from "twilio";
import Config from "../Utils/Config.js";
import Log from "./Log.js";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = Config;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Send a WhatsApp message using Twilio
 * @param {string} to - The recipient's WhatsApp number in the format 'whatsapp:+1234567890'
 * @param {string} body - The message body
 * @returns {Promise<boolean>} - true if the message was sent successfully, false otherwise
 */
export async function sendWhatsAppMessage(to, body) {
    try {
        await client.messages.create({
            from: `whatsapp:${TWILIO_PHONE_NUMBER}`,
            to: `whatsapp:${to}`,
            body: body,
        });

        return true;
    } catch (error) {
        Log.error("An error occurred while sending the WhatsApp message: " + error);
        return false;
    }
}
