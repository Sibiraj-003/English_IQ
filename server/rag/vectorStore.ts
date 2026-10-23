import { EmbeddingGenerator } from './embeddings.js';

export interface TextChunk {
  id: string;
  book_id: string;
  class_id: string;
  chapter_id?: string;
  lesson_id?: string;
  content: string;
  page_number: number;
  embedding: number[];
  metadata: {
    unitTitle?: string;
    lessonTitle?: string;
    grammarTopics?: string[];
    vocabulary?: string[];
    source?: string;
  };
  created_at: string;
}

export interface RetrievalResult {
  chunk: TextChunk;
  similarity: number;
}

export class VectorStore {
  private chunks: TextChunk[] = [];

  constructor() {
    this.chunks = [];
  }

  addChunk(chunk: Omit<TextChunk, 'embedding' | 'created_at'>): TextChunk {
    const embedding = EmbeddingGenerator.generateEmbedding(chunk.content);
    const newChunk: TextChunk = {
      ...chunk,
      embedding,
      created_at: new Date().toISOString(),
    };
    this.chunks.push(newChunk);
    return newChunk;
  }

  addChunks(chunks: Array<Omit<TextChunk, 'embedding' | 'created_at'>>): TextChunk[] {
    return chunks.map((c) => this.addChunk(c));
  }

  getChunksForBook(book_id: string): TextChunk[] {
    return this.chunks.filter((c) => c.book_id === book_id);
  }

  deleteChunksForBook(book_id: string): void {
    this.chunks = this.chunks.filter((c) => c.book_id !== book_id);
  }

  /**
   * Search textbook chunks with class and optional book filtering.
   * When book_id is omitted, searches across all books belonging to the student's class.
   */
  search(params: {
    query: string;
    class_id: string;
    book_id?: string;
    limit?: number;
    threshold?: number;
  }): RetrievalResult[] {
    const { query, class_id, book_id, limit = 4, threshold = 0.15 } = params;
    const queryEmbedding = EmbeddingGenerator.generateEmbedding(query);

    // Curriculum Isolation: evaluate chunks belonging to the class_id and optionally book_id
    const isolatedChunks = this.chunks.filter(
      (chunk) => chunk.class_id === class_id && (!book_id || chunk.book_id === book_id)
    );

    const scored = isolatedChunks.map((chunk) => {
      const similarity = EmbeddingGenerator.cosineSimilarity(queryEmbedding, chunk.embedding);
      return { chunk, similarity };
    });

    const filtered = scored.filter((res) => res.similarity >= threshold);
    filtered.sort((a, b) => b.similarity - a.similarity);

    return filtered.slice(0, limit);
  }

  getAllChunksCount(): number {
    return this.chunks.length;
  }
}

export const vectorStore = new VectorStore();
