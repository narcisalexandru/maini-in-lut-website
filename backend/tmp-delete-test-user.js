const fs = require("fs");
const { Client } = require("pg");

const env = fs.readFileSync(".env", "utf8");
const get = (key) => {
  const line = env.split(/\r?\n/).find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : "";
};

const client = new Client({
  host: get("DATABASE_HOST"),
  port: Number(get("DATABASE_PORT")),
  user: get("DATABASE_USER"),
  password: get("DATABASE_PASSWORD"),
  database: get("DATABASE_NAME"),
});

client
  .connect()
  .then(() =>
    client.query('DELETE FROM "user" WHERE email = $1', [
      "ios-register-check@example.com",
    ]),
  )
  .then((result) => {
    console.log(`deleted ${result.rowCount}`);
    return client.end();
  })
  .catch(async (error) => {
    console.error(error.message);
    await client.end();
    process.exitCode = 1;
  });
