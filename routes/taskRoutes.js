const express = require("express");
const useController = require("../controllers/taskController");

const router = express.Router();

router.get("/", useController.index);
router.post("/bulk", useController.bulkCreate);
router.get("/:id", useController.show);
router.post("/", useController.create);
router.patch("/:id", useController.update);
router.delete("/:id", useController.deleteTask);

module.exports = router;

