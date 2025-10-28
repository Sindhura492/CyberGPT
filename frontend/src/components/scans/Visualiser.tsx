import BarChart from "../charts/bar-chart";
import DonutChart from "../charts/donut-charts";
import RadialSemiCircleChart from "../charts/radial-charts";
import ScanInfo from "../zapScan/scan-info";

export const Visualiser = () => {
	return (
		<div className="mx-auto my-6">
			<div className="flex flex-1 flex-col gap-6">
				<div className="grid grid-cols-1 md:grid-cols-5 gap-6">
					<div className="bg-sidebar border rounded-lg flex flex-col items-center justify-center p-6 col-span-5 md:col-span-2">
						<h3 className="text-lg md:text-xl font-semibold mb-4">
							Scan Info
						</h3>
						<ScanInfo />
					</div>

					<div className="bg-sidebar border rounded-lg flex flex-col items-center justify-center p-6 col-span-5 md:col-span-3">
						<h3 className="text-lg md:text-xl font-semibold mb-4 ">
							Scanning Status
						</h3>
						<RadialSemiCircleChart />
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="bg-sidebar border rounded-lg flex flex-col items-center justify-center p-6">
						<h3 className="text-lg md:text-xl font-semibold mb-4">
							Vulnerabilities by Severity
						</h3>
						<DonutChart />
					</div>

					<div className="bg-sidebar border rounded-lg flex flex-col items-center justify-center p-6">
						<h3 className="text-lg md:text-xl font-semibold mb-4">
							Vulnerabilities by request type
						</h3>
						<BarChart />
					</div>
				</div>
			</div>
		</div>
	);
};
