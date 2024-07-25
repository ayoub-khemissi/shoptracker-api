import consoleStamp from "console-stamp";
import express from "express";
import { readFileSync } from "fs";
import Config from "../Utils/Config.js";
import Database from "./Database.js";
import Log from "./Log.js";
import Constants from "../Utils/Constants.js";

consoleStamp(console, { format: ":date(yyyy-mm-dd HH:MM:ss.l):label" });

const { apiHttpSecure, apiHostname, apiPort } = Config;
const { appId } = Constants;
const { version, description } = JSON.parse(readFileSync("package.json"));

const api = express();
api.use(express.json());
api.use(express.urlencoded({ extended: true }));

api.get("/", function (req, res) {
    res.status(200).send({
        data: { description: description, version: version },
        msg: "The API is up!",
    });
});

api.listen(apiPort, apiHostname, async function () {
    const values = [appId, version, Date.now()];
    const query = "INSERT INTO app_instance (app_id, version, created_at) VALUES (?, ?, ?)";
    const [result] = await Database.execute(query, values);

    if (result.affectedRows > 0) {
        Log.setAppInstanceId(result.insertId);
    }

    Log.info(`API listening on http${apiHttpSecure ? "s" : ""}://${apiHostname}:${apiPort}/.`);
});

export default api;
