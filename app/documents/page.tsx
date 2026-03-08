"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";

type UploadStatus = "ready" | "processing" | "failed";

interface UploadedFileItem {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  status: UploadStatus;
  uploadedAt: string;
  folderId: string | null;
}

interface FolderItem {
  id: string;
  name: string;
  createdAt: string;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : "";
}

function getBaseName(name: string): string {
  const extension = getFileExtension(name);
  if (!extension) return name;
  return name.slice(0, -extension.length);
}

function isAcceptedFile(file: File): boolean {
  const extension = getFileExtension(file.name);
  return ACCEPTED_EXTENSIONS.includes(extension) || ACCEPTED_MIME_TYPES.includes(file.type);
}

function getStatusClasses(status: UploadStatus): string {
  if (status === "ready") return "bg-[#edf5ee] text-[#2f7a47]";
  if (status === "processing") return "bg-[#f8f1e8] text-[#9b5e1a]";
  return "bg-[#fff2ef] text-[#b14634]";
}

function getFileBadgeLabel(name: string): string {
  const ext = getFileExtension(name);
  if (ext === ".pdf") return "PDF";
  if (ext === ".docx") return "DOCX";
  if (ext === ".txt") return "TXT";
  return "FILE";
}

function getFileEmoji(name: string): string {
  const ext = getFileExtension(name);
  if (ext === ".pdf") return "📕";
  if (ext === ".docx") return "📘";
  if (ext === ".txt") return "📄";
  return "📄";
}

function FileTypePill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#e4ddd5] bg-[#faf7f3] px-3 py-1 text-xs font-medium uppercase tracking-[0.08em] text-[#5e5852]">
      {label}
    </span>
  );
}

export default function DocumentsPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { userId } = usePrivateRoute();

  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("none");

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingNames, setPendingNames] = useState<Record<string, string>>({});
  const [showPendingReview, setShowPendingReview] = useState(false);

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const loadDocuments = async () => {
    if (!userId) return;

    try {
      setIsRefreshing(true);

      const response = await fetch(`/api/documents?user_id=${encodeURIComponent(userId)}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data || !Array.isArray(data.documents)) {
        throw new Error(
          data && typeof data.error === "string" ? data.error : "Could not load documents."
        );
      }

      const loadedFiles: UploadedFileItem[] = data.documents.map((doc: any) => ({
        id: String(doc.id),
        name: String(doc.file_name ?? doc.original_name ?? "Untitled"),
        originalName: String(doc.original_name ?? doc.file_name ?? "Untitled"),
        size: Number(doc.file_size ?? 0),
        type: String(doc.file_type ?? ""),
        status:
          doc.status === "ready" || doc.status === "processing" || doc.status === "failed"
            ? doc.status
            : "failed",
        uploadedAt: String(doc.created_at ?? new Date().toISOString()),
        folderId: doc.folder_name ? String(doc.folder_name) : null,
      }));

      const folderNames = Array.from(
        new Set(
          data.documents
            .map((doc: any) => (doc.folder_name ? String(doc.folder_name) : null))
            .filter(Boolean)
        )
      ) as string[];

      const loadedFolders: FolderItem[] = folderNames.map((name) => ({
        id: name,
        name,
        createdAt: new Date().toISOString(),
      }));

      setFiles(loadedFiles);
      setFolders(loadedFolders);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load documents.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, [userId]);

  useEffect(() => {
    const handleFocus = () => {
      void loadDocuments();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [userId]);

  const hasFiles = files.length > 0;
  const hasFolders = folders.length > 0;

  const visibleFiles = useMemo(() => {
    return [...files]
      .filter((file) => {
        if (activeFolderId === null) return true;
        return file.folderId === activeFolderId;
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }, [files, activeFolderId]);

  const visibleFolders = useMemo(() => {
    if (activeFolderId !== null) return [];
    return [...folders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [folders, activeFolderId]);

  const folderMap = useMemo(() => {
    return new Map(folders.map((folder) => [folder.id, folder.name]));
  }, [folders]);

  const activeFolder = useMemo(() => {
    return folders.find((folder) => folder.id === activeFolderId) ?? null;
  }, [folders, activeFolderId]);

  const startPendingUpload = (incomingFiles: FileList | File[]) => {
    const nextFiles = Array.from(incomingFiles);
    if (nextFiles.length === 0) return;

    const invalidFiles = nextFiles.filter((file) => !isAcceptedFile(file));
    if (invalidFiles.length > 0) {
      setError("Only PDF, DOCX, and TXT files are supported right now.");
    } else {
      setError(null);
    }

    const validFiles = nextFiles.filter((file) => isAcceptedFile(file));
    if (validFiles.length === 0) return;

    const defaultNames: Record<string, string> = {};
    for (const file of validFiles) {
      defaultNames[file.name] = getBaseName(file.name);
    }

    setPendingFiles(validFiles);
    setPendingNames(defaultNames);
    setSelectedFolderId(activeFolderId ?? "none");
    setShowPendingReview(true);
  };

  const confirmPendingUpload = async () => {
    if (pendingFiles.length === 0 || !userId) return;

    const filesToUpload = [...pendingFiles];
    const renamedNames = { ...pendingNames };
    const folderIdForUpload = selectedFolderId === "none" ? null : selectedFolderId;
    const folderNameForUpload = folderIdForUpload ? folderMap.get(folderIdForUpload) ?? null : null;

    setPendingFiles([]);
    setPendingNames({});
    setShowPendingReview(false);
    setError(null);

    for (const file of filesToUpload) {
      try {
        const typedName = (renamedNames[file.name] ?? "").trim();

        const formData = new FormData();
        formData.append("user_id", userId);

        if (folderNameForUpload) {
          formData.append("folder_name", folderNameForUpload);
        }

        if (typedName) {
          formData.append("display_name", typedName);
        }

        formData.append("file", file);

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data || typeof data !== "object") {
          throw new Error(
            data && "error" in data && typeof data.error === "string"
              ? data.error
              : "Upload failed."
          );
        }

        if ("error" in data && typeof data.error === "string") {
          throw new Error(data.error);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Upload failed.");
      }
    }

    await loadDocuments();
  };

  const cancelPendingUpload = () => {
    setPendingFiles([]);
    setPendingNames({});
    setShowPendingReview(false);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      startPendingUpload(event.target.files);
      event.target.value = "";
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    startPendingUpload(event.dataTransfer.files);
  };

  const handleRemoveFile = async (id: string) => {
    if (!userId) return;

    const confirmed = window.confirm("Delete this file?");
    if (!confirmed) return;

    try {
      const response = await fetch("/api/documents/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          documentId: id,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || (data && typeof data.error === "string")) {
        throw new Error(data?.error ?? "Could not delete file.");
      }

      await loadDocuments();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not delete file.");
    }
  };

  const handlePreviewFile = (id: string) => {
    if (!userId) return;
    window.open(
      `/api/documents/file?user_id=${encodeURIComponent(userId)}&document_id=${encodeURIComponent(id)}`,
      "_blank"
    );
  };

  const handleRenameFile = async (id: string) => {
    const targetFile = files.find((file) => file.id === id);
    if (!targetFile || !userId) return;

    const currentBaseName = getBaseName(targetFile.name);
    const extension = getFileExtension(targetFile.name);

    const nextName = window.prompt("Rename file", currentBaseName);
    if (nextName === null) return;

    const trimmed = nextName.trim();
    if (!trimmed) return;

    const renamedFile = `${trimmed}${extension}`;

    setFiles((current) =>
      current.map((file) =>
        file.id === id
          ? {
              ...file,
              name: renamedFile,
            }
          : file
      )
    );
  };

  const handleMoveFile = async (id: string, nextFolderId: string) => {
    const folderId = nextFolderId === "none" ? null : nextFolderId;

    setFiles((current) =>
      current.map((file) =>
        file.id === id
          ? {
              ...file,
              folderId,
            }
          : file
      )
    );
  };

  const handleCreateFolder = () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) return;

    const alreadyExists = folders.some(
      (folder) => folder.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (alreadyExists) {
      setNewFolderName("");
      return;
    }

    const folder: FolderItem = {
      id: trimmedName,
      name: trimmedName,
      createdAt: new Date().toISOString(),
    };

    setFolders((current) => [folder, ...current]);
    setNewFolderName("");
  };

  const handleRenameFolder = (id: string) => {
    const targetFolder = folders.find((folder) => folder.id === id);
    if (!targetFolder) return;

    const nextName = window.prompt("Rename folder", targetFolder.name);
    if (nextName === null) return;

    const trimmed = nextName.trim();
    if (!trimmed) return;

    setFolders((current) =>
      current.map((folder) => (folder.id === id ? { ...folder, name: trimmed } : folder))
    );
  };

  const handleDeleteFolder = (id: string) => {
    const folderName = folderMap.get(id) ?? "this folder";
    const confirmed = window.confirm(
      `Delete "${folderName}"? Files inside it will be moved out of the folder.`
    );
    if (!confirmed) return;

    setFolders((current) => current.filter((folder) => folder.id !== id));
    setFiles((current) =>
      current.map((file) => (file.folderId === id ? { ...file, folderId: null } : file))
    );

    if (activeFolderId === id) {
      setActiveFolderId(null);
    }
  };

  return (
    <AppShell activePath="/documents" maxWidthClassName="max-w-7xl">
      <section className="rounded-3xl border border-[#e9e2da] bg-white p-5 shadow-[0_12px_30px_rgba(35,31,26,0.06)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">Documents</p>
            <h1 className="mt-1 text-2xl font-bold">Upload files for personalized document Q&amp;A</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#6f6a64]">
              Add tax documents, benefit letters, forms, notes, or financial files so Yuth can
              answer questions using your own materials.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void loadDocuments()}
              className="rounded-2xl border border-[#d9d1c8] bg-white px-4 py-3 text-sm font-medium text-[#1c1b19] transition hover:border-[#cfc5ba]"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            {hasFiles || hasFolders ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-2xl bg-[#f04d2d] px-5 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Add files
              </button>
            ) : null}
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-[#ebe4dc] bg-[#fcfaf7] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Folders</h2>
              <p className="mt-1 text-sm text-[#6f6a64]">
                Create folders and open them to organize your documents like a simple file manager.
              </p>
            </div>

            {activeFolder ? (
              <button
                type="button"
                onClick={() => setActiveFolderId(null)}
                className="rounded-xl border border-[#d9d1c8] bg-white px-3 py-2 text-sm font-medium text-[#1c1b19] transition hover:border-[#cfc5ba]"
              >
                ← Back to all documents
              </button>
            ) : null}
          </div>

          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              className="flex-1 rounded-2xl border border-[#ddd6cf] bg-white px-4 py-3 outline-none transition focus:border-[#f04d2d]"
              placeholder="Name a folder like Taxes, School, Benefits, or Housing"
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="rounded-2xl bg-[#163320] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Create folder
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFolderId(null)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                activeFolderId === null
                  ? "bg-[#163320] text-white"
                  : "border border-[#e4ddd5] bg-white text-[#4d473f]"
              }`}
            >
              All files
            </button>

            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setActiveFolderId(folder.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  activeFolderId === folder.id
                    ? "bg-[#f4e7e2] text-[#b14634]"
                    : "border border-[#e4ddd5] bg-white text-[#4d473f]"
                }`}
              >
                📁 {folder.name}
              </button>
            ))}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={handleInputChange}
          className="hidden"
        />

        {!hasFiles && !showPendingReview && !hasFolders ? (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex min-h-[54vh] flex-col items-center justify-center rounded-2xl border-2 p-8 text-center transition ${
              isDragging
                ? "border-[#f04d2d] bg-[#fff4f1]"
                : "border-dashed border-[#e6dfd8] bg-[#f9f6f1]"
            }`}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-[#f4e7e2] shadow-[0_10px_24px_rgba(240,77,45,0.10)]">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 16V8M12 8L9 11M12 8L15 11"
                  stroke="#b14634"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 20H17"
                  stroke="#b14634"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h2 className="mt-6 text-3xl font-bold text-[#1c1b19]">Upload your first file</h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-[#6f6a64]">
              Drag and drop knowledge documents here, or click below to add files Yuth can later
              use to answer questions about your own content.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <FileTypePill label="PDF" />
              <FileTypePill label="DOCX" />
              <FileTypePill label="TXT" />
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-6 rounded-2xl bg-[#f04d2d] px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Add file
            </button>
          </div>
        ) : null}

        {showPendingReview ? (
          <section className="mt-5 rounded-2xl border border-[#ebe4dc] bg-[#fcfaf7] p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Review files before adding</h2>
              <p className="mt-1 text-sm text-[#6f6a64]">
                You can optionally rename files before upload. If the original name is already clear,
                you can leave it as is.
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-[#4d473f]">Choose a folder</label>
              <select
                value={selectedFolderId}
                onChange={(event) => setSelectedFolderId(event.target.value)}
                className="w-full rounded-2xl border border-[#ddd6cf] bg-white px-4 py-3 outline-none transition focus:border-[#f04d2d]"
              >
                <option value="none">No folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {pendingFiles.map((file) => {
                const extension = getFileExtension(file.name);

                return (
                  <article
                    key={file.name}
                    className="rounded-2xl border border-[#ebe4dc] bg-white p-4 shadow-[0_8px_20px_rgba(35,31,26,0.04)]"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#f8f1e8] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b5e1a]">
                        {getFileBadgeLabel(file.name)}
                      </span>
                      <span className="text-sm text-[#6f6a64]">Original: {file.name}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#4d473f]">
                        File name <span className="font-normal text-[#8a8580]">(optional)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          value={pendingNames[file.name] ?? ""}
                          onChange={(event) =>
                            setPendingNames((current) => ({
                              ...current,
                              [file.name]: event.target.value,
                            }))
                          }
                          className="flex-1 rounded-2xl border border-[#ddd6cf] bg-[#faf7f3] px-4 py-3 outline-none transition focus:border-[#f04d2d]"
                          placeholder="Type a clearer name like T4A 2025 or Tuition Receipt Winter 2026"
                        />
                        <span className="rounded-xl border border-[#e4ddd5] bg-[#faf7f3] px-3 py-3 text-sm font-medium text-[#5e5852]">
                          {extension}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={confirmPendingUpload}
                className="rounded-2xl bg-[#f04d2d] px-5 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Add selected files
              </button>
              <button
                type="button"
                onClick={cancelPendingUpload}
                className="rounded-2xl border border-[#d9d1c8] bg-white px-5 py-3 font-medium text-[#1c1b19] transition hover:border-[#cfc5ba]"
              >
                Cancel
              </button>
            </div>
          </section>
        ) : null}

        {hasFiles || hasFolders ? (
          <div className="mt-5 space-y-5">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-5 transition ${
                isDragging
                  ? "border-[#f04d2d] bg-[#fff4f1]"
                  : "border-[#e6dfd8] bg-[#f9f6f1]"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1c1b19]">
                    {activeFolder ? `Drop more files into ${activeFolder.name}` : "Drop more files here"}
                  </p>
                  <p className="mt-1 text-sm text-[#6f6a64]">Supported: PDF, DOCX, and TXT</p>
                </div>

                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-2xl border border-[#d9d1c8] bg-white px-4 py-2.5 text-sm font-medium text-[#1c1b19] transition hover:border-[#cfc5ba]"
                >
                  Browse files
                </button>
              </div>
            </div>

            {activeFolderId === null && visibleFolders.length > 0 ? (
              <section className="rounded-2xl border border-[#ebe4dc] bg-[#fcfaf7] p-4">
                <div className="mb-3">
                  <h2 className="text-lg font-semibold">Folders</h2>
                  <p className="mt-1 text-sm text-[#6f6a64]">Open a folder to focus on its documents.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {visibleFolders.map((folder) => (
                    <article
                      key={folder.id}
                      className="rounded-2xl border border-[#ebe4dc] bg-white p-4 shadow-[0_8px_20px_rgba(35,31,26,0.04)]"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFolderId(folder.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">📁</div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-[#1c1b19]">{folder.name}</p>
                            <p className="mt-1 text-sm text-[#6f6a64]">Open folder</p>
                          </div>
                        </div>
                      </button>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleRenameFolder(folder.id)}
                          className="rounded-xl border border-[#d9d1c8] bg-[#fbf8f4] px-3 py-1.5 text-sm font-medium text-[#1c1b19] transition hover:border-[#cfc5ba]"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="rounded-xl border border-[#f2d4cd] bg-[#fff2ef] px-3 py-1.5 text-sm font-medium text-[#b14634] transition hover:opacity-90"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-[#ebe4dc] bg-[#fcfaf7] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {activeFolder ? `Files in ${activeFolder.name}` : "Your files"}
                  </h2>
                  <p className="mt-1 text-sm text-[#6f6a64]">
                    These files will later be processed for question answering.
                  </p>
                </div>
                <span className="rounded-full bg-[#edf5ee] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#2f7a47]">
                  {visibleFiles.length} file{visibleFiles.length === 1 ? "" : "s"}
                </span>
              </div>

              {visibleFiles.length === 0 ? (
                <div className="rounded-2xl border border-[#ebe4dc] bg-white p-8 text-center">
                  <div className="text-3xl">📂</div>
                  <p className="mt-3 text-base font-semibold text-[#1c1b19]">No files here yet</p>
                  <p className="mt-2 text-sm text-[#6f6a64]">
                    {activeFolder
                      ? "Upload files into this folder to start organizing your documents."
                      : "Upload documents or open a folder to view its files."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleFiles.map((file) => (
                    <article
                      key={file.id}
                      className="flex flex-col gap-3 rounded-2xl border border-[#ebe4dc] bg-white p-4 shadow-[0_8px_20px_rgba(35,31,26,0.04)]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#f8f1e8] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b5e1a]">
                              {getFileBadgeLabel(file.name)}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getStatusClasses(file.status)}`}
                            >
                              {file.status}
                            </span>
                            {file.folderId ? (
                              <span className="rounded-full border border-[#e4ddd5] bg-[#faf7f3] px-2.5 py-1 text-[11px] font-medium text-[#5e5852]">
                                {folderMap.get(file.folderId)}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            <span className="text-2xl">{getFileEmoji(file.name)}</span>
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-[#1c1b19]">{file.name}</p>
                              {file.name !== file.originalName ? (
                                <p className="mt-1 text-sm text-[#8a8580]">
                                  Original file: {file.originalName}
                                </p>
                              ) : null}
                              <p className="mt-1 text-sm text-[#6f6a64]">
                                {formatFileSize(file.size)} • Added{" "}
                                {new Date(file.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePreviewFile(file.id)}
                            className="rounded-xl border border-[#d9d1c8] bg-[#fbf8f4] px-3 py-1.5 text-sm font-medium text-[#1c1b19] transition hover:border-[#cfc5ba]"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRenameFile(file.id)}
                            className="rounded-xl border border-[#d9d1c8] bg-[#fbf8f4] px-3 py-1.5 text-sm font-medium text-[#1c1b19] transition hover:border-[#cfc5ba]"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            className="rounded-xl border border-[#f2d4cd] bg-[#fff2ef] px-3 py-1.5 text-sm font-medium text-[#b14634] transition hover:opacity-90"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:max-w-xs">
                        <label className="text-sm font-medium text-[#4d473f]">Move to folder</label>
                        <select
                          value={file.folderId ?? "none"}
                          onChange={(event) => handleMoveFile(file.id, event.target.value)}
                          className="rounded-2xl border border-[#ddd6cf] bg-[#faf7f3] px-4 py-3 outline-none transition focus:border-[#f04d2d]"
                        >
                          <option value="none">No folder</option>
                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-[#f2d4cd] bg-[#fff2ef] px-3 py-2 text-sm text-[#b14634]">
            {error}
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}