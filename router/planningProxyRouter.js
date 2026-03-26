const express = require('express');
const crypto = require('crypto');

const router = express.Router();

function ok(data, msg = 'ok') {
  return { success: true, data, msg };
}

function fail(error, code = 500) {
  const message = error && error.message ? error.message : String(error);
  return { success: false, code, error: message };
}

function calcTotalDays(examDate) {
  const today = new Date();
  const exam = new Date(examDate);
  return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function priorityForWeight(weight) {
  const w = Number(weight) || 1;
  const n = 6 - (w / 5) * 5; // w=5 => 1（高优先），w=1 => 5（低优先）
  const p = Math.round(n);
  return Math.max(1, Math.min(5, p));
}

function urgencyForDay(dayIdx, totalDays) {
  if (totalDays <= 1) return 10;
  const ratio = dayIdx / (totalDays - 1); // 0..1
  const u = Math.round(4 + ratio * 6); // 4..10
  return Math.max(1, Math.min(10, u));
}

function makeTaskId(dateStr, subject, type, chapterIdx) {
  const base = `${dateStr}|${subject}|${type}|${chapterIdx}`;
  return `task_${crypto.createHash('md5').update(base).digest('hex').slice(0, 10)}`;
}

function generateTasks(config) {
  const totalDays = calcTotalDays(config.examDate);
  const dailyMinutes = Number(config.dailyMinutes) || 120;
  const updateInterval = Number(config.updateInterval) || 24;

  const subjects = Array.isArray(config.subjects) ? config.subjects : [];
  if (!subjects.length || totalDays <= 0) {
    return {
      tasks: [],
      totalDays: 0,
      totalTasks: 0,
      totalMinutes: 0,
      weakPointCoverage: 0,
      subjectDistribution: {},
      generatedAt: new Date().toISOString(),
      nextUpdateAt: new Date(Date.now() + updateInterval * 60 * 60 * 1000).toISOString()
    };
  }

  const totalWeight = subjects.reduce((sum, s) => sum + (Number(s.weight) || 0), 0) || 1;

  const typeCycle = ['review', 'practice', 'feynman'];
  const typeTitle = { review: '复习', practice: '练习', feynman: '费曼自测' };

  const tasks = [];
  const subjectDistribution = {};

  for (let day = 0; day < totalDays; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    const dayUrgency = urgencyForDay(day, totalDays);
    let allocated = 0;

    for (let si = 0; si < subjects.length; si++) {
      const subject = subjects[si];
      const isLast = si === subjects.length - 1;
      const w = Number(subject.weight) || 1;

      const raw = (dailyMinutes * w) / totalWeight;
      const subjectMinutes = isLast ? Math.max(1, dailyMinutes - allocated) : Math.max(1, Math.round(raw));
      allocated += subjectMinutes;
      subjectDistribution[subject.name] = (subjectDistribution[subject.name] || 0) + subjectMinutes;

      const targetMinPerTask = subjectMinutes >= 50 ? 30 : 25;
      const taskCount = Math.max(1, Math.round(subjectMinutes / targetMinPerTask));
      const base = Math.floor(subjectMinutes / taskCount);
      const remainder = subjectMinutes - base * taskCount;

      for (let ti = 0; ti < taskCount; ti++) {
        const minutes = base + (ti < remainder ? 1 : 0);
        const type = typeCycle[(day + si + ti) % typeCycle.length];
        const chapterIdx = ti + 1;
        const knowledgePoint = `${subject.name}-章节${chapterIdx}`;

        tasks.push({
          id: makeTaskId(dateStr, subject.name, type, chapterIdx),
          date: dateStr,
          subject: subject.name,
          type,
          title: `${typeTitle[type]}：${knowledgePoint}`,
          minutes,
          priority: priorityForWeight(w),
          status: 'todo',
          urgency: dayUrgency,
          difficulty: 3,
          estimatedMinutes: minutes,
          knowledgePoint
        });
      }
    }
  }

  const totalMinutes = tasks.reduce((sum, t) => sum + t.minutes, 0);
  const nextUpdateAt = new Date(Date.now() + updateInterval * 60 * 60 * 1000);

  return {
    tasks,
    totalDays,
    totalTasks: tasks.length,
    totalMinutes,
    weakPointCoverage: 100,
    subjectDistribution,
    generatedAt: new Date().toISOString(),
    nextUpdateAt: nextUpdateAt.toISOString()
  };
}

router.get('/docs', (_req, res) => {
  res.json(
    ok({
      service: 'planningProxyRouter(self-contained)',
      basePath: '/api/planning',
      strategy: 'goal-only',
      endpoints: {
        generate: 'POST /api/planning/generate',
        complete: 'POST /api/planning/tasks/complete',
        updateTask: 'PUT /api/planning/tasks/:taskId',
        health: 'GET /api/planning/health'
      }
    })
  );
});

// 生成计划
router.post('/generate', async (req, res) => {
  try {
    const config = req.body || {};
    if (!config.examDate || !Array.isArray(config.subjects)) {
      return res.status(400).json(fail('missing examDate or subjects', 400));
    }

    const result = generateTasks(config);
    return res.json(ok(result, '生成计划成功'));
  } catch (e) {
    return res.status(500).json(fail(e));
  }
});

// 任务完成：只更新 status
router.post('/tasks/complete', async (req, res) => {
  try {
    const { taskId, currentTasks, config, actualMinutes } = req.body || {};
    if (!taskId || !Array.isArray(currentTasks) || !config) {
      return res.status(400).json(fail('missing taskId/currentTasks/config', 400));
    }

    const updatedTasks = currentTasks.map((t) =>
      t.id === taskId ? { ...t, status: 'done', actualMinutes: actualMinutes ?? t.actualMinutes } : t
    );

    const baseResult = generateTasks(config);
    const result = {
      ...baseResult,
      tasks: updatedTasks
    };

    return res.json(
      ok(
        {
          result,
          adjustment: {
            id: `adj_${Date.now()}`,
            timestamp: new Date().toISOString(),
            reason: 'task_completion',
            affectedTasks: [taskId],
            changes: { added: [], removed: [], modified: [] }
          }
        },
        '任务完成成功'
      )
    );
  } catch (e) {
    return res.status(500).json(fail(e));
  }
});

// 更新任务
router.put('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { changes, currentTasks } = req.body || {};

    if (!taskId || !Array.isArray(currentTasks) || !changes) {
      return res.status(400).json(fail('missing taskId/currentTasks/changes', 400));
    }

    const task = currentTasks.find((t) => t.id === taskId);
    if (!task) return res.status(404).json(fail('task not found', 404));

    const newTask = { ...task, ...changes };
    return res.json(ok(newTask, '更新任务成功'));
  } catch (e) {
    return res.status(500).json(fail(e));
  }
});

// 调整计划：当前 goal-only 直接重新生成（不依赖学情）
router.post('/adjust', async (req, res) => {
  try {
    const config = req.body?.config;
    const result = generateTasks(config);
    return res.json(ok({ result, adjustment: { reason: 'scheduled_update' } }, '调整成功'));
  } catch (e) {
    return res.status(500).json(fail(e));
  }
});

router.get('/health', (_req, res) => {
  res.json(ok({ status: 'ok' }, 'planning self-contained healthy'));
});

module.exports = router;

