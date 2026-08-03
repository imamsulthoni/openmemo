export const API_BASE = "http://localhost:8000";

export interface SessionSummary {
	id: string;
	title: string;
	updatedAt: string;
	messageCount: number;
}

export interface Memo {
	id: string;
	sessionId: string;
	title: string;
	content: string | null;
	filename: string | null;
	filePath: string | null;
	errorMessage: string | null;
	status: "pending" | "completed" | "failed";
	createdAt: string;
	updatedAt: string;
}

export async function listSessions(): Promise<SessionSummary[]> {
	const res = await fetch(`${API_BASE}/api/sessions`);
	if (!res.ok) throw new Error(`Failed to load sessions: ${res.status}`);
	return res.json();
}

export async function sessionMessages(sessionId: string): Promise<unknown[]> {
	const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/messages`);
	if (!res.ok) throw new Error(`Failed to load messages: ${res.status}`);
	const body = (await res.json()) as { messages: unknown[] };
	return body.messages;
}

export async function listMemos(sessionId: string): Promise<Memo[]> {
	const res = await fetch(
		`${API_BASE}/api/memos?sessionId=${encodeURIComponent(sessionId)}`,
	);
	if (!res.ok) throw new Error(`Failed to load documents: ${res.status}`);
	return res.json();
}

export function memoDownloadUrl(memo: Memo, download = false): string {
	const base = `${API_BASE}/api/memos/${memo.id}/download`;
	return download ? `${base}?download=1` : base;
}
