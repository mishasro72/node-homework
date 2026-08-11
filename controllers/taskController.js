const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");

async function create(req, res, next) {
  const { error, value } = taskSchema.validate(req.body ?? {}, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  let task = null;

  try {
    task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted ?? false,
        userId: global.user_id,
      },
      select: { id: true, title: true, isCompleted: true },
    });
  } catch (err) {
    return next(err);
  }

  return res.status(201).json(task);
}

async function index(req, res) {
  const tasks = await prisma.task.findMany({
    where: { userId: global.user_id },
    select: { title: true, isCompleted: true, id: true },
  });

  if (tasks.length === 0) {
    return res.status(404).json({});
  }

  return res.status(200).json(tasks);
}

async function show(req, res) {
  const taskId = parseInt(req.params?.id);
  if (!taskId) {
    return res.status(400).json({});
  }

  const tasks = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
    [taskId, global.user_id],
  );

  if (tasks.rows.length === 0) {
    return res.status(404).json({});
  }

  return res.status(200).json(tasks.rows[0]);
}

async function update(req, res, next) {
  const { error, value: taskChange } = patchTaskSchema.validate(
    req.body ?? {},
    {
      abortEarly: false,
    },
  );

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const id = parseInt(req.params.id, 10);
  try {
    const updatedTask = await prisma.task.update({
      data: taskChange,
      where: {
        id,
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });

    return res.status(200).json(updatedTask);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err);
    }
  }
}

async function deleteTask(req, res) {
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({});
  }

  const task = await pool.query(
    "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed",
    [taskId, global.user_id],
  );

  if (task.rows.length === 0) {
    return res.status(404).json({});
  }

  return res.status(200).json(task.rows[0]);
}

module.exports = { create, index, show, update, deleteTask };
