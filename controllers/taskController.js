const { func } = require("joi");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

function taskCounter() {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
}

const getNextTaskId = taskCounter();

function create(req, res) {
  const { error, value } = taskSchema.validate(req.body ?? {}, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  const newTask = {
    id: getNextTaskId(),
    userId: global.user_id.email,
    ...value,
  };
  global.tasks.push(newTask);

  const { userId, ...sanitizedTask } = newTask;
  return res.status(201).json(sanitizedTask);
}

function index(req, res) {
  const user = global.user_id;
  const userTasks = global.tasks.filter((task) => task.userId === user.email);

  if (userTasks.length === 0) {
    return res.status(404).json({});
  }

  const sanitizedTask = userTasks.map(({ userId, ...rest }) => rest);
  return res.status(200).json(sanitizedTask);
}

function show(req, res) {
  const taskId = parseInt(req.params?.id);
  const user = global.user_id;
  if (!taskId) {
    return res.status(400).json({});
  }

  const currentTask = global.tasks.find(
    (task) => task.id === taskId && task.userId === user.email,
  );

  if (!currentTask) {
    return res.status(404).json({});
  }
  const { userId, ...sanitizedTask } = currentTask;
  return res.status(200).json(sanitizedTask);
}

function update(req, res) {
  const user = global.user_id;
  const { error, value } = patchTaskSchema.validate(req.body ?? {}, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const taskId = parseInt(req.params?.id);
  const currentTask = global.tasks.find(
    (task) => task.id === taskId && user.email === task.userId,
  );

  if (!currentTask) {
    return res.status(404).json({});
  }
  Object.assign(currentTask, value);

  const { userId, ...sanitizedTask } = currentTask;
  return res.status(200).json(sanitizedTask);
}

function deleteTask(req, res) {
  const user = global.user_id;
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({});
  }

  const currentTaskIndex = global.tasks.findIndex(
    (task) => task.userId === user.email && task.id === taskId,
  );

  if (currentTaskIndex === -1) {
    return res.status(404).json({});
  }

  const deletedTask = global.tasks.splice(currentTaskIndex, 1)[0];
  const { userId, ...sanitizedTask } = deletedTask;

  return res.status(200).json(sanitizedTask);
}

module.exports = { create, index, show, update, deleteTask };
