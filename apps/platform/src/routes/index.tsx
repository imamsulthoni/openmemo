import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listSessions, type SessionSummary } from "../lib/api";

export const Route = createFileRoute("/")({ component: Home });

function timeAgo(date: string): string {
	const seconds = Math.max(
		0,
		Math.floor((Date.now() - new Date(date).getTime()) / 1000),
	);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return new Date(date).toLocaleDateString();
}

function Home() {
	const [sessions, setSessions] = useState<SessionSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		listSessions()
			.then(setSessions)
			.catch(() => setSessions([]))
			.finally(() => setLoading(false));
	}, []);

	const newSession = () => {
		const id = crypto.randomUUID();
		navigate({ to: "/sessions/$sessionId", params: { sessionId: id } });
	};

	return (
		<div className="flex h-dvh flex-col bg-white text-neutral-900">
			<header className="shrink-0 border-b border-neutral-200 px-4 py-3">
				<div className="mx-auto flex max-w-3xl items-center justify-between">
					<h1 className="text-sm font-medium text-neutral-800">OpenMemo</h1>
					<button
						type="button"
						onClick={newSession}
						className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800"
					>
						New session
					</button>
				</div>
			</header>

			<main className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
				<div className="mx-auto grid w-full max-w-3xl gap-3">
					{loading ? (
						<p className="py-16 text-center text-sm text-neutral-400">
							Loading...
						</p>
					) : sessions.length === 0 ? (
						<div className="py-20 text-center">
							<p className="text-sm text-neutral-400">No conversations yet.</p>
							<button
								type="button"
								onClick={newSession}
								className="mt-4 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800"
							>
								Start a new session
							</button>
						</div>
					) : (
						sessions.map((session) => (
							<Link
								key={session.id}
								to="/sessions/$sessionId"
								params={{ sessionId: session.id }}
								className="block rounded-xl border border-neutral-200 px-4 py-3 transition hover:border-neutral-300 hover:bg-neutral-50"
							>
								<div className="flex items-center justify-between gap-3">
									<p className="truncate text-sm font-medium text-neutral-900">
										{session.title}
									</p>
									<span className="shrink-0 text-xs text-neutral-400">
										{timeAgo(session.updatedAt)}
									</span>
								</div>
								<p className="mt-1 text-xs text-neutral-400">
									{session.messageCount} message
									{session.messageCount === 1 ? "" : "s"}
								</p>
							</Link>
						))
					)}
				</div>
			</main>
		</div>
	);
}
