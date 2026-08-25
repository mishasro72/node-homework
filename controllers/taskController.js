const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const { paginationSchema } = require("../validation/paginationSchema");
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
        userId: req.user.id,
      },
      select: { id: true, title: true, priority: true, isCompleted: true },
    });
  } catch (err) {
    return next(err);
  }

  return res.status(201).json(task);
}

async function index(req, res) {
  const { error, value } = paginationSchema.validate(req.query, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const { page, limit } = value;
  const skip = (page - 1) * limit;
  const find = req.query.find;

  const whereClause = { userId: req.user.id };

  if (find) {
    whereClause.title = {
      contains: find,
      mode: "insensitive",
    };
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      id: true,
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
    skip: skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const totalTasks = await prisma.task.count({
    where: whereClause,
  });

  const totalPages = Math.ceil(totalTasks / limit) || 1;

  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  return res.status(200).json({ tasks, pagination });
}

async function show(req, res, next) {
  const taskId = parseInt(req.params?.id, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  try {
    const task = await prisma.task.findUniqueOrThrow({
      where: {
        id_userId: { id: taskId, userId: req.user.id },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true, 
        userId: true,
        User: {
             select: { name: true },
        },
      },
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
        id_userId: { id, userId: req.user.id },
      },
      select: { title: true, isCompleted: true, id: true, priority: true },
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
        id_userId: { id: taskId, userId: req.user.id },
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

async function bulkCreate(req, res, next) {
  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  const validTasks = [];

  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: req.user.id,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, index, show, update, deleteTask, bulkCreate };
