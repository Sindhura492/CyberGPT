import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Info, CheckCircle } from "lucide-react";
import { showSuccessToast, showErrorToast } from "../toaster";
import { useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useQuery, useMutation } from "convex/react";

interface Hotspot {
	_id: string;
	message: string;
	vulnerabilityProbability: string;
	component: string;
	line: number;
	staticScanId: string;
}

const ViewHotspots: React.FC = () => {
	const { staticScanId } = useParams<{ staticScanId: string }>();
	const hotspots = useQuery(api.sastScans.fetchHotspotListByScanId, {
		staticScanId,
	});

	const deleteHotspotsMutation = useMutation(api.sastScans.deleteHotspots);

	const [reviewedHotspots, setReviewedHotspots] = useState<string[]>([]);
	const [currentPage, setCurrentPage] = useState(1);

	const itemsPerPage = 6;
	const totalPages = hotspots ? Math.ceil(hotspots.length / itemsPerPage) : 0;

	const currentData = hotspots
		? hotspots.slice(
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

	const getBadgeColor = (probability: string) => {
		switch (probability.toUpperCase()) {
			case "HIGH":
				return "bg-red-100 text-red-600";
			case "MEDIUM":
				return "bg-yellow-100 text-yellow-600";
			case "LOW":
				return "bg-blue-100 text-blue-600";
			default:
				return "bg-gray-100 text-gray-600";
		}
	};

	const handleReviewClick = async (key: string) => {
		setReviewedHotspots((prev) =>
			prev.includes(key) ? prev : [...prev, key],
		);
		if (!reviewedHotspots.includes(key)) {
			setReviewedHotspots((prev) => [...prev, key]);

			try {
				const response = await deleteHotspotsMutation({
					hotspotIds: [key],
				});
				if (response.success) {
					showSuccessToast("Hotspot successfully reviewed!");
				} else {
					showErrorToast("Failed to delete hotspot.");
				}
			} catch (error) {
				showErrorToast("Error occurred while deleting hotspot.");
				return error;
			}
		}
	};

	if (!hotspots) {
		return (
			<div className="p-6">
				<div className="flex items-center mb-2 space-x-2">
					<div className="w-32 h-6 bg-secondary rounded animate-pulse" />
					<div className="w-24 h-6 bg-secondary rounded animate-pulse" />
				</div>

				<div className="flex items-center mb-6">
					<div className="w-24 h-4 bg-secondary rounded animate-pulse" />
				</div>

				<div className="grid gap-4">
					{Array.from({ length: 6 }).map(() => (
						<div
							key={`${Date.now()}-${Math.random()}`} // Ensures uniqueness using timestamp and random number
							className="relative border rounded-md p-4 bg-sidebar animate-pulse"
						>
							<div className="w-10 h-4 bg-secondary rounded absolute top-4 right-4" />
							<div className="flex items-center space-x-2 mb-2">
								<div className="w-48 h-4 bg-secondary rounded" />
								<div className="w-20 h-6 bg-secondary rounded" />
							</div>
							<div className="w-24 h-4 bg-secondary rounded mt-2" />
						</div>
					))}
				</div>

				<div className="flex justify-center space-x-4 mt-6">
					<div className="w-24 h-8 bg-secondary rounded animate-pulse" />
					<div className="w-24 h-8 bg-secondary rounded animate-pulse" />
				</div>
			</div>
		);
	}

	// Actual content after data is loaded
	return (
		<div className="p-6">
			<div className="flex items-center mb-2 space-x-2">
				<h1 className="text-2xl font-bold">Security Hotspots</h1>

				<Tooltip>
					<TooltipTrigger>
						<Info className="w-5 h-5 text-gray-500 cursor-pointer" />
					</TooltipTrigger>
					<TooltipContent>
						Security hotspots are areas in the code that may require
						a review to ensure security compliance.
					</TooltipContent>
				</Tooltip>
			</div>

			<div className="flex items-center mb-6">
				<p className="font-bold text-red-700 mr-2">NOTE!</p>
				<p className="text-sm text-red-600 font-semibold">
					Hotspots are identified to bring into your focus but not
					necessarily real vulnerabilities. Please review them first
					and then take action.
				</p>
			</div>

			<div className="grid gap-4">
				{currentData.map((hotspot: Hotspot) => (
					<div
						key={hotspot._id}
						className="relative border rounded-md p-4 bg-sidebar"
					>
						<Badge
							className={`absolute top-4 right-4 ${getBadgeColor(
								hotspot.vulnerabilityProbability,
							)} font-semibold`}
						>
							{hotspot.vulnerabilityProbability}
						</Badge>

						<div className="flex items-center space-x-2 mb-2">
							<p className="text-lg font-semibold">
								{hotspot.message}
							</p>
							<Button
								className={`flex items-center space-x-1 ${
									reviewedHotspots.includes(hotspot._id)
										? "bg-gray-200 text-gray-800 hover:bg-gray-200"
										: "bg-blue-500 text-white hover:bg-blue-600"
								} px-2 py-1 text-xs rounded-md`}
								onClick={() => handleReviewClick(hotspot._id)}
							>
								<CheckCircle className="w-4 h-4" />
								<span>
									{reviewedHotspots.includes(hotspot._id)
										? "Reviewed"
										: "Review"}
								</span>
							</Button>
						</div>

						<div className="flex items-center justify-between mt-2 text-sm">
							<p className="text-gray-500">
								<span className="font-bold">Component:</span>{" "}
								{hotspot.component}
							</p>
							<p className="text-gray-500 font-semibold">
								Line: {hotspot.line}
							</p>
						</div>
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

export default ViewHotspots;
