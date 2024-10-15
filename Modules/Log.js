import Constants from "../Utils/Constants.js";
import Database from "./Database.js";

const { logLevelInfo, logLevelWarn, logLevelError, logLevelDebug } = Constants;

/**
 * A class used to log messages. The messages are both printed to the
 * console and saved to the database.
 *
 * @class
 */
class Log {
    /**
     * Logs an info message. The message is also saved to the database.
     * @param {string} text The message to log.
     */
    info(text) {
        console.info(`%c${text}`, "color:white");
        this.saveLog(logLevelInfo, text);
    }

    /**
     * Logs a warning message. The message is also saved to the database.
     * @param {string} text The message to log.
     */
    warn(text) {
        console.warn(`%c${text}`, "color:yellow");
        this.saveLog(logLevelWarn, text);
    }

    /**
     * Logs an error message. The message is also saved to the database.
     * @param {string} text The message to log.
     */
    error(text) {
        console.error(`%c${text}`, "color:red");
        this.saveLog(logLevelError, text);
    }

    /**
     * Logs a debug message. The message is also saved to the database.
     * @param {string} text The message to log.
     */
    debug(text) {
        console.debug(`%c${text}`, "color:gray");
        this.saveLog(logLevelDebug, text);
    }

    /**
     * Saves a log entry in the database.
     * @param {number} level The level of the log entry. Must be one of the
     *  constants defined in `Constants.js` (e.g. `logLevelInfo`,
     *  `logLevelWarn`, `logLevelError`, `logLevelDebug`).
     * @param {string} text The text of the log entry.
     */
    saveLog(level, text) {
        try {
            const values = [this.appInstanceId, level, text, Date.now()];
            const query =
                "INSERT INTO log (app_instance_id, level, text, created_at) VALUES (?, ?, ?, ?)";
            Database.execute(query, values);
        } catch (error) {
            console.error("@Log:saveLog - an error occurred: " + error);
        }
    }

    /**
     * Sets the ID of the app instance to use when logging. This value is used
     * to identify the source of the log entries in the database.
     * @param {number} appInstanceId The ID of the app instance.
     */
    setAppInstanceId(appInstanceId) {
        this.appInstanceId = appInstanceId;
    }
}

export default new Log();
