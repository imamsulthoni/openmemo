import { initialMessagesFromMemory, useChat } from "@anvia/react";
import {
  ChatProvider,
  Composer,
  Message,
  StreamMarkdown,
  Thread,
} from "@anvia/react-ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ClockIcon,
  CloseIcon,
  DocIcon,
  DownloadIcon,
  EyeIcon,
  FileIcon,
  SendIcon,
  StopIcon,
  UserIcon,
  WrenchIcon,
} from "../../components/icons";
import {
  API_BASE,
  listMemos,
  type Memo,
  memoDownloadUrl,
  sessionMessages,
} from "../../lib/api";

export const Route = createFileRoute("/sessions/$sessionId")({
  component: SessionRoute,
});

const SUGGESTIONS = [
  {
    id: "letter",
    label: "Surat resmi (formal)",
    prompt: "Buatkan surat resmi undangan rapat koordinasi.",
  },
  {
    id: "memo",
    label: "Memo internal",
    prompt: "Buatkan memo internal untuk mengumumkan rapat tim mingguan.",
  },
  {
    id: "announcement",
    label: "Pengumuman santai",
    prompt: "Buatkan pengumuman santai untuk acara potluck makan siang tim.",
  },
];

function SessionRoute() {
  const { sessionId } = Route.useParams();
  return <Session key={sessionId} sessionId={sessionId} />;
}

function Session({ sessionId }: { sessionId: string }) {
  const [initial, setInitial] = useState<
    ReturnType<typeof initialMessagesFromMemory>
  >([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    sessionMessages(sessionId)
      .then((messages) => {
        if (!cancelled) {
          setInitial(
            initialMessagesFromMemory(
              messages as Parameters<typeof initialMessagesFromMemory>[0],
            ),
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-neutral-50 text-sm text-neutral-400">
        Memuat percakapan…
      </div>
    );
  }

  return <ChatArea sessionId={sessionId} initialMessages={initial} />;
}

function ChatArea({
  sessionId,
  initialMessages,
}: {
  sessionId: string;
  initialMessages: ReturnType<typeof initialMessagesFromMemory>;
}) {
  const chat = useChat({
    endpoint: `${API_BASE}/api/chat?sessionId=${encodeURIComponent(sessionId)}`,
    initialMessages,
    suggestions: initialMessages.length === 0 ? SUGGESTIONS : [],
  });

  const [memos, setMemos] = useState<Memo[]>([]);
  const previousStatus = useRef(chat.status);

  const hasPendingMemos = memos.some((memo) => memo.status === "pending");

  const refreshMemos = useCallback(() => {
    listMemos(sessionId)
      .then(setMemos)
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    refreshMemos();
    if (!hasPendingMemos) return;
    const interval = setInterval(refreshMemos, 2000);
    return () => clearInterval(interval);
  }, [refreshMemos, hasPendingMemos]);

  useEffect(() => {
    if (previousStatus.current === "streaming" && chat.status === "idle") {
      refreshMemos();
    }
    previousStatus.current = chat.status;
  }, [chat.status, refreshMemos]);

  const title = titleFromMessages(initialMessages);

  return (
    <ChatProvider controller={chat}>
      <div className="flex h-dvh flex-col bg-neutral-50 text-neutral-900">
        <header className="shrink-0 border-b border-neutral-200 bg-white">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
            <Link
              to="/"
              className="group inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
            >
              <ChevronLeftIcon className="size-4 transition group-hover:-translate-x-0.5" />
              Sesi
            </Link>
            <div className="mx-auto min-w-0 border-l border-neutral-200 pl-4">
              <h1 className="truncate text-sm font-semibold text-neutral-900">
                {title ?? "Percakapan baru"}
              </h1>
              <p className="truncate text-xs text-neutral-400">
                Asisten dokumen formal, semi-formal, & santai
              </p>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <section className="flex min-w-0 flex-1 flex-col">
            <Thread.Root className="grid min-h-0 flex-1">
              <Thread.Viewport
                className="min-h-0 overflow-y-auto px-4 py-6"
                autoScroll
              >
                <div className="mx-auto w-full max-w-3xl">
                  <Thread.Empty>
                    <div className="py-14 text-center">
                      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-neutral-900 text-white">
                        <DocIcon className="size-6" />
                      </div>
                      <h2 className="text-base font-semibold text-neutral-900">
                        Buat dokumen bersama OpenMemo
                      </h2>
                      <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
                        Minta memo, surat resmi, laporan, atau pengumuman.
                        Asisten meneliti format yang benar dan menyesuaikan gaya
                        — formal, semi-formal, atau santai — sesuai konteks dan
                        permintaan Anda, lalu menghasilkan PDF.
                      </p>
                    </div>
                  </Thread.Empty>

                  <Thread.Messages className="grid gap-6">
                    {(message) => {
                      const isAssistant = message.role === "assistant";
                      const isLatestAssistant =
                        isAssistant && chat.messages.at(-1)?.id === message.id;
                      const stream = {
                        isStreaming:
                          isLatestAssistant && chat.status === "streaming",
                        resetKey: message.id,
                        flushImmediately:
                          isLatestAssistant && chat.status === "error",
                      };

                      return (
                        <Message.Root className="group/message flex items-start gap-3 data-[role=user]:flex-row-reverse">
                          <Avatar role={message.role} />

                          <Message.Content
                            className="
															min-w-0 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[15px] leading-7 text-neutral-800 shadow-sm
															group-data-[role=user]/message:border-transparent
															group-data-[role=user]/message:bg-neutral-900
															group-data-[role=user]/message:px-4
															group-data-[role=user]/message:py-2.5
															group-data-[role=user]/message:text-neutral-50
															max-w-[calc(100%-44px)]
															group-data-[role=user]/message:max-w-[min(560px,calc(100%-44px))]
														"
                          >
                            <Message.Parts {...(isAssistant ? { stream } : {})}>
                              {(part) => {
                                if (part.type === "text") {
                                  return (
                                    <Message.Part>
                                      <Message.Markdown />
                                    </Message.Part>
                                  );
                                }

                                if (part.type === "tool") {
                                  return (
                                    <Message.Part>
                                      <ToolCard
                                        className="
																					w-full rounded-xl border border-neutral-200 bg-white shadow-sm
																					data-[state=error]:border-rose-300
																					data-[state=input-streaming]:border-amber-300
																					data-[state=output-available]:border-emerald-300
																				"
                                      />
                                    </Message.Part>
                                  );
                                }

                                return <Message.Part />;
                              }}
                            </Message.Parts>
                          </Message.Content>

                          {isAssistant ? (
                            <Message.Actions className="flex shrink-0 items-center gap-1 self-start pt-1 opacity-0 transition group-hover/message:opacity-100">
                              <Message.Copy asChild>
                                <button
                                  type="button"
                                  className="rounded-md px-2 py-1 text-xs text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
                                >
                                  Salin
                                </button>
                              </Message.Copy>
                              <Message.Regenerate asChild>
                                <button
                                  type="button"
                                  className="rounded-md px-2 py-1 text-xs text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
                                >
                                  Ulangi
                                </button>
                              </Message.Regenerate>
                            </Message.Actions>
                          ) : null}
                        </Message.Root>
                      );
                    }}
                  </Thread.Messages>

                  {chat.messages.length === 0 ? (
                    <Thread.Suggestions className="mx-auto mt-8 grid max-w-md gap-2">
                      {(suggestion) => (
                        <Thread.Suggestion className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900">
                          <span className="font-medium">
                            {suggestion.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-neutral-400">
                            {suggestion.prompt}
                          </span>
                        </Thread.Suggestion>
                      )}
                    </Thread.Suggestions>
                  ) : null}

                  <Thread.Loading>
                    <div className="flex items-center gap-2 py-6 text-sm text-neutral-400">
                      <span className="flex gap-1">
                        <span className="size-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-neutral-400" />
                      </span>
                      Generating…
                    </div>
                  </Thread.Loading>

                  <Thread.Error className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" />

                  <Thread.ViewportFooter>
                    <Thread.ScrollToBottom className="mx-auto mb-2 flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-500 shadow-sm transition hover:text-neutral-800 data-[state=bottom]:invisible">
                      <ChevronDownIcon className="size-3.5" />
                      Gulir ke bawah
                    </Thread.ScrollToBottom>
                  </Thread.ViewportFooter>
                </div>
              </Thread.Viewport>
            </Thread.Root>

            <footer className="shrink-0 border-t border-neutral-200 bg-white px-4 py-4">
              <Composer.Root className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-neutral-300 bg-white p-2 shadow-sm transition focus-within:border-neutral-400 focus-within:ring-4 focus-within:ring-neutral-900/5 [&[data-state=streaming]_[data-anvia-submit]]:hidden">
                <Composer.Input
                  className="min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
                  minRows={1}
                  maxRows={6}
                  placeholder="Tulis pesan atau minta dokumen…"
                />
                <Composer.Stop asChild>
                  <button
                    type="button"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
                    aria-label="Stop"
                  >
                    <StopIcon className="size-4" />
                  </button>
                </Composer.Stop>
                <Composer.Submit asChild>
                  <button
                    type="button"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white transition hover:bg-neutral-700 disabled:opacity-40"
                    aria-label="Send"
                  >
                    <SendIcon className="size-4" />
                  </button>
                </Composer.Submit>
              </Composer.Root>
            </footer>
          </section>

          <DocumentsPanel memos={memos} />
        </div>
      </div>
    </ChatProvider>
  );
}

function Avatar({ role }: { role: string }) {
  if (role === "user") {
    return (
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-600">
        <UserIcon className="size-4" />
      </div>
    );
  }
  return (
    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
      <DocIcon className="size-4" />
    </div>
  );
}

function ToolCard({ className }: { className?: string }) {
  return (
    <Message.Tool renderWhen="always" className={className}>
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
            <WrenchIcon className="size-3.5" />
          </span>
          <Message.ToolName className="truncate text-sm font-medium text-neutral-800" />
        </div>
        <Message.ToolStatus className="shrink-0 text-xs text-neutral-400" />
      </div>
      <div className="grid gap-3 p-3">
        <section className="[&_pre]:max-h-60 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-neutral-50 [&_pre]:p-2 [&_pre]:text-xs [&_pre]:text-neutral-600">
          <Message.ToolInput />
        </section>
        <section className="[&_pre]:max-h-60 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-emerald-50 [&_pre]:p-2 [&_pre]:text-xs [&_pre]:text-emerald-900">
          <Message.ToolOutput />
          <Message.ToolError className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700" />
        </section>
      </div>
    </Message.Tool>
  );
}

function DocumentsPanel({ memos }: { memos: Memo[] }) {
  const [preview, setPreview] = useState<Memo | null>(null);

  return (
    <>
      <aside className="hidden w-80 shrink-0 overflow-y-auto overflow-x-hidden border-l border-neutral-200 bg-white md:block">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Dokumen</h2>
            <p className="mt-0.5 text-xs text-neutral-400">
              PDF yang dibuat di sesi ini
            </p>
          </div>
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-neutral-100 px-2 text-xs font-medium text-neutral-600">
            {memos.length}
          </span>
        </div>

        <div className="p-4">
          {memos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-10 text-center">
              <DocIcon className="mx-auto size-6 text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">
                Belum ada dokumen. Minta asisten membuat memo, surat, atau
                pengumuman — resmi atau santai.
              </p>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-3">
              {memos.map((memo) => (
                <div
                  key={memo.id}
                  className="min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/50 p-3.5 transition hover:border-neutral-300"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${statusAccent(
                        memo.status,
                      )}`}
                    >
                      <FileIcon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 break-words text-sm font-medium leading-snug text-neutral-900">
                        {memo.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-400">
                        {memo.filename ?? "document.pdf"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                    <StatusBadge status={memo.status} />
                    <span className="flex items-center gap-1 text-xs text-neutral-400">
                      <ClockIcon className="size-3 shrink-0" />
                      {formatDate(memo.createdAt)}
                    </span>
                  </div>

                  {memo.status === "completed" ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPreview(memo)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                      >
                        <EyeIcon className="size-3.5 shrink-0" />
                        Preview
                      </button>
                      <a
                        href={memoDownloadUrl(memo, true)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-neutral-700"
                      >
                        <DownloadIcon className="size-3.5 shrink-0" />
                        Unduh
                      </a>
                    </div>
                  ) : null}

                  {memo.status === "failed" && memo.errorMessage ? (
                    <p className="mt-2 break-words text-xs text-rose-600">
                      {memo.errorMessage}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {preview ? (
        <DocumentPreview memo={preview} onClose={() => setPreview(null)} />
      ) : null}
    </>
  );
}

function DocumentPreview({
  memo,
  onClose,
}: {
  memo: Memo;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"markdown" | "pdf">("markdown");
  const showPdf = memo.status === "completed";

  const tabClass = (active: boolean) =>
    `rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition ${
      active
        ? "border-neutral-900 text-neutral-900"
        : "border-transparent text-neutral-400 hover:text-neutral-700"
    }`;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-neutral-900">
              {memo.title}
            </h3>
            <p className="truncate text-xs text-neutral-400">
              {memo.filename ?? "document.pdf"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup preview"
            className="ml-3 flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-neutral-200 px-4">
          <button
            type="button"
            onClick={() => setTab("markdown")}
            className={tabClass(tab === "markdown")}
          >
            Markdown
          </button>
          <button
            type="button"
            onClick={() => setTab("pdf")}
            disabled={!showPdf}
            className={tabClass(tab === "pdf")}
          >
            PDF
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-50">
          {tab === "markdown" ? (
            <div className="px-6 py-5 text-sm leading-7 text-neutral-800 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_hr]:my-3 [&_strong]:font-semibold [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-neutral-100 [&_td]:border [&_td]:px-2 [&_td]:py-1">
              <StreamMarkdown content={memo.content ?? ""} />
            </div>
          ) : showPdf ? (
            <iframe
              src={memoDownloadUrl(memo)}
              title="Preview PDF"
              className="h-full w-full"
            />
          ) : (
            <div className="p-6 text-sm text-neutral-500">
              PDF belum tersedia.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Memo["status"] }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <span className="size-1.5 animate-pulse rounded-full bg-amber-600" />
        Memproses…
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <CheckIcon className="size-3" />
        Siap
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
      Gagal
    </span>
  );
}

function statusAccent(status: Memo["status"]): string {
  if (status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status === "failed") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function titleFromMessages(
  messages: ReturnType<typeof initialMessagesFromMemory>,
): string | null {
  for (const message of messages) {
    if (message.role !== "user") continue;
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => (part as { text: string }).text)
      .join(" ")
      .trim();
    if (text) return text.length > 42 ? `${text.slice(0, 42)}…` : text;
  }
  return null;
}
