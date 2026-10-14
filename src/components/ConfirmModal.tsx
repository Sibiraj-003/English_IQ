import React from 'react';
import { BrutalButton } from './BrutalButton';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'YES, DELETE BOOK',
  cancelText = 'CANCEL',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-mono animate-in fade-in duration-150">
      <div className="bg-white border-4 border-[#0F172A] shadow-[8px_8px_0px_#0F172A] max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-1 border-2 border-[#0F172A] bg-slate-100 hover:bg-rose-100 transition-colors shadow-[2px_2px_0px_#0F172A]"
          title="Close dialog"
        >
          <X className="w-4 h-4 text-[#0F172A]" />
        </button>

        {/* Top Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-extrabold px-2 py-0.5 bg-rose-500 text-white border border-[#0F172A] uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            IRREVERSIBLE_ACTION // DELETION
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-extrabold text-[#0F172A] font-sans">
          {title}
        </h3>

        {/* Message */}
        <p className="text-xs text-slate-700 font-sans mt-2 leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t-2 border-[#0F172A]">
          <BrutalButton
            variant="white"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </BrutalButton>
          <BrutalButton
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            {loading ? 'DELETING...' : confirmText}
          </BrutalButton>
        </div>
      </div>
    </div>
  );
};
