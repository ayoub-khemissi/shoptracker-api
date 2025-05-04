import consoleStamp from "console-stamp";
import express from "express";
import { readFileSync } from "fs";
import Config from "../Utils/Config.js";
import cookieParser from "cookie-parser";
import cors from "cors";

consoleStamp(console, { format: ":date(yyyy-mm-dd HH:MM:ss.l):label" });

const {
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
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        allowedHeaders: ["Content-Type"],
        maxAge: 3600,
    }),
);
api.disable("x-powered-by");

api.get("/", function (req, res) {
    res.status(200).send({
        data: { description: description, version: version },
        msg: "The API is up!",
    });
});

export default api;
