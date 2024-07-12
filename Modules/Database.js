import mysql from "mysql2";
import Config from "../Utils/Config.js";

const { dbHost, dbPort, dbUser, dbPassword, dbDatabase } = Config;

const pool = mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbDatabase,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool.promise();
