import 'dotenv/config';
import { db } from './db.js';

const samples = [
  { title: 'Write project specification',    priority: 'high',   status: 'done' },
  { title: 'Set up CI/CD pipeline',           priority: 'high',   status: 'in_progress' },
  { title: 'Refactor authentication module',  priority: 'medium', status: 'pending' },
  { title: 'Update onboarding docs',          priority: 'low',    status: 'pending' },
  { title: 'Review PR #142',                  priority: 'medium', status: 'pending' },
  { title: 'Migrate legacy cron jobs',        priority: 'high',   status: 'pending' },
  { title: 'Fix timezone bug in reports',     priority: 'medium', status: 'in_progress' },
  { title: 'Schedule team retro',             priority: 'low',    status: 'done' },
];

const insert = db.prepare(
  `INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)`,
);

const wipe = db.prepare('DELETE FROM tasks');
const count = db.prepare('SELECT COUNT(*) AS n FROM tasks').get() as { n: number };

if (count.n > 0) {
  console.log(`Wiping existing ${count.n} task(s)...`);
  wipe.run();
}

const tx = db.transaction(() => {
  for (const s of samples) {
    insert.run(s.title, null, s.status, s.priority);
  }
});
tx();

console.log(`Seeded ${samples.length} tasks.`);
