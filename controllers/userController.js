const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

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

async function register(req, res) {
  const { error, value } = userSchema.validate(req.body ?? {}, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const hashedPassword = await hashPassword(value.password);

  const user = {
    id: global.users.length + 1,
    name: value.name,
    email: value.email,
    hashedPassword,
  };
  global.users.push(user);
  global.user_id = user;
  return res.status(201).json({ name: user.name, email: user.email });
}

async function logon(req, res) {
  const { email, password } = req.body;
  const matchingUser = global.users.find((user) => user.email === email);

  const goodCredentials =
    matchingUser &&
    (await comparePassword(password, matchingUser.hashedPassword));
  
    if (!goodCredentials) {
    return res.status(401).json({});
  }

  global.user_id = matchingUser;
  return res
    .status(200)
    .json({ name: matchingUser.name, email: matchingUser.email });
}

function logoff(req, res) {
  global.user_id = null;
  return res.status(200).end();
}

module.exports = { register, logon, logoff };
