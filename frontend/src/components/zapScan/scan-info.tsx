import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import copy from "../../assets/copy.svg";
import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import useStore from "../../store/store";

const ScanInfo: React.FC = () => {
	const name = useStore.getState().user?.firstName || "Unknown User";
	const { scanId } = useParams<{ scanId: string }>();
	const scanData = useQuery(api.scans.fetchScanDetailsByScanId, {
		scanId: scanId,
	});
	if (!scanData) {
		return <div>Loading...</div>;
	}

	const scanDetails = [
		{
			id: "target",
			label: "Target",
			value: scanData.targetUrl || "Not available",
			copyable: true,
		},
		{
			id: "compliance-standard",
			label: "Compliance Standard",
			value: scanData.complianceStandard || "Not specified",
		},
		{
			id: "last-scan",
			label: "Last Scan",
			value: scanData._creationTime
				? new Date(scanData._creationTime).toLocaleDateString()
				: "Not available",
		},
		{
			id: "initiated-by",
			label: "Initiated By",
			value: name,
		},
	];

	return (
		<div className="p-6 h-full w-full">
			<div className="space-y-4">
				{scanDetails.map((item) => (
					<div key={item.id}>
						<div className="flex justify-between items-center">
							<span className="text-sm text-[#7156DB] font-bold mb-6">
								{item.label}
							</span>

							<div className="flex items-center w-3/4 gap-x-2">
								<span className="text-sm mb-6 break-all">
									{item.value}
								</span>
								{/* Copy Icon */}
								{item.copyable && (
									<Button
										className="mb-6 bg-white hover:bg-gray-100"
										variant="default"
										onClick={() =>
											navigator.clipboard.writeText(
												item.value,
											)
										}
										size="sm"
									>
										<img
											src={copy}
											alt="Copy to clipboard"
											className="w-4 h-4"
										/>
									</Button>
								)}
							</div>
						</div>

						<Separator className="mt-2" />
					</div>
				))}
			</div>
		</div>
	);
};

export default ScanInfo;
