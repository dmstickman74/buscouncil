import { useEffect, useState, useRef, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fmtRelative, fmtFileSize } from "@/lib/format";
import { Button, Card, Spinner, Badge } from "@/components/ui";
import type { Document } from "@/lib/types";

const CATEGORIES = ["all", "agenda", "minutes", "presentation", "general"] as const;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  agenda: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  minutes: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  presentation: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" /></svg>,
  general: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
};

export function DocumentsPage() {
  const { identity } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const councilId = identity?.council_id;

  useEffect(() => {
    if (!councilId) return;
    setLoading(true);
    const params = category !== "all" ? `?category=${category}` : "";
    api<Document[]>(`/councils/${councilId}/documents${params}`)
      .then(setDocs)
      .finally(() => setLoading(false));
  }, [councilId, category]);

  async function uploadFile(file: File) {
    if (!councilId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const doc = await api<Document>(`/councils/${councilId}/documents`, {
        method: "POST",
        body: form,
        headers: {},
      });
      setDocs((prev) => [doc, ...prev]);
    } finally {
      setUploading(false);
    }
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!fileRef.current?.files?.[0]) return;
    await uploadFile(fileRef.current.files[0]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function downloadUrl(docId: number) {
    return `/api/councils/${councilId}/documents/${docId}/download`;
  }

  const categoryCounts = docs.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* Hero header */}
      <div className="rounded-2xl bg-gradient-to-br from-navy via-navy-light to-navy-dark px-8 py-6 pb-7 text-white mb-6 -mt-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
            <p className="text-white/60 text-sm mt-1">Meeting materials, presentations, and shared files</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold">{docs.length}</div>
              <div className="text-xs text-white/50">files</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all mb-6 ${
          dragOver
            ? "border-navy bg-navy-50 scale-[1.01]"
            : "border-border-light bg-surface hover:border-navy/30 hover:bg-surface-alt"
        }`}
      >
        <form onSubmit={handleUpload} className="flex flex-col items-center justify-center py-8 px-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
            dragOver ? "bg-navy text-white" : "bg-navy-50 text-navy"
          }`}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          </div>
          <p className="text-sm font-medium text-txt mb-1">
            {dragOver ? "Drop to upload" : "Drag a file here or click to browse"}
          </p>
          <p className="text-xs text-txt3 mb-3">PDF, Word, PowerPoint, or any document</p>
          <div className="flex items-center gap-3">
            <input type="file" ref={fileRef} className="hidden" onChange={(e) => {
              if (e.target.files?.[0]) uploadFile(e.target.files[0]);
              e.target.value = "";
            }} />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Choose File"}
            </Button>
          </div>
        </form>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              category === cat
                ? "bg-navy text-white shadow-sm"
                : "bg-surface border border-border-light text-txt2 hover:border-navy/20 hover:text-navy"
            }`}
          >
            {cat !== "all" && <span className="opacity-70">{CATEGORY_ICONS[cat]}</span>}
            {cat}
            {cat === "all" && docs.length > 0 && (
              <span className={`ml-0.5 text-xs ${category === cat ? "text-white/70" : "text-txt3"}`}>{docs.length}</span>
            )}
            {cat !== "all" && categoryCounts[cat] && (
              <span className={`ml-0.5 text-xs ${category === cat ? "text-white/70" : "text-txt3"}`}>{categoryCounts[cat]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : docs.length === 0 ? (
        <div className="rounded-2xl bg-surface-alt border border-border-light py-16 px-6 text-center">
          <div className="flex justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-navy-50 text-navy flex items-center justify-center -rotate-6">{CATEGORY_ICONS.agenda}</div>
            <div className="w-12 h-12 rounded-2xl bg-green/10 text-green-dark flex items-center justify-center rotate-3 -mt-2">{CATEGORY_ICONS.presentation}</div>
            <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center -rotate-3">{CATEGORY_ICONS.minutes}</div>
          </div>
          <p className="text-lg font-semibold text-txt mb-1">No documents yet</p>
          <p className="text-sm text-txt3 max-w-xs mx-auto">
            Upload meeting materials, agendas, and presentations to share with your council.
          </p>
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-border-light">
            {docs.map((doc) => (
              <div key={doc.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-surface-alt transition-colors">
                <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy flex items-center justify-center shrink-0 group-hover:bg-navy group-hover:text-white transition-colors">
                  {CATEGORY_ICONS[doc.category] || CATEGORY_ICONS.general}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-txt group-hover:text-navy transition-colors truncate">{doc.display_name}</span>
                    <Badge color="sage">{doc.category}</Badge>
                  </div>
                  <div className="text-xs text-txt3 mt-0.5">
                    {doc.uploader_name} &middot; {fmtFileSize(doc.file_size)} &middot; {fmtRelative(doc.created_at)}
                  </div>
                </div>
                <a href={downloadUrl(doc.id)} className="shrink-0">
                  <Button variant="secondary" size="sm">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    Download
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
