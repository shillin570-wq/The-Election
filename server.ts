import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin, server-to-server, and local tooling without Origin header
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'election.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS states (
    id TEXT PRIMARY KEY,
    stateName TEXT,
    stateEn TEXT,
    electoralVotes INTEGER,
    overallTension TEXT
  );

  CREATE TABLE IF NOT EXISTS crises (
    id TEXT PRIMARY KEY,
    state_id TEXT,
    time TEXT,
    title TEXT,
    details TEXT,
    tension TEXT,
    trend TEXT,
    FOREIGN KEY (state_id) REFERENCES states(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  );
`);

// Seed data if empty
const { count: stateCount } = db.prepare('SELECT COUNT(*) as count FROM states').get() as { count: number };

if (stateCount === 0) {
  const insertState = db.prepare('INSERT INTO states (id, stateName, stateEn, electoralVotes, overallTension) VALUES (?, ?, ?, ?, ?)');
  const insertCrisis = db.prepare('INSERT INTO crises (id, state_id, time, title, details, tension, trend) VALUES (?, ?, ?, ?, ?, ?, ?)');

  const initialData = [
    {
      id: 'pa', stateName: '宾夕法尼亚州', stateEn: 'Pennsylvania', electoralVotes: 20, overallTension: '极高',
      crises: [
        { id: 'pa-1', time: '11-04 08:30', title: '邮寄选票截止日期争议', details: '共和党就州最高法院允许接收大选日后三天内寄达的邮寄选票提出紧急上诉，要求隔离这部分选票。', tension: '极高', trend: 'up' },
        { id: 'pa-2', time: '11-04 14:15', title: '费城计票中心抗议', details: '大量抗议者聚集在费城会议中心外，要求"停止计票"或"计算每一张选票"，双方阵营发生肢体冲突。', tension: '极高', trend: 'up' },
        { id: 'pa-3', time: '11-03 19:00', title: '裸票(Naked Ballots)作废风险', details: '由于缺乏保密信封，数万张邮寄选票面临被直接作废的风险，可能直接影响最终胜负差距。', tension: '高', trend: 'stable' },
        { id: 'pa-4', time: '11-05 10:00', title: '观察员距离限制诉讼', details: '特朗普竞选团队起诉要求其观察员能够更近距离地监督费城的计票过程，法院初步裁决允许靠近至6英尺。', tension: '中等', trend: 'down' }
      ]
    },
    {
      id: 'ga', stateName: '佐治亚州', stateEn: 'Georgia', electoralVotes: 16, overallTension: '极高',
      crises: [
        { id: 'ga-1', time: '11-03 22:45', title: '州立农业球馆水管破裂', details: '亚特兰大主要计票中心因声称的水管破裂导致计票工作突然中断数小时，引发广泛的阴谋论和质疑。', tension: '极高', trend: 'up' },
        { id: 'ga-2', time: '11-05 09:30', title: '选票差距极微触发重新计票', details: '两位候选人得票率差距缩小至0.1%以内，州务卿宣布将进行全面的手工重新计票和审计。', tension: '极高', trend: 'stable' },
        { id: 'ga-3', time: '11-03 12:00', title: '亚特兰大郊区投票机故障', details: '斯伯丁县等地的投票机在早晨出现软件故障，导致选民排队时间长达数小时，法院下令延长投票时间。', tension: '高', trend: 'down' }
      ]
    },
    {
      id: 'mi', stateName: '密歇根州', stateEn: 'Michigan', electoralVotes: 16, overallTension: '极高',
      crises: [
        { id: 'mi-1', time: '11-04 16:00', title: '底特律TCF中心计票冲突', details: '数百名抗议者试图冲入底特律TCF计票中心，敲打玻璃要求停止计票，警方被迫介入封锁大楼。', tension: '极高', trend: 'up' },
        { id: 'mi-2', time: '11-06 11:20', title: '安特里姆县(Antrim)制表错误', details: '由于县职员未更新软件，导致数千张投给共和党的选票被错误地计入民主党名下，虽已更正但引发全州对Dominion系统的质疑。', tension: '极高', trend: 'stable' },
        { id: 'mi-3', time: '11-04 09:00', title: '底特律缺席选票接收争议', details: '共和党观察员指控底特律在凌晨接收了数万张来历不明的缺席选票，提起诉讼要求停止认证结果。', tension: '高', trend: 'up' }
      ]
    },
    {
      id: 'az', stateName: '亚利桑那州', stateEn: 'Arizona', electoralVotes: 11, overallTension: '高',
      crises: [
        { id: 'az-1', time: '11-04 20:30', title: '马里科帕县计票中心武装对峙', details: '大量携带AR-15步枪的抗议者包围了马里科帕县选举部门，高喊"停止偷窃"，工作人员被迫在警察护送下离开。', tension: '极高', trend: 'up' },
        { id: 'az-2', time: '11-04 10:15', title: '"记号笔门(Sharpiegate)"阴谋论', details: '社交媒体疯传使用Sharpie记号笔填写的选票会被机器作废，导致大量选民涌入投票站抗议，州检察长介入调查。', tension: '高', trend: 'down' },
        { id: 'az-3', time: '11-03 23:20', title: '福克斯新闻提前"Call"州结果争议', details: '福克斯新闻在计票早期就宣布民主党拿下该州，引发共和党阵营强烈不满和内部混乱。', tension: '中等', trend: 'stable' }
      ]
    },
    {
      id: 'wi', stateName: '威斯康星州', stateEn: 'Wisconsin', electoralVotes: 10, overallTension: '高',
      crises: [
        { id: 'wi-1', time: '11-04 03:30', title: '密尔沃基深夜选票激增', details: '密尔沃基市在凌晨报告了约17万张缺席选票结果，导致选情瞬间反转，引发"选票倾倒(Ballot Dump)"的强烈质疑。', tension: '极高', trend: 'up' },
        { id: 'wi-2', time: '11-05 14:00', title: '重新计票要求与费用争议', details: '由于差距小于1%，落后方要求重新计票，但根据州法律需自付约300万美元费用，双方就计票范围展开博弈。', tension: '高', trend: 'stable' },
        { id: 'wi-3', time: '11-03 15:45', title: '选民意向被基诺沙骚乱重塑', details: '几个月前的基诺沙枪击案和骚乱深刻改变了当地郊区选民的投票倾向，导致该区域选情异常胶着。', tension: '中等', trend: 'down' }
      ]
    },
    {
      id: 'nv', stateName: '内华达州', stateEn: 'Nevada', electoralVotes: 6, overallTension: '中等',
      crises: [
        { id: 'nv-1', time: '11-05 10:30', title: '克拉克县签名验证机器争议', details: '诉讼指控克拉克县(拉斯维加斯)使用的自动签名验证机器标准过低，导致大量不合格的邮寄选票被计入。', tension: '高', trend: 'up' },
        { id: 'nv-2', time: '11-05 16:00', title: '非居民投票欺诈指控', details: '共和党向司法部提交了数千份据称已搬离内华达州但仍在该州投票的选民名单，要求进行刑事调查。', tension: '高', trend: 'stable' },
        { id: 'nv-3', time: '11-04 12:00', title: '计票进度极其缓慢', details: '由于大量邮寄选票和复杂的验证程序，内华达州的计票进度落后于全国，引发全国范围内的焦虑和网络群嘲。', tension: '中等', trend: 'down' }
      ]
    },
    {
      id: 'nc', stateName: '北卡罗来纳州', stateEn: 'North Carolina', electoralVotes: 15, overallTension: '中等',
      crises: [
        { id: 'nc-1', time: '11-03 17:00', title: '投票站延迟关闭', details: '由于早晨的技术故障，四个投票站被法院下令延长开放时间45分钟，导致全州选举结果的公布被推迟。', tension: '中等', trend: 'down' },
        { id: 'nc-2', time: '11-06 09:00', title: '邮寄选票接收宽限期争议', details: '最高法院允许北卡将邮寄选票的接收截止日期延长至大选后9天，只要邮戳在选举日之前，引发持续的法律挑战。', tension: '高', trend: 'stable' },
        { id: 'nc-3', time: '11-04 11:00', title: '缺席选票见证人签名缺陷', details: '数千张缺席选票因缺少见证人签名面临作废，州选举委员会允许选民通过提交宣誓书来"治愈"选票的决定遭到起诉。', tension: '高', trend: 'up' }
      ]
    }
  ];

  const transaction = db.transaction((states) => {
    for (const state of states) {
      insertState.run(state.id, state.stateName, state.stateEn, state.electoralVotes, state.overallTension);
      for (const crisis of state.crises) {
        insertCrisis.run(crisis.id, state.id, crisis.time, crisis.title, crisis.details, crisis.tension, crisis.trend);
      }
    }
  });

  transaction(initialData);
}

const { count: userCount } = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount === 0) {
  const insertUser = db.prepare('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)');
  insertUser.run('u1', 'SAMUN ELECTION', 'ACMUNC2026', 'admin');
  insertUser.run('u2', 'SAMUN', 'ELCTION2020', 'viewer');
}

// API Routes

// Auth
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as any;
  
  if (user) {
    res.json({ success: true, role: user.role, username: user.username });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Users
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, role FROM users').all();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { username, password, role } = req.body;
  const id = `u-${Date.now()}`;
  try {
    const stmt = db.prepare('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)');
    stmt.run(id, username, password, role);
    res.json({ success: true, id });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ success: false, message: 'Username already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Database error' });
    }
  }
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { password, role } = req.body;
  
  if (password) {
    const stmt = db.prepare('UPDATE users SET password = ?, role = ? WHERE id = ?');
    stmt.run(password, role, id);
  } else {
    const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    stmt.run(role, id);
  }
  res.json({ success: true });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.run(id);
  res.json({ success: true });
});

// States and Crises
app.get('/api/states', (req, res) => {
  const states = db.prepare('SELECT * FROM states').all();
  const crises = db.prepare('SELECT * FROM crises').all();

  const statesData = states.map((state: any) => ({
    ...state,
    crises: crises.filter((c: any) => c.state_id === state.id)
  }));

  res.json(statesData);
});

app.post('/api/crises', (req, res) => {
  const { state_id, title, details, tension, trend } = req.body;
  const id = `${state_id}-${Date.now()}`;
  
  const now = new Date();
  const time = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const stmt = db.prepare('INSERT INTO crises (id, state_id, time, title, details, tension, trend) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, state_id, time, title, details, tension, trend);

  res.json({ success: true, id, time });
});

app.patch('/api/crises/:id', (req, res) => {
  const { id } = req.params;
  const { tension } = req.body;

  const stmt = db.prepare('UPDATE crises SET tension = ? WHERE id = ?');
  stmt.run(tension, id);

  res.json({ success: true });
});

app.put('/api/crises/:id', (req, res) => {
  const { id } = req.params;
  const { title, details, tension, trend } = req.body;

  const stmt = db.prepare('UPDATE crises SET title = ?, details = ?, tension = ?, trend = ? WHERE id = ?');
  stmt.run(title, details, tension, trend, id);

  res.json({ success: true });
});

app.delete('/api/crises/:id', (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare('DELETE FROM crises WHERE id = ?');
  stmt.run(id);

  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
