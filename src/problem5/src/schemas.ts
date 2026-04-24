import { z } from 'zod';

export const TaskStatus = z.enum(['pending', 'in_progress', 'done']);
export const TaskPriority = z.enum(['low', 'medium', 'high']);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: TaskStatus.optional(),
    priority: TaskPriority.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided',
  });

const positiveInt = z.coerce.number().int().positive();

export const listQuerySchema = z.object({
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  q: z.string().trim().min(1).max(200).optional(),
  page: positiveInt.default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['created_at', '-created_at', 'updated_at', '-updated_at', 'priority', '-priority'])
    .default('-created_at'),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
