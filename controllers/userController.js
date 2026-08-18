const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const prisma = require("../db/prisma");

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
  value.hashedPassword = await hashPassword(value.password);
  try {
    user = await prisma.user.create({
      data: {
        name: value.name,
        email: value.email,
        hashedPassword: value.hashedPassword,
      },
      select: { name: true, email: true, id: true },
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res.status(400).json({ message: "User already exists" });
    } else {
      return next(err);
    }
  }

  global.user_id = user.id;
  return res.status(201).json({ name: user.name, email: user.email });
}

async function logon(req, res) {
  let { email, password } = req.body;
  email = email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const goodCredentials = await comparePassword(password, user.hashedPassword);

  if (!goodCredentials) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  global.user_id = user.id;
  return res.status(200).json({ name: user.name, email: user.email });
}

function logoff(req, res) {
  global.user_id = null;
  return res.status(200).end();
}

async function show(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!global.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userId !== global.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        Task: {
          where: { isCompleted: false },
          select: {
            id: true,
            title: true,
            priority: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, logon, logoff, show };
