import type React from "react";
import { useState, useEffect, useCallback } from "react";
import Joyride, { type Step, type CallBackProps } from "react-joyride";
// import CustomBeacon from "./CustomBeacon"

interface TutorialProps {
	run: boolean;
	onExit: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ run, onExit }) => {
	const [steps] = useState<Step[]>([
		{
			target: ".sidebar-section",
			content: (
				<div>
					<strong>Step 1:</strong> The sidebar provides quick access
					to the Dashboard, Scans, FAQ's and Reports sections. Use
					this to navigate through the application's main features.
				</div>
			),
		},
		{
			target: ".chat-history-section",
			content: (
				<div>
					<strong>Step 2:</strong> This section displays a
					chronological history of all your recent conversations, with
					the newest chats appearing at the top.
				</div>
			),
		},
		{
			target: ".dashboard-section",
			content: (
				<div>
					<strong>Step 3:</strong> The dashboard gives you an overview
					of your recent scanned websites with static and dynamic
					scanning and key insights from completed scans.
				</div>
			),
		},
		{
			target: ".chat-input",
			content: (
				<div>
					<strong>Step 4:</strong> Here, you can type your questions
					or commands to interact with the chatbot. You can also
					initiate a website scan directly by entering the URL.
				</div>
			),
		},
		{
			target: ".reports-section",
			content: (
				<div>
					<strong>Step 5:</strong> The reports section provides
					detailed analyses and summaries of your scanned websites and
					chat summaries, including performance metrics and security
					insights.
				</div>
			),
		},
	]);

	const [isRunning, setIsRunning] = useState(run);

	useEffect(() => {
		setIsRunning(run);
	}, [run]);

	useEffect(() => {
		const checkTargetsExist = () => {
			return steps.every(
				(step) =>
					typeof step.target === "string" &&
					document.querySelector(step.target),
			);
		};

		const interval = setInterval(() => {
			if (checkTargetsExist()) {
				clearInterval(interval);
			}
		}, 100);

		return () => clearInterval(interval);
	}, [steps]);

	const handleJoyrideCallback = useCallback(
		(data: CallBackProps) => {
			const { status, type } = data;
			if (
				status === "finished" ||
				status === "skipped" ||
				type === "tour:end"
			) {
				setIsRunning(false);
				onExit();
			}
		},
		[onExit],
	);
	//   const startTutorial = () => {
	//     setIsRunning(true);
	//   };

	const handleClickOutside = useCallback(
		(event: MouseEvent) => {
			const target = event.target as HTMLElement;
			const isTooltipClick = target.closest(".react-joyride__tooltip");
			const isBeaconClick = target.closest(".react-joyride__beacon");

			if (!isTooltipClick && !isBeaconClick) {
				setIsRunning(false);
				onExit();
			}
		},
		[onExit],
	);

	useEffect(() => {
		if (isRunning) {
			document.addEventListener("click", handleClickOutside);
		} else {
			document.removeEventListener("click", handleClickOutside);
		}

		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, [isRunning, handleClickOutside]);

	return (
		<div>
			<Joyride
				steps={steps}
				run={isRunning}
				// beaconComponent={CustomBeacon}
				continuous
				showSkipButton
				scrollToFirstStep
				spotlightPadding={0}
				spotlightClicks={true}
				disableOverlayClose={true}
				styles={{
					options: {
						zIndex: 10000,
						primaryColor: "#272278",
						arrowColor: "#fff",
						backgroundColor: "#fff",
						overlayColor: "rgba(0, 0, 0, 0.5)",
						spotlightShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
						beaconSize: 36,
					},
					tooltip: {
						padding: "10px",
						borderRadius: "8px",
						boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
					},
					buttonNext: {
						backgroundColor: "#272278",
						color: "#fff",
						padding: "10px 15px",
						borderRadius: "4px",
						fontWeight: "bold",
					},
					buttonBack: {
						color: "#272278",
						marginRight: "10px",
					},
					buttonSkip: {
						color: "#272278",
					},
					spotlight: {
						padding: "10px",
					},
				}}
				locale={{
					last: "End Tutorial",
					skip: "Skip Tutorial",
				}}
				callback={handleJoyrideCallback}
			/>
		</div>
	);
};

export default Tutorial;
