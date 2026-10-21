import { useRef, useState } from 'react';
import { Upload, File, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  label?: string;
  onChange?: (files: File[]) => void;
  value?: File[];
  className?: string;
}

export function FileUpload({
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
  multiple = false,
  maxSizeMb = 10,
  label = 'Arraste arquivos ou clique para enviar',
  onChange,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setError('');
    const arr = Array.from(list);
    const tooBig = arr.find((f) => f.size > maxSizeMb * 1024 * 1024);
    if (tooBig) {
      setError(`Arquivo acima de ${maxSizeMb}MB: ${tooBig.name}`);
      return;
    }
    const next = multiple ? [...files, ...arr] : arr.slice(0, 1);
    setFiles(next);
    onChange?.(next);
    const urls = next.filter((f) => f.type.startsWith('image/')).map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const remove = (i: number) => {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    onChange?.(next);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'border-2 border-dashed border-border-color rounded-xl p-6 text-center cursor-pointer',
          'hover:border-brand/50 hover:bg-brand/5 transition-colors'
        )}
      >
        <Upload className="w-8 h-8 mx-auto text-text-secondary mb-2" />
        <p className="text-sm text-text-primary font-medium">{label}</p>
        <p className="text-xs text-text-secondary mt-1">PDF, imagens, Word, Excel · máx. {maxSizeMb}MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="text-sm text-erro">{error}</p>}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 p-2 rounded-lg bg-bg-secondary border border-border-color">
              {f.type.startsWith('image/') && previews[i] ? (
                <img src={previews[i]} alt="" className="w-10 h-10 rounded object-cover" />
              ) : f.type.startsWith('image/') ? (
                <ImageIcon className="w-5 h-5 text-brand" />
              ) : (
                <File className="w-5 h-5 text-text-secondary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-text-secondary">{(f.size / 1024).toFixed(1)} KB</p>
              </div>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-lg hover:bg-bg-tertiary">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
