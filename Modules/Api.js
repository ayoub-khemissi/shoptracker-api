import consoleStamp from "console-stamp";
import express from "express";
import { readFileSync } from "fs";
import Config from "../Utils/Config.js";
import Database from "./Database.js";
import Log from "./Log.js";
import Constants from "../Utils/Constants.js";

consoleStamp(console, { format: ":date(yyyy-mm-dd HH:MM:ss.l):label" });

const { SHOPTRACKER_API_HTTPSECURE, SHOPTRACKER_API_HOSTNAME, SHOPTRACKER_API_PORT } = Config;
const { appId } = Constants;
const { version, description } = JSON.parse(readFileSync("package.json"));

const api = express();
api.use("/stripe/webhook", express.raw({ type: "application/json" }));
api.use(express.json());
api.use(express.urlencoded({ extended: true }));

api.get("/", function (req, res) {
    res.status(200).send({
        data: { description: description, version: version },
        msg: "The API is up!",
    });
});

api.listen(SHOPTRACKER_API_PORT, SHOPTRACKER_API_HOSTNAME, async function () {
    const values = [appId, version, Date.now()];
    const query = "INSERT INTO app_instance (app_id, version, created_at) VALUES (?, ?, ?)";
    const [result] = await Database.execute(query, values);

    if (result.affectedRows > 0) {
        Log.setAppInstanceId(result.insertId);
    }

    Log.info(`API listening on http${SHOPTRACKER_API_HTTPSECURE ? "s" : ""}://${SHOPTRACKER_API_HOSTNAME}:${SHOPTRACKER_API_PORT}/.`);
});

export default api;
