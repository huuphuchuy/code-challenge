import 'dotenv/config';
import { buildApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3000);

const app = buildApp();
app.listen(PORT, () => {
  console.log(`Crude server listening on http://localhost:${PORT}`);
  console.log(`  DB:    ${process.env.DB_PATH ?? './data/tasks.db'}`);
  console.log(`  Docs:  see README.md for curl examples`);
});
