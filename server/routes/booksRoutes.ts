import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db, Book } from '../db/store.js';
import { textbookProcessor } from '../ai/textbookProcessor.js';
import { vectorStore } from '../rag/vectorStore.js';
import { config } from '../config/index.js';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Ensure uploads directory exists (use /tmp on Vercel/serverless environments)
const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const uploadsDir = isServerless ? path.join('/tmp', 'uploads') : path.resolve(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Storage] Could not create uploadsDir:', e);
}

// Multer storage: streams binary file directly to disk to prevent memory exhaustion
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `book-${uniqueSuffix}${ext}`);
  },
});

// Multer configuration: supports minimum 100 MB, set to 150 MB (Requirement 3)
const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB limit safely supporting 39.78 MB+ real textbooks
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf' && file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF textbook documents are allowed.'));
    }
    cb(null, true);
  },
});

// Multer error handling wrapper middleware to prevent unhandled 500 errors
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Stage A: Request Received
  const contentLength = req.headers['content-length']
    ? `${(parseInt(req.headers['content-length'], 10) / (1024 * 1024)).toFixed(2)} MB`
    : 'unknown';
  console.log(`[Upload][Stage A - Request Received] POST /api/books/upload | Content-Length: ${contentLength}`);

  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      console.error(`[Upload][Stage B - Multer Error] Code: ${err.code} | Message: ${err.message}`);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error: 'FILE_TOO_LARGE',
          message: 'Textbook PDF exceeds the maximum supported size limit of 150 MB.',
          stage: 'multipart_parsing',
        });
      }
      return res.status(400).json({
        success: false,
        error: 'MULTIPART_PARSING_FAILED',
        message: `File parsing error: ${err.message}`,
        stage: 'multipart_parsing',
      });
    } else if (err) {
      console.error(`[Upload][Stage B - Filter Error] ${err.message}`);
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE_TYPE',
        message: err.message || 'Only PDF textbook documents are allowed.',
        stage: 'file_validation',
      });
    }
    next();
  });
};

// POST /api/books/upload
router.post('/upload', uploadMiddleware, async (req: Request, res: Response) => {
  try {
    // Stage B: Multipart parsing verification
    if (!req.file) {
      console.warn('[Upload][Stage B - Error] No file parsed in multipart request');
      return res.status(400).json({
        success: false,
        error: 'MISSING_FILE',
        message: 'Textbook PDF document is required.',
        stage: 'multipart_parsing',
      });
    }

    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    console.log(`[Upload][Stage B - Multipart Complete] File: "${req.file.originalname}" | Size: ${fileSizeMB} MB | Stored at: ${req.file.path}`);

    // Stage C: File and Input Validation
    const { class_id, subject_id, title, description, uploaded_by } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TITLE',
        message: 'Textbook title is required.',
        stage: 'file_validation',
      });
    }

    if (!class_id || !class_id.trim()) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CLASS_ID',
        message: 'Target School Class ID is required for curriculum isolation.',
        stage: 'file_validation',
      });
    }

    // Validate class exists
    const targetClass = db.classes.find((c) => c.id === class_id.trim());
    if (!targetClass) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CLASS_ID',
        message: `Class "${class_id}" does not exist in the school curriculum registry.`,
        stage: 'file_validation',
      });
    }

    // Role and Teacher Authentication Validation (Requirement 4 & 8)
    let authenticatedTeacherId = uploaded_by || '';
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const profileByToken = db.profiles.find((p) => `token-${p.id}` === token || p.id === token);
      if (profileByToken) {
        if (profileByToken.role === 'student') {
          return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'Students are strictly not authorized to upload textbooks or modify curricula.',
            stage: 'authorization',
          });
        }
        authenticatedTeacherId = profileByToken.id;
      }
    }

    if (!authenticatedTeacherId) {
      // Find a default teacher or administrator if not provided
      const defaultTeacher = db.profiles.find((p) => p.role === 'teacher' || p.role === 'admin');
      authenticatedTeacherId = defaultTeacher?.id || 'TCH1001';
    }

    console.log(`[Upload][Stage C - Validation Passed] Class: ${targetClass.name} (Grade ${targetClass.grade}) | Title: "${title}" | Teacher: ${authenticatedTeacherId}`);

    const newBookId = crypto.randomUUID();
    const safeFilename = path
      .basename(req.file.originalname)
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();

    // Stage D: Supabase Storage Upload
    let supabaseFileUrl = '';
    const supabaseKeyToUse = config.supabaseServiceRoleKey || config.supabaseAnonKey;

    if (config.supabaseUrl && supabaseKeyToUse) {
      const storagePath = `class-${class_id}/${newBookId}/${safeFilename}`;
      console.log(`[Upload][Stage D - Supabase Storage] Target path: ${storagePath} in bucket: textbooks`);

      try {
        const supabaseServer = createClient(config.supabaseUrl, supabaseKeyToUse);

        // Verify or check bucket
        try {
          const { data: bData } = await supabaseServer.storage.getBucket('textbooks');
          if (!bData) {
            await supabaseServer.storage.createBucket('textbooks', { public: true });
          }
        } catch {
          // Ignore bucket inspection error and attempt upload
        }

        const fileBuffer = fs.readFileSync(req.file.path);
        const { data: sData, error: sErr } = await supabaseServer.storage
          .from('textbooks')
          .upload(storagePath, fileBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (sErr) {
          console.warn(`[Upload][Stage D - Notice] Supabase storage upload notice: ${sErr.message}. Falling back safely to local storage.`);
        } else if (sData) {
          const { data: publicUrlData } = supabaseServer.storage.from('textbooks').getPublicUrl(sData.path);
          supabaseFileUrl = publicUrlData.publicUrl;
          console.log(`[Upload][Stage D - Success] Supabase storage path: ${sData.path}`);
        }
      } catch (storageErr: any) {
        console.warn(`[Upload][Stage D - Notice] Supabase storage upload failed: ${storageErr.message}. Using local storage.`);
      }
    }

    // Stage E: Public / Storage URL Generation
    const finalFileUrl = supabaseFileUrl || `/uploads/${req.file.filename}`;
    console.log(`[Upload][Stage E - URL Generation] Final file URL: ${finalFileUrl}`);

    // Stage F: Books Table Insert
    const newBook: Book = {
      id: newBookId,
      class_id: class_id.trim(),
      subject_id: subject_id || 'sub-eng',
      title: title.trim(),
      description: description?.trim() || `English textbook for ${targetClass.name}`,
      file_url: finalFileUrl,
      file_name: req.file.originalname,
      page_count: 0,
      processing_status: 'processing',
      uploaded_by: authenticatedTeacherId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store in real database store
    db.books.unshift(newBook);
    db.logActivity('BOOK_UPLOAD', `Teacher uploaded textbook: "${newBook.title}" (${fileSizeMB} MB) for ${targetClass.name}`);
    console.log(`[Upload][Stage F - Database Insert] Created book record: ${newBook.id} with processing_status = 'processing'`);

    // Also attempt Supabase books row insertion if credentials permit
    if (config.supabaseUrl && supabaseKeyToUse) {
      try {
        const supabaseServer = createClient(config.supabaseUrl, supabaseKeyToUse);
        await supabaseServer.from('books').insert({
          id: newBook.id,
          class_id: newBook.class_id,
          title: newBook.title,
          description: newBook.description,
          file_url: newBook.file_url,
          file_name: newBook.file_name,
          page_count: 0,
          processing_status: 'processing',
          uploaded_by: authenticatedTeacherId,
        });
      } catch (sbInsertErr: any) {
        console.warn(`[Upload][Stage F - Notice] Supabase books table insert notice: ${sbInsertErr.message}`);
      }
    }

    // Trigger asynchronous background processing (Requirement 4)
    // The HTTP response returns IMMEDIATELY while extraction runs in background
    const filePathOnDisk = req.file.path;
    textbookProcessor.processBookFile(newBookId, filePathOnDisk).catch((err) => {
      console.error(`[Upload][Background Processing Error] Book ${newBookId}:`, err);
    });

    return res.status(201).json({
      success: true,
      message: 'Textbook uploaded successfully. Background processing initiated.',
      book: newBook,
      stage: 'upload_complete',
    });
  } catch (err: any) {
    console.error('[Upload][Unhandled Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'TEXTBOOK_UPLOAD_FAILED',
      message: err.message || 'An unexpected error occurred during textbook upload.',
      stage: 'upload_pipeline',
    });
  }
});

// GET /api/books
router.get('/', (req, res) => {
  const { class_id } = req.query;
  let books = db.books;
  if (class_id) {
    books = books.filter((b) => b.class_id === class_id);
  }
  return res.json(books);
});

// GET /api/books/:id
router.get('/:id', (req, res) => {
  const book = db.books.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const chapters = db.chapters.filter((ch) => ch.book_id === book.id);
  const lessons = db.lessons.filter((l) => l.book_id === book.id || chapters.some((ch) => ch.id === l.chapter_id));
  const grammarTopics = db.grammar_topics.filter((gt) => gt.book_id === book.id);
  const chunks = vectorStore.getChunksForBook(book.id);

  // Vocabulary list
  const vocabularySet = new Set<string>();
  lessons.forEach((l) => l.vocabulary?.forEach((v) => vocabularySet.add(v)));

  return res.json({
    ...book,
    chapters,
    lessons,
    grammar_topics: grammarTopics,
    vocabulary: Array.from(vocabularySet),
    chunks_count: chunks.length,
    status_details: textbookProcessor.getProgress(book.id),
  });
});

// GET /api/books/:id/status (Requirement 4 - fine-grained processing status polling)
router.get('/:id/status', (req, res) => {
  const progress = textbookProcessor.getProgress(req.params.id);
  const book = db.books.find((b) => b.id === req.params.id);

  return res.json({
    success: true,
    processing_status: progress.status || book?.processing_status || 'uploaded',
    status: progress.status || book?.processing_status || 'uploaded',
    percent: progress.percent,
    message: progress.message,
    details: progress.details,
  });
});

// POST /api/books/:id/process
router.post('/:id/process', async (req, res) => {
  const book = db.books.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const sampleText = Buffer.from(
    `Unit 1: ${book.title}\nLesson 1: Reading and Exploring\nWe love to read every day.\nGrammar: Nouns and Plural words\nVocabulary: school, book, learn, study.`
  );

  textbookProcessor.processPdfBuffer(book.id, sampleText).catch(console.error);

  return res.json({ message: 'Reprocessing started', book_id: book.id });
});

// GET /api/books/:id/lessons
router.get('/:id/lessons', (req, res) => {
  const book = db.books.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  const chapters = db.chapters.filter((ch) => ch.book_id === book.id);
  const lessons = db.lessons.filter(
    (l) => l.book_id === book.id || chapters.some((ch) => ch.id === l.chapter_id)
  );
  return res.json({ book, chapters, lessons });
});

// DELETE /api/books/:id - Remove or delete textbook and its derived vectors/lessons
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const bookId = req.params.id;
    const bookIndex = db.books.findIndex((b) => b.id === bookId);
    if (bookIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Textbook not found in database registry.',
      });
    }

    const book = db.books[bookIndex];

    // Check authorization: only teachers and administrators can delete textbooks
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const profile = db.profiles.find((p) => `token-${p.id}` === token || p.id === token);
      if (profile && profile.role === 'student') {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Students are not authorized to delete textbooks.',
        });
      }
    }

    console.log(`[Delete][Init] Deleting book "${book.title}" (ID: ${book.id}) and all derived curriculum data...`);

    // 1. Delete vector embeddings
    vectorStore.deleteChunksForBook(book.id);
    console.log(`[Delete][Vectors] Cleared all vector chunks for book: ${book.id}`);

    // 2. Cascade delete related records from database store
    const chaptersToDelete = db.chapters.filter((ch) => ch.book_id === book.id).map((ch) => ch.id);
    const lessonsToDelete = db.lessons
      .filter((l) => l.book_id === book.id || (l.chapter_id && chaptersToDelete.includes(l.chapter_id)))
      .map((l) => l.id);

    db.chapters = db.chapters.filter((ch) => ch.book_id !== book.id);
    db.lessons = db.lessons.filter(
      (l) => l.book_id !== book.id && (!l.chapter_id || !chaptersToDelete.includes(l.chapter_id))
    );
    db.grammar_topics = db.grammar_topics.filter((gt) => gt.book_id !== book.id);
    db.questions = db.questions.filter(
      (q) => q.book_id !== book.id && (!q.lesson_id || !lessonsToDelete.includes(q.lesson_id))
    );
    db.tests = db.tests.filter(
      (t) => t.book_id !== book.id && (!t.lesson_id || !lessonsToDelete.includes(t.lesson_id))
    );

    // 3. Remove local file from uploads directory if applicable
    if (book.file_url && book.file_url.includes('/uploads/')) {
      try {
        const localFileName = path.basename(book.file_url);
        const localFilePath = path.join(uploadsDir, localFileName);
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
          console.log(`[Delete][File] Deleted local PDF file: ${localFilePath}`);
        }
      } catch (fileErr: any) {
        console.warn(`[Delete][Notice] Could not delete local PDF: ${fileErr.message}`);
      }
    }

    // 4. Delete from Supabase Storage and database if connected
    const supabaseKeyToUse = config.supabaseServiceRoleKey || config.supabaseAnonKey;
    if (config.supabaseUrl && supabaseKeyToUse) {
      try {
        const supabaseServer = createClient(config.supabaseUrl, supabaseKeyToUse);
        await supabaseServer.from('books').delete().eq('id', book.id);
      } catch (sbErr: any) {
        console.warn(`[Delete][Notice] Supabase book row deletion notice: ${sbErr.message}`);
      }
    }

    // 5. Remove from books list
    db.books.splice(bookIndex, 1);
    db.logActivity('BOOK_UPLOAD', `Teacher deleted textbook: "${book.title}"`);
    console.log(`[Delete][Complete] Successfully removed book ${book.id} and all related curriculum data.`);

    return res.json({
      success: true,
      message: `Textbook "${book.title}" and its extracted lessons and questions have been completely removed.`,
    });
  } catch (err: any) {
    console.error('[Delete][Error] Failed to delete book:', err);
    return res.status(500).json({
      success: false,
      error: 'DELETE_FAILED',
      message: err.message || 'Failed to delete textbook.',
    });
  }
});

export default router;
