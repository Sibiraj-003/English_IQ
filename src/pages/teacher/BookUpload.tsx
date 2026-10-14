import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { LoadingState } from '../../components/LoadingState';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { SchoolClass } from '../../types';
import { UploadCloud, FileText, CheckCircle, ArrowRight, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

export const BookUpload: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [createdBookId, setCreatedBookId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Real-time processing progress states
  const [status, setStatus] = useState<string>('upload_pending');
  const [percent, setPercent] = useState<number>(0);
  const [stageMessage, setStageMessage] = useState<string>('Awaiting file upload...');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    api.getClasses().then((cls) => {
      setClasses(cls);
      if (cls.length > 0) setSelectedClass(cls[0].id);
    });
  }, []);

  // Poll progress when createdBookId exists
  useEffect(() => {
    if (!createdBookId) return;

    const interval = setInterval(async () => {
      try {
        const progress = await api.getBookStatus(createdBookId);
        if (progress) {
          const currentStatus = (progress.processing_status || progress.status || '').toLowerCase();
          setStatus(currentStatus);
          setPercent(progress.percent || 0);
          setStageMessage(progress.message || 'Processing textbook...');
          if (progress.details) setDetails(progress.details);

          if (currentStatus === 'book_ready' || progress.percent >= 100) {
            setUploading(false);
            clearInterval(interval);
          } else if (currentStatus === 'processing_failed') {
            setUploading(false);
            setUploadError(progress.message || 'Textbook extraction failed on the server.');
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Status poll error:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [createdBookId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) {
        setUploadError('Invalid file type: Only PDF documents are allowed.');
        return;
      }
      setFile(f);
      setUploadError(null);
      if (!bookTitle) {
        setBookTitle(f.name.replace('.pdf', '').replace(/_/g, ' '));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !bookTitle || !selectedClass) return;

    setUploading(true);
    setUploadError(null);
    setStatus('processing');
    setPercent(15);
    setStageMessage('Uploading textbook PDF to server storage (up to 150 MB)...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', bookTitle);
      formData.append('description', description);
      formData.append('class_id', selectedClass);
      if (user?.id) {
        formData.append('uploaded_by', user.id);
      }

      // Upload directly via binary multipart stream to Express server
      const res = await api.uploadBook(formData);
      if (res && res.book) {
        setCreatedBookId(res.book.id);
        setStatus('processing');
        setPercent(25);
        setStageMessage('PDF stored. Initializing textbook extraction pipeline...');
      } else {
        throw new Error('Upload succeeded but no book ID was returned.');
      }
    } catch (err: any) {
      console.error('Textbook upload failed:', err);
      setUploading(false);
      setStatus('processing_failed');
      setUploadError(err.message || 'Textbook upload failed. Please verify the document format.');
    }
  };

  const isBookReady = status.toLowerCase() === 'book_ready';
  const isFailed = status.toLowerCase() === 'processing_failed';

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-mono">
      {/* Header Banner */}
      <div className="flex items-center justify-between p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
        <div>
          <span className="text-xs font-extrabold px-2 py-0.5 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A]">
            BOOK_UPLOAD // READY
          </span>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans mt-1">
            Upload & Process English Textbook
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            PDF will be parsed page-by-page, OCR scanned if needed, AI structured into lessons, and vector indexed.
          </p>
        </div>

        <BrutalButton
          variant="white"
          size="sm"
          onClick={() => navigate('/teacher/books')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          VIEW BOOKS
        </BrutalButton>
      </div>

      {/* Uploading / Processing Stage Display */}
      {uploading || isBookReady ? (
        <BrutalCard size="large" accent="mint" className="p-8">
          <LoadingState
            title="TEXTBOOK_PROCESSOR"
            percent={percent}
            stageMessage={stageMessage}
            statusBadge={isBookReady ? 'BOOK_READY // ONLINE' : status.toUpperCase()}
            stagesCompleted={[
              'PDF PAGES EXTRACTED',
              'OCR SCANNED WITH GROQ VISION',
              'CHAPTERS & LESSONS IDENTIFIED',
              'GRAMMAR & VOCABULARY INDEXED',
              'VECTOR INDEX CREATED',
            ]}
          />

          {isBookReady && (
            <div className="mt-8 text-center bg-[#F0FDF4] p-6 border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A]">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-xl font-extrabold text-[#0F172A] font-sans">
                BOOK_ANALYSIS // COMPLETE
              </h3>
              <p className="text-xs text-slate-600 mb-6 font-mono">
                {bookTitle} has been completely parsed, structured, and indexed into the curriculum vector database.
              </p>

              {details && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-6 text-xs">
                  <div className="p-2.5 bg-white border border-[#0F172A]">
                    <div className="text-slate-500 font-bold">PAGES</div>
                    <div className="text-base font-extrabold text-[#0F172A]">{details.pages || 0}</div>
                  </div>
                  <div className="p-2.5 bg-white border border-[#0F172A]">
                    <div className="text-slate-500 font-bold">LESSONS</div>
                    <div className="text-base font-extrabold text-[#0F172A]">{details.lessons || 0}</div>
                  </div>
                  <div className="p-2.5 bg-white border border-[#0F172A]">
                    <div className="text-slate-500 font-bold">GRAMMAR</div>
                    <div className="text-base font-extrabold text-[#0F172A]">{details.grammar || 0}</div>
                  </div>
                  <div className="p-2.5 bg-white border border-[#0F172A]">
                    <div className="text-slate-500 font-bold">CHUNKS</div>
                    <div className="text-base font-extrabold text-emerald-700">{details.chunks || 0}</div>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3">
                <BrutalButton
                  variant="mint"
                  onClick={() => navigate(`/teacher/books/${createdBookId}`)}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  [ INSPECT EXTRACTED BOOK ]
                </BrutalButton>
                <BrutalButton
                  variant="lavender"
                  onClick={() => navigate('/teacher/questions')}
                >
                  GENERATE QUESTIONS
                </BrutalButton>
              </div>
            </div>
          )}
        </BrutalCard>
      ) : (
        /* Upload Form */
        <BrutalCard size="large" accent="lavender" className="p-6 sm:p-8">
          {/* Structured Safe Error Message Display */}
          {uploadError && (
            <div className="mb-6 p-4 bg-rose-100 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-xs text-rose-800 uppercase block">
                  [UPLOAD_ERROR]
                </span>
                <p className="text-xs font-bold text-rose-800 mt-0.5 font-sans">
                  {uploadError}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5 uppercase">
                  Target School Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#0F172A] text-sm font-bold focus:outline-none shadow-[2px_2px_0px_#0F172A]"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (Grade {cls.grade})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Enforces strict curriculum isolation for students in this class.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5 uppercase">
                  Subject
                </label>
                <input
                  type="text"
                  disabled
                  value="English"
                  className="w-full px-3.5 py-2.5 bg-slate-100 border-2 border-[#0F172A] text-sm font-bold text-slate-600 shadow-[2px_2px_0px_#0F172A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5 uppercase">
                Textbook Title
              </label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="e.g. Class 1 English Reader (Term 1)"
                required
                className="w-full px-3.5 py-2.5 bg-white border-2 border-[#0F172A] text-sm font-bold focus:outline-none shadow-[2px_2px_0px_#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5 uppercase">
                Curriculum Summary / Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief summary of lessons and grammar topics in this textbook"
                className="w-full px-3.5 py-2.5 bg-white border-2 border-[#0F172A] text-sm font-bold focus:outline-none shadow-[2px_2px_0px_#0F172A]"
              />
            </div>

            {/* Drag & Drop PDF Area (150 MB Support) */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5 uppercase">
                Select Textbook PDF Document
              </label>
              <div className="relative border-2 border-dashed border-[#0F172A] bg-[#F8FAFC] hover:bg-[#FEFCE8] p-8 text-center transition-all cursor-pointer shadow-[3px_3px_0px_#0F172A]">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-white border-2 border-[#0F172A] flex items-center justify-center mb-3 shadow-[2px_2px_0px_#0F172A]">
                    <UploadCloud className="w-6 h-6 text-[#0F172A]" />
                  </div>
                  {file ? (
                    <div>
                      <span className="font-extrabold text-sm text-[#0F172A] flex items-center gap-1.5 justify-center">
                        <FileText className="w-4 h-4 text-emerald-700" />
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-500 font-bold block mt-1">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • READY FOR EXTRACTION
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-extrabold text-sm text-[#0F172A] block">
                        CLICK TO BROWSE OR DRAG & DROP PDF
                      </span>
                      <span className="text-xs text-slate-500 font-bold block mt-1">
                        Supported: Standard & Scanned PDF Textbooks (Up to 150 MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <BrutalButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={!file || uploading}
              className="w-full"
              icon={<UploadCloud className="w-5 h-5" />}
            >
              [ START TEXTBOOK EXTRACTION & EMBEDDING ]
            </BrutalButton>
          </form>
        </BrutalCard>
      )}
    </div>
  );
};
