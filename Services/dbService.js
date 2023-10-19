import mysql from "mysql2";

import "dotenv/config";

import fs from "fs";

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbDatabase = process.env.DB_DATABASE;

const dbConfig = {
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbDatabase,
  port: 3306,
  ssl: {
    ca: fs.readFileSync("ssl/DigiCertGlobalRootCA.crt.pem"),
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
};

//console.log(dbConfig);

const pool = await mysql.createPool(dbConfig);

export default pool;
