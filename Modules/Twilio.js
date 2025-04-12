import twilio from "twilio";
import Config from "../Utils/Config.js";
import Log from "./Log.js";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = Config;

const fromWhatsAppNumber = `whatsapp:${TWILIO_PHONE_NUMBER}`;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Send a WhatsApp message using Twilio
 * @param {string} to - The recipient's WhatsApp number in the format 'whatsapp:+1234567890'
 * @param {string} body - The message body
 */
export function sendWhatsAppMessage(to, body) {
    try {
        return client.messages.create({
            from: fromWhatsAppNumber,
            to: to,
            body: body,
        });
    } catch (error) {
        Log.error("An error occurred while sending the WhatsApp message: " + error);
    }
}
