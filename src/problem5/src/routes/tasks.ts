import { Router, type Request, type Response } from 'express';
import { db } from '../db.js';
import { HttpError } from '../errors.js';
import {
  createTaskSchema,
  updateTaskSchema,
  listQuerySchema,
  idParamSchema,
  type ListQuery,
} from '../schemas.js';

export const tasksRouter = Router();

type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
};

type TaskDTO = {
  id: number;
  title: string;
  description: string | null;
  status: TaskRow['status'];
  priority: TaskRow['priority'];
  createdAt: string;
  updatedAt: string;
};

function toDTO(row: TaskRow): TaskDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/tasks — create
// ────────────────────────────────────────────────────────────────────────────────
tasksRouter.post('/', (req: Request, res: Response) => {
  const input = createTaskSchema.parse(req.body);

  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, status, priority)
    VALUES (?, ?, COALESCE(?, 'pending'), COALESCE(?, 'medium'))
    RETURNING *
  `);
  const row = stmt.get(
    input.title,
    input.description ?? null,
    input.status ?? null,
    input.priority ?? null,
  ) as TaskRow;

  res.status(201).json(toDTO(row));
});

// ────────────────────────────────────────────────────────────────────────────────
// GET /api/tasks — list with filters + pagination
// ────────────────────────────────────────────────────────────────────────────────
tasksRouter.get('/', (req: Request, res: Response) => {
  const q: ListQuery = listQuerySchema.parse(req.query);

  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (q.status) {
    where.push('status = @status');
    params.status = q.status;
  }
  if (q.priority) {
    where.push('priority = @priority');
    params.priority = q.priority;
  }
  if (q.q) {
    where.push("(title LIKE @q OR IFNULL(description, '') LIKE @q)");
    params.q = `%${q.q}%`;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // sort: "-created_at" desc, "created_at" asc, ... (whitelisted by zod)
  const desc = q.sort.startsWith('-');
  const col = desc ? q.sort.slice(1) : q.sort;
  const orderSql = `ORDER BY ${col} ${desc ? 'DESC' : 'ASC'}, id ${desc ? 'DESC' : 'ASC'}`;

  const offset = (q.page - 1) * q.limit;

  const rows = db
    .prepare(`SELECT * FROM tasks ${whereSql} ${orderSql} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: q.limit, offset }) as TaskRow[];

  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM tasks ${whereSql}`)
    .get(params) as { total: number };

  res.json({
    data: rows.map(toDTO),
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.limit)),
    },
    filters: {
      status: q.status ?? null,
      priority: q.priority ?? null,
      q: q.q ?? null,
      sort: q.sort,
    },
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// GET /api/tasks/:id — read one
// ────────────────────────────────────────────────────────────────────────────────
tasksRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
  if (!row) throw new HttpError(404, `Task ${id} not found`);
  res.json(toDTO(row));
});

// ────────────────────────────────────────────────────────────────────────────────
// PATCH /api/tasks/:id — partial update
// ────────────────────────────────────────────────────────────────────────────────
tasksRouter.patch('/:id', (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateTaskSchema.parse(req.body);

  const exists = db.prepare('SELECT 1 FROM tasks WHERE id = ?').get(id);
  if (!exists) throw new HttpError(404, `Task ${id} not found`);

  const sets: string[] = [];
  const params: Record<string, unknown> = { id };

  if (input.title !== undefined) {
    sets.push('title = @title');
    params.title = input.title;
  }
  if (input.description !== undefined) {
    sets.push('description = @description');
    params.description = input.description;
  }
  if (input.status !== undefined) {
    sets.push('status = @status');
    params.status = input.status;
  }
  if (input.priority !== undefined) {
    sets.push('priority = @priority');
    params.priority = input.priority;
  }
  sets.push(`updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`);

  const row = db
    .prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = @id RETURNING *`)
    .get(params) as TaskRow;

  res.json(toDTO(row));
});

// ────────────────────────────────────────────────────────────────────────────────
// DELETE /api/tasks/:id
// ────────────────────────────────────────────────────────────────────────────────
tasksRouter.delete('/:id', (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (result.changes === 0) throw new HttpError(404, `Task ${id} not found`);
  res.status(204).end();
});
