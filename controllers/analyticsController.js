const prisma = require("../db/prisma");

async function getUserAnalytics(req, res, next) {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!global.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userId !== global.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    const taskStats = await prisma.task.groupBy({
      by: ["isCompleted"],
      where: { userId },
      _count: {
        id: true,
      },
    });

    const recentTasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        User: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const weeklyProgress = await prisma.task.groupBy({
      by: ["createdAt"],
      where: {
        userId,
        createdAt: { gte: oneWeekAgo },
      },
      _count: { id: true },
    });
    return res.status(200).json({
      taskStats,
      recentTasks,
      weeklyProgress,
    });
  } catch (err) {
    return next(err);
  }
}

async function getUsersWithStats(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const usersRaw = await prisma.user.findMany({
      include: {
        Task: {
          where: { isCompleted: false },
          select: { id: true },
          take: 5,
        },
        _count: {
          select: {
            Task: true,
          },
        },
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const users = usersRaw.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      _count: user._count,
      Task: user.Task,
    }));

    const totalUsers = await prisma.user.count();
    const totalPages = Math.ceil(totalUsers / limit) || 1;

    const pagination = {
      page,
      limit,
      total: totalUsers,
      pages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
    res.status(200).json({ users, pagination });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getUserAnalytics, getUsersWithStats };
