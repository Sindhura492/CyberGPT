import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams } from "react-router-dom";
import { categorizeData } from "../../utils/url-categories";
import type { ApexOptions } from "apexcharts";

type CategorizedData = {
	[category: string]: {
		[riskLevel: string]: { url: string; riskLevel: string }[];
	};
};

const ChartComponent: React.FC = () => {
	const THEME =
		typeof window !== "undefined"
			? localStorage.getItem("vite-ui-theme")
			: null;
	const { scanId } = useParams<{ scanId: string }>();
	const [categorizedData, setCategorizedData] =
		useState<CategorizedData | null>(null);
	const [loading, setLoading] = useState(true);

	const listurls = useQuery(api.vulnerabilityInfo.fetchUrlsAndRiskByScanId, {
		scanId,
	});

	useEffect(() => {
		if (listurls) {
			const categorized = categorizeData(listurls);
			setCategorizedData(categorized);
			setLoading(false);
		}
	}, [listurls]);

	if (loading || !categorizedData) {
		return (
			<div style={{ color: THEME === "dark" ? "#FFF" : "#000" }}>
				Loading...
			</div>
		);
	}

	const riskLevels = ["Critical", "High", "Medium", "Low", "Info"];
	const categories = ["AUTH", "UNAUTH", "API", "JS", "CSS", "OTHERS"];

	const series = riskLevels.map((riskLevel) => ({
		name: riskLevel,
		data: categories.map((category) => {
			const normalizedCategory = category.toLowerCase();
			return (
				categorizedData[normalizedCategory]?.[riskLevel]?.length || 0
			);
		}),
	}));

	const options: ApexOptions = {
		chart: {
			type: "bar",
			stacked: true,
			toolbar: { show: false },
			zoom: { enabled: false },
		},
		plotOptions: {
			bar: { horizontal: false, columnWidth: "50%" },
		},
		xaxis: {
			categories,
			title: {
				text: "Request Type",
				style: {
					fontSize: "14px",
					fontWeight: "bold",
					color: THEME === "dark" ? "#FFF" : "#000",
				},
			},
			labels: {
				style: {
					fontSize: "14px",
					colors: THEME === "dark" ? "#FFF" : "#000",
				},
			},
		},
		yaxis: {
			title: {
				text: "Number of Vulnerabilities",
				style: {
					fontSize: "20px",
					fontWeight: "bold",
					color: THEME === "dark" ? "#FFF" : "#000",
				},
			},
			labels: {
				style: {
					fontSize: "15px",
					colors: THEME === "dark" ? "#FFF" : "#000",
				},
			},
		},
		legend: {
			position: "bottom",
			horizontalAlign: "center",
			offsetY: 10,
			labels: { colors: THEME === "dark" ? "#FFF" : "#000" },
		},
		fill: { opacity: 1 },
		colors: ["#DC2625", "#EA590A", "#A754F8", "#EAB305", "#3c82f6"],
		tooltip: {
			y: { formatter: (val: number) => `${val} vulnerabilities` },
		},
		dataLabels: {
			enabled: true,
			style: { colors: [THEME === "dark" ? "#FFF" : "#000"] },
		},
	};

	return (
		<div className="flex flex-col justify-center w-full p-3">
			<Chart
				options={options}
				series={series}
				type="bar"
				height="550"
				width="100%"
			/>
		</div>
	);
};

export default ChartComponent;
