import { useLocation, useNavigate } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";

interface RemediationStep {
	description: string;
	context: string;
	problemCodeSnippet: string;
	remediationCodeSnippet: string;
}
const ViewIssuesDetails: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const issue = location.state?.issue;
	const { issueId } = useParams<{ issueId: string }>();

	const issuesDetailsArray = useQuery(api.sastScans.fetchIssueInfoByIssueId, {
		issueId,
	});

	const issuesDetails = issuesDetailsArray?.[0];

	if (!issuesDetails) {
		return (
			<div className="p-6">
				<div className="w-36 h-8 bg-secondary rounded animate-pulse mb-4" />
				<div className="bg-sidebar shadow-md p-6 rounded-md mb-6 animate-pulse">
					<div className="w-1/4 h-6 bg-secondary rounded animate-pulse mb-4" />
					<div className="space-y-2">
						<div className="w-3/4 h-4 bg-secondary rounded animate-pulse" />
						<div className="w-1/2 h-4 bg-secondary rounded animate-pulse" />
						<div className="w-1/3 h-4 bg-secondary rounded animate-pulse" />
						<div className="w-full h-4 bg-secondary rounded animate-pulse" />
					</div>
				</div>

				<div className="bg-sidebar shadow-md mt-6 p-6 rounded-md animate-pulse">
					<div className="w-1/4 h-6 bg-secondary rounded animate-pulse mb-4" />
					<div className="w-3/4 h-4 bg-secondary rounded animate-pulse mb-2" />
					<div className="w-2/4 h-4 bg-secondary rounded animate-pulse" />
				</div>

				<Button
					onClick={() => navigate(-1)}
					className="mt-4 bg-secondary text-white p-2 rounded"
				>
					Back
				</Button>
			</div>
		);
	}

	const paragraphDescription =
		issue?.rule.remediationSteps
			?.map((step: RemediationStep) => {
				const match = step.description.match(/<p>(.*?)<\/p>/);
				return match?.[1];
			})
			.filter((desc: string | undefined) => desc)
			.join(" ") || "No additional information available.";

	const getSeverityBadgeColor = (severity: string | undefined) => {
		const normalizedSeverity = severity?.toUpperCase() || "UNKNOWN";
		switch (normalizedSeverity) {
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

	return (
		<div className="p-6">
			<h1 className="text-xl font-bold mb-4">{issuesDetails.message}</h1>

			<div className="bg-sidebar shadow-md p-6 rounded-md">
				<h2 className="text-lg font-semibold mb-2">Information</h2>

				<div className="flex items-center space-x-4 mb-4">
					<Badge
						className={`${getSeverityBadgeColor(issuesDetails.severity)} font-semibold`}
					>
						{issuesDetails.severity}
					</Badge>
				</div>

				<div className="text-sm space-y-2">
					<p>
						<span className="font-bold">Key:</span>{" "}
						{issuesDetails.rule?.key || "N/A"}
					</p>
					<p>
						<span className="font-bold">Component:</span>{" "}
						{issuesDetails.component}
					</p>
					<p>
						<span className="font-bold">Line:</span>{" "}
						{issuesDetails.line}
					</p>
					<p>
						<span className="font-bold">Description:</span>{" "}
						{paragraphDescription}
					</p>
				</div>
			</div>

			<div className="bg-sidebar shadow-md mt-6 p-6 rounded-md">
				<h2 className="text-lg font-semibold mb-4">
					Remediation Steps
				</h2>
				{issuesDetails.rule?.remediationSteps?.map(
					(step: RemediationStep) =>
						step.problemCodeSnippet ? (
							<div
								key={step.context}
								className="mt-4 max-w-screen-lg w-full overflow-x-auto"
							>
								<h3 className="text-md font-semibold mb-2">
									{step.context}
								</h3>
								<div className="bg-sidebar rounded-lg shadow-lg p-4 mb-4">
									<h4 className="text-sm font-semibold mb-2">
										Problem Code Snippet
									</h4>
									<div className="overflow-x-auto max-w-full">
										<SyntaxHighlighter
											language="python"
											style={atomDark}
											wrapLongLines={false}
											showLineNumbers
										>
											{step.problemCodeSnippet}
										</SyntaxHighlighter>
									</div>
								</div>
								{step.remediationCodeSnippet && (
									<div className="bg-sidebar rounded-lg shadow-lg p-4">
										<h4 className="text-sm font-semibold mb-2">
											Remediation Code Snippet
										</h4>
										<div className="overflow-x-auto max-w-full">
											<SyntaxHighlighter
												language="python"
												style={atomDark}
												wrapLongLines={false}
												showLineNumbers
											>
												{step.remediationCodeSnippet}
											</SyntaxHighlighter>
										</div>
									</div>
								)}
							</div>
						) : null,
				)}
			</div>
		</div>
	);
};

export default ViewIssuesDetails;
