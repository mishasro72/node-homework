const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
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
        priority: value.priority ?? "medium",
        userId: global.user_id,
      },
      select: { id: true, title: true, priority: true, isCompleted: true },
    });
  } catch (err) {
    return next(err);
  }

  return res.status(201).json(task);
}

async function index(req, res) {
  const tasks = await prisma.task.findMany({
    where: { userId: global.user_id },
    select: {
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (tasks.length === 0) {
    return res.status(404).json({});
  }

  return res.status(200).json(tasks);
}

async function show(req, res, next) {
  const taskId = parseInt(req.params?.id, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  try {
    const task = await prisma.task.findUniqueOrThrow({
      where: {
        id_userId: { id: taskId, userId: global.user_id },
      },
      select: { title: true, isCompleted: true, id: true },
    });
    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err);
    }
  }
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

  const id = parseInt(req.params?.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  try {
    const updatedTask = await prisma.task.update({
      data: taskChange,
      where: {
        id_userId: { id, userId: global.user_id },
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

async function deleteTask(req, res, next) {
  const taskId = parseInt(req.params?.id, 10);

  if (isNaN(taskId)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  try {
    const task = await prisma.task.delete({
      where: {
        id_userId: { id: taskId, userId: global.user_id },
      },
      select: { title: true, isCompleted: true, id: true },
    });
    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err);
    }
  }
}

module.exports = { create, index, show, update, deleteTask };
