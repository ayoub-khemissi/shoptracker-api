import mysql from "mysql2";
import Config from "../Utils/Config.js";

const { SHOPTRACKER_DB_HOST, SHOPTRACKER_DB_PORT, SHOPTRACKER_DB_USER, SHOPTRACKER_DB_PASSWORD, SHOPTRACKER_DB_DATABASE } = Config;

const pool = mysql.createPool({
    host: SHOPTRACKER_DB_HOST,
    port: SHOPTRACKER_DB_PORT,
    user: SHOPTRACKER_DB_USER,
    password: SHOPTRACKER_DB_PASSWORD,
    database: SHOPTRACKER_DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default pool.promise();
