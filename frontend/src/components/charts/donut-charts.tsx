import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, type PieProps } from "recharts";
import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type ChartData = {
	name: string;
	value: number;
	color: string;
};

const DonutChart: React.FC = () => {
	const { scanId } = useParams<{ scanId: string }>();
	const scanData = useQuery(api.scans.fetchTotalRisksByScanId, {
		scanId: scanId,
	});

	const [chartData, setChartData] = useState<ChartData[]>([]);
	const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

	useEffect(() => {
		if (scanData) {
			const riskColors: Record<string, string> = {
				Critical: "#DC2625",
				High: "#EA590A",
				Medium: "#A754F8",
				Low: "#EAB305",
				Informational: "#3c82f6",
			};

			const transformedData = Object.entries(scanData)
				.filter(([key]) => key !== "totalVulnerabilities")
				.map(([risk, count]) => ({
					name: risk,
					value: count as number,
					color: riskColors[risk] || "#CCCCCC",
				}))
				.filter((entry) => entry.value > 0);

			setChartData(transformedData);
		}
	}, [scanData]);

	const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

	const onPieEnter: PieProps["onMouseEnter"] = (_, index: number) => {
		setHoveredSegment(chartData[index].name);
	};

	const onPieLeave: PieProps["onMouseLeave"] = () => {
		setHoveredSegment(null);
	};

	return (
		<div className="flex flex-col items-center justify-center relative">
			<div className="relative">
				<PieChart width={500} height={500}>
					<Pie
						data={chartData}
						dataKey="value"
						nameKey="name"
						cx="50%"
						cy="50%"
						innerRadius={130}
						outerRadius={160}
						fill="#8884d8"
						paddingAngle={8}
						onMouseEnter={onPieEnter}
						onMouseLeave={onPieLeave}
					>
						{chartData.map((entry) => (
							<Cell
								key={`cell-${entry.name}`}
								fill={entry.color}
								stroke="bg-secondary"
								strokeWidth={
									hoveredSegment === entry.name ? 2 : 1
								}
							/>
						))}
					</Pie>
					<Tooltip
						formatter={(value, name) => [
							`${value}`,
							`Risk Level: ${name}`,
						]}
					/>
				</PieChart>

				<div
					style={{
						position: "absolute",
						textAlign: "center",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
					}}
				>
					<p className="text-lg font-semibold">
						{hoveredSegment !== null ? hoveredSegment : "Total"}
					</p>
					<p className="text-3xl font-bold">
						{hoveredSegment !== null
							? chartData.find(
									(entry) => entry.name === hoveredSegment,
								)?.value
							: total}
					</p>
				</div>
			</div>

			<div className="flex mt-4 space-x-4">
				{chartData.map((entry) => (
					<div
						key={entry.name}
						className="flex items-center space-x-2"
					>
						<div
							style={{
								width: 12,
								height: 12,
								backgroundColor: entry.color,
							}}
						/>
						<p className="text-sm px-1">{entry.name}</p>
					</div>
				))}
			</div>
		</div>
	);
};

export default DonutChart;
