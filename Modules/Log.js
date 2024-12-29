import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";
import Database from "./Database.js";

const { SHOPTRACKER_LOG_LEVEL } = Config;
const { logLevelDebug, logLevelInfo, logLevelWarn, logLevelError } = Constants;

class Log {
    /**
     * Logs a debug message
     * @param {string} text - The message to log
     */
    debug(text) {
        if (SHOPTRACKER_LOG_LEVEL > logLevelDebug) {
            return;
        }

        console.debug(`%c${text}`, "color:gray");
        this.saveLog(logLevelDebug, text);
    }

    /**
     * Logs an informational message
     * @param {string} text - The message to log
     */
    info(text) {
        if (SHOPTRACKER_LOG_LEVEL > logLevelInfo) {
            return;
        }

        console.info(`%c${text}`, "color:white");
        this.saveLog(logLevelInfo, text);
    }

    /**
     * Logs a warning message
     * @param {string} text - The message to log
     */
    warn(text) {
        if (SHOPTRACKER_LOG_LEVEL > logLevelWarn) {
            return;
        }

        console.warn(`%c${text}`, "color:yellow");
        this.saveLog(logLevelWarn, text);
    }

    /**
     * Logs an error message
     * @param {string} text - The message to log
     */
    error(text) {
        if (SHOPTRACKER_LOG_LEVEL > logLevelError) {
            return;
        }

        console.error(`%c${text}`, "color:red");
        this.saveLog(logLevelError, text);
    }

    /**
     * Saves a log entry to the database with the specified level and text.
     * @param {number} level - The severity level of the log message.
     * @param {string} text - The message to be logged.
     */
    saveLog(level, text) {
        try {
            const values = [this.appInstanceId, level, String(text), Date.now()];
            const query =
                "INSERT INTO log (app_instance_id, level, text, created_at) VALUES (?, ?, ?, ?)";
            Database.execute(query, values);
        } catch (error) {
            console.error("@Log:saveLog - an error occurred: " + error);
        }
    }

    /**
     * Sets the ID of the app instance to associate with log entries.
     * @param {number} appInstanceId - The ID of the app instance.
     */
    setAppInstanceId(appInstanceId) {
        this.appInstanceId = appInstanceId;
    }
}

export default new Log();
