import { useRef, useState } from "react";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { api } from "../services/api";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  accept?: string;
  label?: string;
  placeholder?: string;
}

export default function FileUpload({ value, onChange, folder, accept = "image/*", label = "Upload File", placeholder }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(response.data.url);
    } catch (err: any) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isImage = value && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-black uppercase text-muted-foreground block">{label}</label>

      {value ? (
        <div className="relative rounded-xl border border-border bg-background overflow-hidden">
          {isImage ? (
            <img src={value} alt="Preview" className="h-32 w-full object-cover" />
          ) : (
            <div className="flex items-center gap-3 p-3">
              <FileText className="h-8 w-8 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground truncate">{value}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => { onChange(""); if (inputRef.current) inputRef.current.value = ""; }}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="text-xs font-semibold text-muted-foreground">
            {uploading ? "Uploading..." : "Click or drag to upload"}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {/* Manual URL input fallback */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Or paste URL here"}
        className="w-full rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
