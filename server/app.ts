import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/index.js';
import authRoutes from './routes/authRoutes.js';
import booksRoutes from './routes/booksRoutes.js';
import lessonsRoutes from './routes/lessonsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import questionsRoutes from './routes/questionsRoutes.js';
import testsRoutes from './routes/testsRoutes.js';
import classesRoutes from './routes/classesRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import sectionsRoutes from './routes/sectionsRoutes.js';
import subjectsRoutes from './routes/subjectsRoutes.js';
import teacherAssignmentsRoutes from './routes/teacherAssignmentsRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import homeworkRoutes from './routes/homeworkRoutes.js';
import examsRoutes from './routes/examsRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import feesRoutes from './routes/feesRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';
import messagesRoutes from './routes/messagesRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import csvImportRoutes from './routes/csvImportRoutes.js';
import novaRoutes from './routes/novaRoutes.js';
import { groqClient } from './ai/groqClient.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory (supports Vercel /tmp or local uploads)
const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const uploadsPath = isServerless ? path.join('/tmp', 'uploads') : path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));
app.use('/api/uploads', express.static(uploadsPath));

// API Routes mounted on both /api/... and /... for universal compatibility
const apiSubroutes: [string, any][] = [
  ['/auth', authRoutes],
  ['/admin', adminRoutes],
  ['/books', booksRoutes],
  ['/lessons', lessonsRoutes],
  ['/ai', aiRoutes],
  ['/nova', novaRoutes],
  ['/questions', questionsRoutes],
  ['/tests', testsRoutes],
  ['/classes', classesRoutes],
  ['/sections', sectionsRoutes],
  ['/subjects', subjectsRoutes],
  ['/teacher-assignments', teacherAssignmentsRoutes],
  ['/attendance', attendanceRoutes],
  ['/homework', homeworkRoutes],
  ['/exams', examsRoutes],
  ['/timetable', timetableRoutes],
  ['/fees', feesRoutes],
  ['/notifications', notificationsRoutes],
  ['/messages', messagesRoutes],
  ['/reports', reportsRoutes],
  ['/csv-import', csvImportRoutes],
];

apiSubroutes.forEach(([prefix, routeHandler]) => {
  app.use(`/api${prefix}`, routeHandler);
  app.use(prefix, routeHandler);
});

// Analytics and Progress routes
app.use('/api', analyticsRoutes);
app.use('/', analyticsRoutes);

// Health check endpoint
const healthHandler = async (_req: express.Request, res: express.Response) => {
  const groqOk = await groqClient.isHealthy();
  return res.json({
    status: 'ONLINE',
    app: 'EnglishIQ API',
    groq_ai: groqOk ? 'ONLINE' : 'OFFLINE',
    port: config.port,
    environment: isServerless ? 'vercel-serverless' : 'standalone-node',
    timestamp: new Date().toISOString(),
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected internal server error occurred.',
    stage: 'server_pipeline',
  });
});

export default app;
export { app };
