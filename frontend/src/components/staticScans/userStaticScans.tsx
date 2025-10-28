import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import { api } from "../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { EllipsisVertical, Trash2 } from "lucide-react";
import { showSuccessToast } from "../toaster";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { NutOffIcon } from "lucide-react";

const UserStaticScans: React.FC = () => {
	const navigate = useNavigate();
	const user = useStore((state) => state.user);
	const deleteScanMutation = useMutation(api.sastScans.deleteSASTScan);

	const recentSASTScans = useQuery(api.sastScans.fetchSASTScansByUserId, {
		userId: user?.id ? String(user.id) : "",
	});

	const scanData = recentSASTScans?.[0] || null;
	const metrics = scanData ? scanData.metrics : {};

	const metricLabels = [
		{ key: "coverage", label: "Coverage" },
		{ key: "security_rating", label: "Security" },
		{
			key: "software_quality_maintainability_rating",
			label: "Maintainability",
		},
		{ key: "duplicated_lines_density", label: "Duplications" },
		{ key: "reliability_rating", label: "Reliability" },
		{ key: "code_smells", label: "CodeSmells" },
		{ key: "ncloc", label: "NCLOC" },
		{ key: "bugs", label: "Bugs" },
	];

	const getBadgeColor = (value: string | number) => {
		const numValue = Number.parseFloat(value.toString());
		if (numValue >= 5) return "bg-red-100 text-red-600";
		if (numValue >= 3) return "bg-yellow-100 text-yellow-600";
		if (numValue >= 2) return "bg-orange-100 text-orange-600";
		if (numValue >= 1) return "bg-green-200 text-green-700";
		return "bg-green-100 text-green-600";
	};

	const deleteSASTScan = async (scanId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const response = await deleteScanMutation({ scanId });
		if (response) {
			showSuccessToast(response.message);
		}
	};

	if (!scanData) {
		return (
			<Card className="w-full max-w-md mx-auto mt-8 p-8 my-auto shadow-none border-2 border-secondary">
				<Alert variant="default" className="border-none">
					<div className="flex px--5">
						<NutOffIcon className="w-10 h-10 mr-5" />
						<AlertTitle className="text-3xl font-semibold mb-5">
							No Scans Found
						</AlertTitle>
					</div>
					<AlertDescription className="text-muted-foreground text-base">
						We couldn't find any scans in your history. Please scan
						your repos.
					</AlertDescription>
				</Alert>
			</Card>
		);
	}

	return (
		<Card className="rounded-lg border p-6 shadow-md relative bg-secondary">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center space-x-2">
					<h1 className="text-2xl font-semibold">
						{scanData.projectKey}
					</h1>
					<Badge className="bg-gray-200 text-gray-600">
						{scanData.repoType.toUpperCase()}
					</Badge>
				</div>
				<Badge className="bg-green-100 text-green-700 px-3 py-1">
					Scan Completed
				</Badge>
			</div>

			<div className="text-gray-500 text-sm mb-4">
				Last analysis:{" "}
				{new Date(scanData._creationTime).toLocaleString()}
			</div>

			<div className="grid grid-cols-4 gap-4 text-sm">
				{metricLabels.slice(0, 4).map(({ key, label }) => (
					<div key={key} className="flex items-center space-x-2">
						<Badge className={getBadgeColor(metrics[key])}>
							{metrics[key]}
						</Badge>
						<div>
							<p className="font-semibold">{label}</p>
							<p className="font-bold">{metrics[key]}</p>
						</div>
					</div>
				))}
			</div>

			<div className="grid grid-cols-4 gap-4 text-sm mt-4">
				{metricLabels.slice(4).map(({ key, label }) => (
					<div key={key} className="flex items-center space-x-2">
						<Badge className={getBadgeColor(metrics[key])}>
							{metrics[key]}
						</Badge>
						<div>
							<p className="font-semibold">{label}</p>
							<p className="font-bold">{metrics[key]}</p>
						</div>
					</div>
				))}
			</div>

			<div className="mt-6 flex justify-between items-center">
				<div className="flex space-x-4">
					<Button
						className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
						key={scanData._id}
						onClick={() => {
							navigate(
								`/recent-static-scans/hotspots/${scanData._id}`,
							);
						}}
					>
						View Hotspots
					</Button>
					<Button
						className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 cursor-pointer"
						onClick={() => {
							navigate(
								`/recent-static-scans/issues/${scanData._id}`,
							);
						}}
					>
						View Issues
					</Button>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger>
						<EllipsisVertical className="h-5 w-5 text-gray-600 hover:text-gray-800 cursor-pointer" />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-48 bg-white shadow-lg rounded-md py-1 border"
					>
						<DropdownMenuItem
							onClick={(e: React.MouseEvent) =>
								deleteSASTScan(scanData._id, e)
							}
							className="flex items-center space-x-2 text-red-600 hover:bg-red-100 px-4 py-2"
						>
							<Trash2 className="h-4 w-4" />
							<span>Delete Scan</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</Card>
	);
};

export default UserStaticScans;
