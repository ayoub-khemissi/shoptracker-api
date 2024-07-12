import consoleStamp from "console-stamp";
import express from "express";
import { readFileSync } from "fs";
import Config from "../Utils/Config.js";
import Database from "./Database.js";

consoleStamp(console, { format: ":date(yyyy-mm-dd HH:MM:ss.l):label" });

const api = express();
const { apiHttpSecure, apiHostname, apiPort } = Config;
const { version, description } = JSON.parse(readFileSync("package.json"));

api.use(express.json());
api.use(express.urlencoded({ extended: true }));

api.get("/", function (req, res) {
    res.status(200).send({ data: { description: description, version: version }, msg: "The API is up!" });
});

api.listen(apiPort, apiHostname, function () {
    console.info(`API listening on http${apiHttpSecure ? "s" : ""}://${apiHostname}:${apiPort}/.`);

    const values = [Date.now(), version];
    const query = "INSERT INTO api_instance (started_at, version) VALUES (?, ?)";
    Database.execute(query, values);
});

export default api;
