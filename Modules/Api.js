import consoleStamp from "console-stamp";
import express from "express";
import { readFileSync } from "fs";
import Constants from "../Utils/Constants.js";

consoleStamp(console, { format: ":date(yyyy-mm-dd HH:MM:ss.l):label" });

const api = express();
const { apiHttpSecure, apiHostname, apiPort } = Constants;
const { version, description } = JSON.parse(readFileSync("package.json"));

api.use(express.json());
api.use(express.urlencoded({ extended: true }));

api.get("/", function (req, res) {
    res.status(200).send({ data: { description: description, version: version }, msg: "The API is up!" });
});

api.listen(apiPort, apiHostname, function () {
    console.info(`API listening on http${apiHttpSecure ? "s" : ""}://${apiHostname}:${apiPort}/.`);
});

export default api;
