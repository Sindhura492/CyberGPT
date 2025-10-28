import type React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "../ui/badge";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// type VulnerabilityInfo = {
// 	_creationTime: number;
// 	_id: string;
// 	affectedUrls: {
// 		attack: string;
// 		evidence: string;
// 		method: "GET" | "POST" | "PUT" | "DELETE";
// 		uri: string;
// 	}[];
// 	confidence: string;
// 	cveIds: string[];
// 	cweId: string;
// 	reference: string;
// 	riskLevel: string;
// 	solution: string;
// 	vulnerabilityId: string;
// };

const REGEX = /^https?:\/\/[^\/]+\/(.*)/;

const Url: React.FC = () => {
	const { vulnerabilityId } = useParams<{ vulnerabilityId: string }>();
	const navigate = useNavigate();
	const vulnerabilityInfos = useQuery(
		api.vulnerabilityInfo.fetchVulnerabilityInfoByVId,
		{
			vulnerabilityId,
		},
	);

	if (!vulnerabilityInfos) {
		return (
			<div className="rounded-lg">
				<div className="flex items-center space-x-2 bg-popover rounded-md px-2 py-2 animate-pulse">
					<div className="w-4 h-4 bg-secondary rounded-full" />
					<div className="w-24 h-4 bg-secondary rounded" />
				</div>
				{/* Skeleton Loading */}
				<div className="space-y-4 mt-4">
					{Array.from({ length: 4 }).map((_, index) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							key={index}
							className="flex items-center space-x-3 p-4 rounded-md animate-pulse"
						>
							<div className="w-16 h-6 bg-secondary rounded" />
							<div className="w-full h-6 bg-secondary rounded" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-lg p-4">
			<button type="button" className="mb-4" onClick={() => navigate(-1)}>
				← Affected URLs
			</button>

			{/* Information Section */}
			<div className="w-full border bg-sidebar flex flex-col md:flex-row justify-between rounded-lg mb-5 p-5">
				<div className="w-full md:w-1/2 p-3">
					<h1 className="font-semibold text-xl mb-3 text-[#7156DB]">
						Information
					</h1>

					<div
						className="text-wrap text-justify text-gray-500"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
						dangerouslySetInnerHTML={{
							__html: vulnerabilityInfos[0].description,
						}}
					/>
				</div>

				{/* Vulnerability Assessment Information */}
				<div className="w-full md:w-1/2 p-5 border bg-popover rounded-lg">
					<h1 className="font-semibold text-lg mb-4 text-[#7156DB]">
						Asssesment Information
					</h1>
					<table className="table-auto border-collapse w-full">
						<tbody>
							<tr className="border-b border-dashed">
								<td className="px-4 py-2 text-gray-500">
									Confidence
								</td>
								<td className="px-4 py-2 text-center rounded-md">
									{vulnerabilityInfos[0]?.confidence}
								</td>
							</tr>
							<tr className="border-b border-dashed">
								<td className="px-4 py-2 text-gray-500">
									CweId
								</td>
								<td className="px-4 py-2 text-center rounded-md">
									{vulnerabilityInfos[0]?.cweId}
								</td>
							</tr>
							<tr className="border-b border-dashed">
								<td className="px-4 py-2 mt-2 text-gray-500">
									Risk Level
								</td>
								<td className="px-4 py-2 text-center rounded-md">
									{vulnerabilityInfos[0]?.riskLevel}
								</td>
							</tr>
							<tr>
								<td className="px-4 py-2 text-gray-500">
									Identified At
								</td>
								<td className="px-4 py-2 text-center rounded-md">
									{new Date(
										vulnerabilityInfos[0]?._creationTime,
									).toDateString()}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
			<div className="space-y-2">
				{vulnerabilityInfos[0].affectedUrls.map(
					(affectedUri: {
						attack: string;
						evidence: string;
						method: "GET" | "POST" | "PUT" | "DELETE";
						uri: string;
					}) => (
						<div
							key={affectedUri.uri}
							className="flex flex-wrap items-center space-x-3 p-4 border bg-sidebar rounded-sm"
						>
							<Badge
								className={`px-3 py-1 rounded text-xs font-semibold ${
									affectedUri.method === "GET"
										? "bg-green-500 text-white"
										: affectedUri.method === "POST"
											? "bg-blue-500 text-white"
											: affectedUri.method === "PUT"
												? "bg-yellow-500 text-white"
												: "bg-red-500 text-white"
								}`}
							>
								{affectedUri.method}
							</Badge>
							<span className="break-all">
								/
								{decodeURI(affectedUri.uri).match(REGEX)?.[1] ||
									""}
							</span>
						</div>
					),
				)}
			</div>
		</div>
	);
};

export default Url;
