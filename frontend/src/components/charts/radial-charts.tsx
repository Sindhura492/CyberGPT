import { Separator } from "../../components/ui/separator";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

const RadialSemiCircleChart: React.FC = () => {
	const series = [100];

	const THEME =
		typeof window !== "undefined"
			? localStorage.getItem("vite-ui-theme")
			: null;

	const options: ApexOptions = {
		chart: {
			type: "radialBar",
			offsetY: 0,
			sparkline: {
				enabled: true,
			},
		},
		plotOptions: {
			radialBar: {
				startAngle: -120,
				endAngle: 120,
				hollow: {
					size: "70%",
				},
				track: {
					background: "#",
					strokeWidth: "100%",
					margin: 5,
				},
				dataLabels: {
					name: {
						offsetY: -40,
						fontSize: "16px",
						fontWeight: "600",
						color: THEME === "dark" ? "#FFF" : "#000",
					},
					value: {
						offsetY: 20,
						fontSize: "30px",
						fontWeight: "bold",
						color: THEME === "dark" ? "#FFF" : "#000",
					},
				},
			},
		},
		colors: ["#00E396"],
		labels: ["Scanning"],
	};

	return (
		<div className="flex flex-col justify-between items-center h-full">
			{/* Radial Bar Chart */}
			<div
				className="flex-grow flex items-center justify-center"
				style={{
					height: "300px",
					minHeight: "300px",
				}}
			>
				<Chart
					options={options}
					series={series}
					type="radialBar"
					height={300}
				/>
			</div>

			<div className="mt-4 w-full max-w-md">
				<Separator />
			</div>

			{/* Metrics Section */}
			<div className="grid grid-cols-3 gap-6 w-full max-w-md mt-6">
				<div className="text-center">
					<p className="text-sm font-semibold">100</p>
					<p className="text-lg font-bold text-[#7156DB]">
						Unique URLs
					</p>
				</div>
				<div className="text-center">
					<p className="text-sm font-semibold">1</p>
					<p className="text-lg font-bold text-[#7156DB]">Forms</p>
				</div>
				<div className="text-center">
					<p className="text-sm font-semibold">0</p>
					<p className="text-lg font-bold text-[#7156DB]">APIs</p>
				</div>
			</div>
		</div>
	);
};

export default RadialSemiCircleChart;
