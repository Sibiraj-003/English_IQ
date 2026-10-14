import { z } from 'zod';
import { groqClient, ChatMessage } from './groqClient.js';
import { db, Question } from '../db/store.js';

const GeneratedQuestionSchema = z.object({
  question_text: z.string(),
  question_type: z.enum(['MCQ', 'fill_in_the_blanks', 'true_false', 'short_answer']).default('MCQ'),
  options: z.array(z.string()).default([]),
  correct_answer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Easy'),
  topic: z.string(),
  source_page: z.number().default(1),
});

const GeneratedQuestionsArraySchema = z.array(GeneratedQuestionSchema);

export interface GenerateQuestionsRequest {
  class_id: string;
  book_id: string;
  lesson_id?: string;
  topic?: string;
  count: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  question_type?: 'MCQ' | 'fill_in_the_blanks' | 'true_false' | 'short_answer';
}

export class QuestionGeneratorService {
  async generateQuestions(req: GenerateQuestionsRequest): Promise<Question[]> {
    const targetClass = db.classes.find((c) => c.id === req.class_id);
    const targetBook = db.books.find((b) => b.id === req.book_id) || db.books[0];
    const targetLesson = req.lesson_id ? db.lessons.find((l) => l.id === req.lesson_id) : undefined;

    const className = targetClass?.name || 'Class 1';
    const grade = targetClass?.grade || 1;
    const lessonTitle = targetLesson ? targetLesson.title : 'All Lessons';
    const lessonContent = targetLesson
      ? targetLesson.content
      : db.lessons
          .filter((l) => l.chapter_id && (!req.book_id || l.book_id === req.book_id))
          .map((l) => `${l.title}: ${l.content}`)
          .slice(0, 4)
          .join('\n\n');

    const prompt = `You are an educational assessment generator for ${className}.
Generate ${req.count || 3} high quality questions strictly grounded in the textbook content below.

REQUIREMENTS:
1. Match ${className} (Grade ${grade}) level. Age-appropriate vocabulary.
2. Question type: ${req.question_type || 'MCQ'}.
3. Difficulty: ${req.difficulty || 'Easy'}.
4. Focus topic: ${req.topic || targetLesson?.grammar_topics?.[0] || 'English Grammar & Vocabulary'}.
5. If MCQ, provide exactly 4 clear options and ensure "correct_answer" exactly matches one of the options.
6. Return a JSON ARRAY of question objects ONLY. Do not include markdown codeblocks or conversational text.

JSON format expected:
[
  {
    "question_text": "Question here",
    "question_type": "MCQ",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Clear child-friendly explanation",
    "difficulty": "${req.difficulty || 'Easy'}",
    "topic": "${req.topic || 'Grammar'}",
    "source_page": 4
  }
]

TEXTBOOK CONTEXT:
Book: ${targetBook?.title || 'English Textbook'}
Lesson: ${lessonTitle}
Content:
${lessonContent}`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an educational test generator that returns only valid JSON arrays without markdown or commentary.',
      },
      { role: 'user', content: prompt },
    ];

    try {
      const targetCount = Math.max(1, Math.min(50, req.count || 3));
      const requiredTokens = Math.min(4096, Math.max(1500, targetCount * 220));

      const rawText = await groqClient.createChatCompletion(messages, {
        temperature: 0.2,
        max_tokens: requiredTokens,
      });

      // Extract JSON cleanly
      const cleanedJson = this.extractJsonArray(rawText);
      const parsed = JSON.parse(cleanedJson);
      const validated = GeneratedQuestionsArraySchema.parse(parsed);

      const createdQuestions: Question[] = validated.slice(0, targetCount).map((q, idx) => {
        const newQuestion: Question = {
          id: `gen-q-${Date.now()}-${idx + 1}`,
          class_id: req.class_id,
          book_id: req.book_id,
          lesson_id: req.lesson_id,
          question_type: q.question_type,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          topic: q.topic || req.topic || 'General',
          source_page: q.source_page || 1,
          status: 'draft', // MUST default to draft for Teacher Review!
          created_at: new Date().toISOString(),
        };
        db.questions.push(newQuestion);
        return newQuestion;
      });

      return createdQuestions;
    } catch (err: any) {
      console.warn('Groq Question Generator fallback:', err.message);

      const targetCount = Math.max(1, Math.min(50, req.count || 3));
      const grammarPool = [
        {
          q: `Which of the following is a naming word (Noun) from ${lessonTitle}?`,
          opts: ['puppy', 'play', 'loudly', 'under'],
          ans: 'puppy',
          exp: '"puppy" is the name of an animal, which is a noun.',
          topic: req.topic || 'Nouns',
        },
        {
          q: `Choose the correct action word (Verb): "The children _____ happily in the garden."`,
          opts: ['played', 'blue', 'desk', 'slowly'],
          ans: 'played',
          exp: '"played" is an action word that tells what the children did.',
          topic: req.topic || 'Verbs',
        },
        {
          q: `Identify the describing word (Adjective) in: "The clever fox found food."`,
          opts: ['clever', 'fox', 'found', 'food'],
          ans: 'clever',
          exp: '"clever" describes the quality of the fox, making it an adjective.',
          topic: req.topic || 'Adjectives',
        },
        {
          q: `Select the correct plural form of "flower":`,
          opts: ['flowers', 'floweres', 'floweries', 'flowerz'],
          ans: 'flowers',
          exp: 'We add -s to form the regular plural noun "flowers".',
          topic: req.topic || 'Plural Nouns',
        },
        {
          q: `Which punctuation mark belongs at the end of this sentence: "Where is the library book"`,
          opts: ['?', '.', '!', ','],
          ans: '?',
          exp: 'Sentences that ask questions must conclude with a question mark (?).',
          topic: req.topic || 'Punctuation',
        },
        {
          q: `Fill in the missing pronoun: "Ravi likes books. _____ reads every night."`,
          opts: ['He', 'She', 'It', 'They'],
          ans: 'He',
          exp: '"He" replaces the singular male noun "Ravi".',
          topic: req.topic || 'Pronouns',
        },
      ];

      const fallbackQuestions: Question[] = [];
      for (let i = 0; i < targetCount; i++) {
        const item = grammarPool[i % grammarPool.length];
        const numSuffix = i >= grammarPool.length ? ` (Variation ${Math.floor(i / grammarPool.length) + 1})` : '';
        const fbQuestion: Question = {
          id: `gen-q-${Date.now()}-fb${i + 1}`,
          class_id: req.class_id,
          book_id: req.book_id,
          lesson_id: req.lesson_id,
          question_type: req.question_type || 'MCQ',
          question_text: `${item.q}${numSuffix}`,
          options: [...item.opts],
          correct_answer: item.ans,
          explanation: item.exp,
          difficulty: req.difficulty || 'Easy',
          topic: item.topic,
          source_page: (i % 10) + 1,
          status: 'draft',
          created_at: new Date().toISOString(),
        };
        fallbackQuestions.push(fbQuestion);
        db.questions.push(fbQuestion);
      }

      return fallbackQuestions;
    }
  }

  private extractJsonArray(text: string): string {
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      return text.substring(firstBracket, lastBracket + 1);
    }
    return text;
  }
}

export const questionGeneratorService = new QuestionGeneratorService();
