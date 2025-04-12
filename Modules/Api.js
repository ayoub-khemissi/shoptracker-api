import consoleStamp from "console-stamp";
import express from "express";
import { readFileSync } from "fs";
import Config from "../Utils/Config.js";
import Log from "./Log.js";
import cookieParser from "cookie-parser";
import cors from "cors";

consoleStamp(console, { format: ":date(yyyy-mm-dd HH:MM:ss.l):label" });

const {
    SHOPTRACKER_API_HTTPSECURE,
    SHOPTRACKER_API_HOSTNAME,
    SHOPTRACKER_API_PORT,
    SHOPTRACKER_FRONT_HOSTNAME,
    SHOPTRACKER_FRONT_HTTPSECURE,
    SHOPTRACKER_FRONT_PORT,
} = Config;
const { version, description } = JSON.parse(readFileSync("package.json"));

const api = express();
api.use("/stripe/webhook", express.raw({ type: "application/json" }));
api.use(express.json());
api.use(express.urlencoded({ extended: true }));
api.use(cookieParser());
api.use(
    cors({
        origin: `http${SHOPTRACKER_FRONT_HTTPSECURE ? "s" : ""}://${SHOPTRACKER_FRONT_HOSTNAME}${SHOPTRACKER_FRONT_HTTPSECURE ? "" : `:${SHOPTRACKER_FRONT_PORT}`}`,
        credentials: true,
        methods: "GET,PUT,PATCH,POST,DELETE",
        allowedHeaders: ["Content-Type"],
    }),
);
// eslint-disable-next-line
api.use((err, req, res, next) => {
    const originalUrl = req?.originalUrl || "";
    const errorMessage = err?.message || "";
    const msg = `Internal server error - ${originalUrl} - ${errorMessage}`;

    Log.error(msg);

    res.status(err.status || 500).json({
        data: null,
        msg: msg,
    });
});
api.disable("x-powered-by");

api.get("/", function (req, res) {
    res.status(200).send({
        data: { description: description, version: version },
        msg: "The API is up!",
    });
});

api.listen(SHOPTRACKER_API_PORT, SHOPTRACKER_API_HOSTNAME, async function () {
    Log.info(
        `API listening on http${SHOPTRACKER_API_HTTPSECURE ? "s" : ""}://${SHOPTRACKER_API_HOSTNAME}:${SHOPTRACKER_API_PORT}/.`,
    );
});

export default api;
