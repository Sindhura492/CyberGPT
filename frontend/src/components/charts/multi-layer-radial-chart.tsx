import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

const MultiLayerRadialChart: React.FC = () => {
	const options: ApexOptions = {
		chart: {
			type: "radialBar",
		},
		plotOptions: {
			radialBar: {
				hollow: {
					size: "30%",
				},
				track: {
					background: "#e0e0e0",
					strokeWidth: "100%",
					margin: 10,
				},
				dataLabels: {
					name: {
						offsetY: -5,
						fontSize: "16px",
						color: "#4CAF50",
						fontWeight: "600",
					},
					value: {
						offsetY: 5,
						fontSize: "24px",
						color: "#000",
						fontWeight: "bold",
					},
				},
			},
		},
		colors: ["#66BB6A", "#43A047", "#2E7D32", "#1B5E20"],
		labels: [
			"Certificate",
			"Protocol Support",
			"Key Exchange",
			"Cipher Strength",
		],
	};

	const series = [90, 85, 80, 75];
	return (
		<div className="flex flex-col items-center justify-center w-full p-6 ">
			<div className="w-full flex justify-center">
				<Chart
					options={options}
					series={series}
					type="radialBar"
					height={400}
					className="w-full max-w-md"
				/>
			</div>

			<div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-sm">
				<div className="flex items-center space-x-2">
					<div
						className="w-4 h-4 rounded-full"
						style={{ backgroundColor: "#66BB6A" }}
					/>
					<p className="text-sm text-gray-700">Certificate</p>
				</div>
				<div className="flex items-center space-x-2">
					<div
						className="w-4 h-4 rounded-full"
						style={{ backgroundColor: "#43A047" }}
					/>
					<p className="text-sm text-gray-700">Protocol Support</p>
				</div>
				<div className="flex items-center space-x-2">
					<div
						className="w-4 h-4 rounded-full"
						style={{ backgroundColor: "#2E7D32" }}
					/>
					<p className="text-sm text-gray-700">Key Exchange</p>
				</div>
				<div className="flex items-center space-x-2">
					<div
						className="w-4 h-4 rounded-full"
						style={{ backgroundColor: "#1B5E20" }}
					/>
					<p className="text-sm text-gray-700">Cipher Strength</p>
				</div>
			</div>
		</div>
	);
};

export default MultiLayerRadialChart;
