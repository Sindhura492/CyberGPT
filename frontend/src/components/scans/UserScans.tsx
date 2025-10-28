import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import useStore from "../../store/store";
import { EllipsisVertical, NutOffIcon, Trash2 } from "lucide-react";
import calculateTimeDifference from "../../utils/timeCalc";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { showSuccessToast } from "../toaster";

type UserScan = {
	_id: string;
	targetUrl: string;
	status: "yellow" | "red";
	complianceStandard: string;
	scanedAt: string;
	totalIssues?: number;
	scanType: string;
	_creationTime: string;
};

const UserScans: React.FC = () => {
	const user = useStore((state) => state.user);
	const [scans, setScans] = useState<UserScan[]>([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	const deleteScanMutation = useMutation(api.scans.deleteScanAndRelatedData);

	const deleteScan = async (scanId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const responseAfterDelete = await deleteScanMutation({ scanId });
		if (!responseAfterDelete) {
			return;
		}
		showSuccessToast(responseAfterDelete.message);
		const updatedScans = scans.filter((scan) => scan._id !== scanId);
		setScans(updatedScans);
	};

	if (!user) {
		return null;
	}
	const { id } = user;

	const recentScans = useQuery(api.scans.fetchScansByUserIdWithoutRisks, {
		userId: String(id),
	});

	useEffect(() => {
		if (recentScans) {
			setScans(recentScans);
			setLoading(false);
		}
	}, [recentScans]);

	if (loading && !scans.length) {
		return (
			<div className="rounded-lg border p-6">
				<div className="flex items-center justify-between space-x-4 mb-4">
					<div className="w-32 h-4 bg-secondary rounded animate-pulse" />
				</div>
				{/* Skeleton Items */}
				{Array.from({ length: 3 }).map((_, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						key={index}
						className="flex items-center justify-between border-b pb-4 pt-4 px-3 rounded-sm last:border-none hover:bg-secondary-combi cursor-pointer animate-pulse"
					>
						<div className="flex items-center space-x-3">
							<span className="w-4 h-4 rounded-full bg-secondary" />
							<span className="bg-secondary w-32 h-4 rounded" />
							<span className="bg-secondary w-20 h-4 rounded" />
						</div>
						<div className="flex justify-evenly gap-4">
							<span className="bg-secondary w-10 h-4 rounded" />
							<span className="bg-secondary w-16 h-4 rounded" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (!loading && !scans.length) {
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
						We couldn't find any scans in your history. Ask Mira to
						scan a website for you, and come back later. Ciao! 👋
					</AlertDescription>
				</Alert>
			</Card>
		);
	}

	return (
		<div className="rounded-lg border p-6 bg-sidebar">
			<h2 className="text-xl font-semibold mb-4 p-4 flex">
				Recent Scans ({scans.length})
			</h2>

			{scans.map((scan: UserScan) => (
				// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
				<div
					key={scan._id}
					onClick={() => navigate(`/recent-scan/${scan._id}`)}
					className="flex items-center justify-between border-b pb-4 pt-4 px-3 rounded-sm last:border-none hover:bg-secondary-combi cursor-pointer"
				>
					<div className="flex items-center space-x-3">
						<span className="w-4 h-4 rounded-full bg-red-500" />
						<span className="text-[#7156DB] hover:underline truncate">
							{scan.targetUrl}
						</span>
						<Badge variant="secondary">
							{scan.complianceStandard}
						</Badge>
						<Badge
							className={`${
								scan.scanType === "Passive Scan"
									? "bg-yellow-100 text-yellow-500 hover:none"
									: "bg-green-100 text-green-500 hover:none"
							}`}
						>
							{scan.scanType}
						</Badge>
					</div>
					<div className="flex justify-evenly gap-4">
						<Badge className="bg-red-100 text-red-500 hidden sm:block">
							{scan.totalIssues}
						</Badge>
						<span className="text-sm text-gray-400 hidden sm:block">
							{calculateTimeDifference({
								_creationTime: scan._creationTime,
							})}
						</span>
						<DropdownMenu>
							<DropdownMenuTrigger>
								<EllipsisVertical className="h-5 w-5 text-sidebar-foreground" />
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-48 bg-sidebar shadow-lg rounded-md py-1"
							>
								<DropdownMenuItem
									onClick={(e: React.MouseEvent) => {
										deleteScan(scan._id, e);
									}}
									className="flex items-center space-x-2 text-red-600"
								>
									<Trash2 className="h-4 w-4" />
									<span>Delete</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			))}
		</div>
	);
};

export default UserScans;
