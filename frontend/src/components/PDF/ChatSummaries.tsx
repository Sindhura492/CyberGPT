"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { FileText, Trash, TriangleAlert } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import useStore from "../../store/store";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

type Summary = {
	_id: Id<"summaries">;
	title: string;
	createdAt: string;
};

export function ChatSummaries() {
	const [summaries, setSummaries] = useState<Summary[]>([]);
	const navigate = useNavigate();

	const user = useStore((state) => state.user);

	if (!user) {
		return null;
	}

	const { id } = user;

	const fetchedSummaries = useQuery(api.summaries.getSummariesByUserId, {
		userId: String(id),
	}) as Summary[];

	useEffect(() => {
		if (fetchedSummaries && fetchedSummaries.length > 0) {
			setSummaries(fetchedSummaries);
		} else {
		}
	}, [fetchedSummaries]);

	const handleSummaryInteraction = (
		summary: Summary,
		event: React.MouseEvent | React.KeyboardEvent,
	) => {
		if (
			event.type === "click" ||
			(event.type === "keydown" &&
				(event as React.KeyboardEvent).key === "Enter")
		) {
			navigate(`/chat/${summary._id}`);
		}
	};

	if (!fetchedSummaries) {
		return (
			<Card className="w-full max-w-md mx-auto mt-8 p-8 my-auto shadow-none border-2 border-secondary">
				<Alert variant="default" className="border-none">
					<AlertTitle className="text-xl font-semibold mb-2">
						Loading Summaries
					</AlertTitle>
					<AlertDescription className="text-muted-foreground text-base">
						Please wait while we fetch your chat summaries.
					</AlertDescription>
				</Alert>
			</Card>
		);
	}

	if (summaries.length === 0) {
		return (
			<Card className="w-full max-w-md mx-auto mt-8 p-8 my-auto shadow-none border-2 border-secondary">
				<Alert variant="default" className="border-none">
					<div className="flex px-5">
						<TriangleAlert className="w-10 h-10 mr-5" />
						<AlertTitle className="text-3xl font-semibold mb-5">
							No Chat Summaries Found Yet!
						</AlertTitle>
					</div>
					<AlertDescription className="text-muted-foreground text-base">
						Start a new chat to create summaries and come back
						later. Enjoy chatting! 👋
					</AlertDescription>
				</Alert>
			</Card>
		);
	}

	return (
		<div className="p-4">
			<Button
				variant="outline"
				onClick={() => navigate("/reports")}
				className="mb-4"
			>
				Back to Folder
			</Button>

			<div className="rounded-lg">
				<div className="overflow-x-auto">
					<table className="table-auto w-full text-left">
						<thead>
							<tr className="bg-sidebar border">
								<th className="p-3">Title</th>
								<th className="p-3">Created on</th>
								<th className="p-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{summaries.map((summary) => (
								<tr
									key={summary._id}
									className="border cursor-pointer hover:bg-sidebar"
									onClick={(event) =>
										handleSummaryInteraction(summary, event)
									}
									onKeyDown={(event) =>
										handleSummaryInteraction(summary, event)
									}
									tabIndex={0}
								>
									<td className="p-3 flex items-center gap-3">
										<FileText className="h-6 w-6 font-black" />
										<span className="truncate text-gray font-semibold">
											{summary.title}
										</span>
									</td>
									<td className="p-3">
										{new Date(
											summary.createdAt,
										).toDateString()}
									</td>
									<td className="p-3 text-right">
										<Button
											size="sm"
											variant="ghost"
											onClick={(e: React.MouseEvent) => {
												e.stopPropagation();
												// Add delete functionality here
											}}
										>
											<Trash className="h-5 w-5" />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
