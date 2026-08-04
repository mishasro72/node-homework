const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const pool = require("../db/pg-pool");

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

async function register(req, res, next) {
  const { error, value } = userSchema.validate(req.body ?? {}, {
    abortEarly: false,
  });
  if (error) {
     return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }
  let user = null;

  value.hashed_password = await hashPassword(value.password);
  try{
    user = await pool.query(`INSERT INTO users (email, name, hashed_password) 
      VALUES ($1, $2, $3) RETURNING id, email, name`,
      [value.email, value.name, value.hashed_password]
    );
  } catch (e) {
    if (e.code === "23505") {
      return res.status(400).json({ message: "User already exists" });
    }
    return next(e); 
  }

  const newUser = user.rows[0];
  global.user_id = newUser.id;
  return res.status(201).json({ name: newUser.name, email: newUser.email });
}

async function logon(req, res) {
  const { email, password } = req.body;
  // const matchingUser = global.users.find((user) => user.email === email);
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  const matchingUser = result.rows[0];

  if (!matchingUser) {
    return res.status(404).json({ message: "User not found" });
  }
  const goodCredentials = await comparePassword(
    password,
    matchingUser.hashed_password,
  );

  if (!goodCredentials) {
    return res.status(401).json({});
  }

  global.user_id = matchingUser.id;
  return res
    .status(200)
    .json({ name: matchingUser.name, email: matchingUser.email });
}

function logoff(req, res) {
  global.user_id = null;
  return res.status(200).end();
}

module.exports = { register, logon, logoff };
