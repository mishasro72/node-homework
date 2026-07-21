const express = require("express");
const useController = require("../controllers/userController");

const router = express.Router();

router.post("/register", useController.register);
router.post("/logon", useController.logon);
router.post("/logoff", useController.logoff);
