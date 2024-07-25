import Constants from "../Utils/Constants.js";
import Database from "./Database.js";

const { logLevelInfo, logLevelWarn, logLevelError, logLevelDebug } = Constants;

class Log {
    info(text) {
        console.info(`%c${text}`, "color:white");
        this.saveLog(logLevelInfo, text);
    }

    warn(text) {
        console.warn(`%c${text}`, "color:yellow");
        this.saveLog(logLevelWarn, text);
    }

    error(text) {
        console.error(`%c${text}`, "color:red");
        this.saveLog(logLevelError, text);
    }

    debug(text) {
        console.debug(`%c${text}`, "color:gray");
        this.saveLog(logLevelDebug, text);
    }

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

    setAppInstanceId(appInstanceId) {
        this.appInstanceId = appInstanceId;
    }
}

export default new Log();
