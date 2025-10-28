import { Badge } from "../ui/badge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Info } from "lucide-react";
import { useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
interface Issue {
	_id: string;
	severity: string;
	message: string;
	tags: string[];
	component: string;
	line: number;
	staticScanId: string;
}
const ViewIssues: React.FC = () => {
	const navigate = useNavigate();
	const { staticScanId } = useParams<{ staticScanId: string }>();

	const issues = useQuery(api.sastScans.fetchIssueListByScanId, {
		staticScanId,
	});

	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 6;
	const totalPages = issues ? Math.ceil(issues.length / itemsPerPage) : 0;

	const currentData = issues
		? issues.slice(
				(currentPage - 1) * itemsPerPage,
				currentPage * itemsPerPage,
			)
		: [];

	const handlePreviousPage = () => {
		if (currentPage > 1) setCurrentPage((prev) => prev - 1);
	};

	const handleNextPage = () => {
		if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
	};

	const getSeverityBadgeColor = (severity: string) => {
		switch (severity.toUpperCase()) {
			case "CRITICAL":
				return "bg-red-100 text-red-600";
			case "MAJOR":
				return "bg-yellow-100 text-yellow-600";
			case "BLOCKER":
				return "bg-brown-100 text-brown-700";
			case "MINOR":
				return "bg-blue-100 text-blue-600";
			default:
				return "bg-gray-100 text-gray-600";
		}
	};

	if (!issues) return <div>Loading hotspots...</div>;
	if (issues.length === 0)
		return <div>No hotspots available for this scan.</div>;

	return (
		<div className="p-6">
			<div className="flex items-center mb-12 space-x-2">
				<h1 className="text-2xl font-bold">Issues</h1>
				<Tooltip>
					<TooltipTrigger>
						<Info className="w-5 h-5 text-gray-500 cursor-pointer" />
					</TooltipTrigger>
					<TooltipContent>
						Issues are potential code quality or security concerns
						identified by SonarQube during static code analysis
					</TooltipContent>
				</Tooltip>
			</div>
			<div className="grid gap-4">
				{currentData.map((issues: Issue) => (
					// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
					<div
						key={issues._id}
						className="relative border rounded-md p-4 bg-sidebar cursor-pointer"
						onClick={() => {
							navigate(
								`/recent-static-scans/issues/${staticScanId}/details/${issues._id}`,
							);
						}}
					>
						<Badge
							className={`absolute top-2 right-2 ${getSeverityBadgeColor(
								issues.severity,
							)}`}
						>
							{issues.severity}
						</Badge>

						<p className="text-lg font-semibold mb-2">
							{issues.message}
						</p>

						<div className="flex items-center space-x-4 mt-2">
							<div className="flex flex-wrap gap-2">
								{issues.tags.map((tag) => (
									<Badge
										key={`tag-${issues._id}-${tag}`}
										className="bg-purple-100 text-purple-600"
									>
										{tag}
									</Badge>
								))}
							</div>

							<p className="text-sm font-medium text-gray-500">
								<span className="font-bold">Component:</span>{" "}
								{issues.component}
							</p>
						</div>

						<p className="absolute bottom-2 right-2 text-sm text-gray-500">
							<span className="font-bold">Line:</span>{" "}
							{issues.line}
						</p>
					</div>
				))}
			</div>

			<div className="flex justify-center space-x-4 mt-6">
				<Button
					className="bg-secondary border border-secondary text-[#7156DB] hover:bg-sidebar w-1/6 shadow-none"
					onClick={handlePreviousPage}
					disabled={currentPage === 1}
				>
					Previous
				</Button>
				<Button
					className="bg-secondary border border-secondary text-[#7156DB] hover:bg-sidebar shadow-none w-1/6"
					onClick={handleNextPage}
					disabled={currentPage === totalPages}
				>
					Next
				</Button>
			</div>
		</div>
	);
};

export default ViewIssues;
