import Config from "../Utils/Config.js";
import Constants from "../Utils/Constants.js";
import Database from "./Database.js";
import { readFileSync } from "fs";

const { SHOPTRACKER_LOG_LEVEL } = Config;
const { appId, logLevelDebug, logLevelInfo, logLevelWarn, logLevelError } = Constants;
const { version } = JSON.parse(readFileSync("package.json"));

class Log {
    /**
     * Logs a debug message
     * @param {string} text - The message to log
     */
    async debug(text) {
        if (!this.appInstanceId) {
            await this.setupAppInstanceId();
        }

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
    async info(text) {
        if (!this.appInstanceId) {
            await this.setupAppInstanceId();
        }

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
    async warn(text) {
        if (!this.appInstanceId) {
            await this.setupAppInstanceId();
        }

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
    async error(text) {
        if (!this.appInstanceId) {
            await this.setupAppInstanceId();
        }

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
     */
    async setupAppInstanceId() {
        const values = [appId, version, Date.now()];
        const query = "INSERT INTO app_instance (app_id, version, created_at) VALUES (?, ?, ?)";
        const [result] = await Database.execute(query, values);

        if (result.affectedRows > 0) {
            this.appInstanceId = result.insertId;
        } else {
            const error = new Error("Failed to setup app instance for logging.");
            console.error("@Log:setupAppInstanceId - an error occurred: " + error);
            throw error;
        }
    }
}

export default new Log();
