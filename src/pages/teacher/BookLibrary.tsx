import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmModal } from '../../components/ConfirmModal';
import { api } from '../../services/api';
import { Book, SchoolClass } from '../../types';
import { BookOpen, Upload, Eye, Trash2 } from 'lucide-react';

export const BookLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getBooks(), api.getClasses()])
      .then(([booksData, classesData]) => {
        setBooks(booksData);
        setClasses(classesData);
      })
      .catch((err) => {
        console.error('Error loading books:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteBook(bookToDelete.id);
      setBooks((prev) => prev.filter((b) => b.id !== bookToDelete.id));
      setBookToDelete(null);
    } catch (err: any) {
      console.error('Error deleting book:', err);
      setDeleteError(err.message || 'Failed to delete book');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#C4B5FD] text-[#0F172A] border border-[#0F172A]">
            TEXTBOOK_LIBRARY // ALL_BOOKS
          </span>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-1">
            Curriculum Textbooks
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Uploaded textbooks are indexed into discrete knowledge collections with class boundaries.
          </p>
        </div>

        <BrutalButton
          variant="mint"
          onClick={() => navigate('/teacher/books/upload')}
          icon={<Upload className="w-4 h-4" />}
        >
          + UPLOAD TEXTBOOK
        </BrutalButton>
      </div>

      {books.length === 0 ? (
        <EmptyState
          label="TEXTBOOK_LIBRARY // EMPTY"
          title="NO TEXTBOOKS UPLOADED"
          description="Upload your school's official English textbook PDF to enable AI learning and test generation."
          actionText="UPLOAD TEXTBOOK"
          onAction={() => navigate('/teacher/books/upload')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => {
            const assignedClass = classes.find((c) => c.id === book.class_id);
            return (
              <BrutalCard key={book.id} size="normal" accent="lavender" className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-extrabold px-2 py-0.5 bg-[#0F172A] text-white uppercase">
                      {assignedClass?.name || 'ASSIGNED CLASS'}
                    </span>
                    <Badge variant={book.processing_status === 'processed' ? 'mint' : 'amber'}>
                      {book.processing_status === 'processed' ? 'READY' : 'PROCESSING'}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-extrabold text-[#0F172A] font-sans mb-1 line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-sans mb-6 line-clamp-2">
                    {book.description || book.file_name}
                  </p>

                  <div className="p-3 bg-[#F8FAFC] border-2 border-[#0F172A] mb-6 text-xs flex justify-between font-bold">
                    <span>{book.page_count} PAGES</span>
                    <span>•</span>
                    <span className="uppercase">{book.file_name}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <BrutalButton
                    variant="primary"
                    className="flex-1"
                    onClick={() => navigate(`/teacher/books/${book.id}`)}
                    icon={<Eye className="w-4 h-4" />}
                  >
                    INSPECT
                  </BrutalButton>
                  <BrutalButton
                    variant="danger"
                    size="sm"
                    onClick={() => setBookToDelete(book)}
                    icon={<Trash2 className="w-4 h-4" />}
                    title="Delete or remove this textbook"
                  >
                    DELETE
                  </BrutalButton>
                </div>
              </BrutalCard>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!bookToDelete}
        title={`DELETE TEXTBOOK: ${bookToDelete?.title || ''}`}
        message={`Are you sure you want to delete "${bookToDelete?.title}"? If this book was uploaded for the wrong subject or grade, deleting it will permanently remove all associated chapters, lessons, questions, and AI vector embeddings.`}
        confirmText="DELETE BOOK"
        cancelText="CANCEL"
        loading={deleting}
        onConfirm={handleDeleteBook}
        onCancel={() => {
          if (!deleting) {
            setBookToDelete(null);
            setDeleteError(null);
          }
        }}
      />

      {deleteError && (
        <div className="p-4 bg-rose-100 border-2 border-[#0F172A] text-rose-700 text-xs font-mono font-bold flex justify-between items-center shadow-[2px_2px_0px_#0F172A]">
          <span>ERROR: {deleteError}</span>
          <button
            onClick={() => setDeleteError(null)}
            className="px-2 py-0.5 border border-[#0F172A] bg-white text-[#0F172A] text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}
    </div>
  );
};
