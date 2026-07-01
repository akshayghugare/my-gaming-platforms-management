import { useRef, useState, type FC } from 'react';
import { toast } from 'react-toastify';

interface BulkUploadModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  withDelimiter?: boolean;
  onClose: () => void;
  onUpload: (file: File, delimiter: ',' | ';') => Promise<void> | void;
}

const BulkUploadModal: FC<BulkUploadModalProps> = ({
  title,
  description,
  confirmLabel,
  withDelimiter,
  onClose,
  onUpload,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [delimiter, setDelimiter] = useState<',' | ';'>(';');
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      toast.error('Only .csv files are allowed');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('Maximum file size is 10 MB');
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!file) return;
    try {
      setBusy(true);
      await onUpload(file, delimiter);
      onClose();
    } catch {
      toast.error('Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 w-full max-w-2xl rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl leading-none"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">{description}</p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={`border-2 border-dashed rounded-lg py-12 flex flex-col items-center justify-center text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700'
          }`}
        >
          <p className="text-slate-200 font-medium mb-3">
            {file ? file.name : 'Drag and drop your file in this area or'}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded inline-flex items-center gap-2"
          >
            ☁ Browse Files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <ul className="text-[11px] text-slate-500 mt-4 space-y-1">
            <li>• Maximum File size is 10 MB</li>
            <li>• You can upload .csv file</li>
            <li>• 1 file minimum</li>
          </ul>
        </div>

        {withDelimiter && (
          <div className="mt-4">
            <p className="text-sm text-slate-200 mb-2">What is the delimiter?</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="delimiter"
                  className="accent-blue-600"
                  checked={delimiter === ','}
                  onChange={() => setDelimiter(',')}
                />
                , Coma
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="delimiter"
                  className="accent-blue-600"
                  checked={delimiter === ';'}
                  onChange={() => setDelimiter(';')}
                />
                ; Semicolon
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button
            type="button"
            disabled={!file || busy}
            onClick={submit}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded text-sm text-white disabled:opacity-40"
          >
            {busy ? 'Uploading…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
