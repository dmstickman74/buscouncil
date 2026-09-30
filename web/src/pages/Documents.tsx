import { useEffect, useState, useRef, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fmtRelative, fmtFileSize } from "@/lib/format";
import { Button, Card, CardBody, PageHeader, Spinner, Badge, Input } from "@/components/ui";
import type { Document } from "@/lib/types";

const CATEGORIES = ["all", "agenda", "minutes", "presentation", "general"] as const;

export function DocumentsPage() {
  const { identity } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!councilId || !fileRef.current?.files?.[0]) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", fileRef.current.files[0]);
      const doc = await api<Document>(`/councils/${councilId}/documents`, {
        method: "POST",
        body: form,
        headers: {},
      });
      setDocs((prev) => [doc, ...prev]);
      fileRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  function downloadUrl(docId: number) {
    return `/api/councils/${councilId}/documents/${docId}/download`;
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Meeting materials, presentations, and shared files."
      />

      <Card className="mb-6">
        <CardBody>
          <form onSubmit={handleUpload} className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-48">
              <Input label="Upload a document" type="file" ref={fileRef} required />
            </div>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <div className="flex gap-2 mb-4 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
              category === cat
                ? "bg-navy text-white"
                : "bg-surface-alt text-txt2 hover:bg-border-light"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : docs.length === 0 ? (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-txt3">No documents yet. Upload one to get started!</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border-light">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-txt truncate">{doc.display_name}</span>
                    <Badge color="gray">{doc.category}</Badge>
                  </div>
                  <div className="text-xs text-txt3 mt-1">
                    {doc.uploader_name} &middot; {fmtFileSize(doc.file_size)} &middot; {fmtRelative(doc.created_at)}
                  </div>
                </div>
                <a href={downloadUrl(doc.id)} className="shrink-0">
                  <Button variant="secondary" size="sm">Download</Button>
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
