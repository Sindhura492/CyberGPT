"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../../../ui/tooltip";

import {
	Glasses as GlassesIcon,
	Search,
	Globe,
	ArrowUp,
} from "lucide-react";

import tooltipData from "../data/tooltipData.json";
import React from "react";
import { motion } from "framer-motion";

const iconMap = {
	GlassesIcon: <GlassesIcon size={14} className="mr-0.5 sm:mr-1 text-[#5E5E5D] w-3.5 h-3.5 sm:w-4 sm:h-4" />,
	Search: <Search size={14} className="mr-0.5 sm:mr-1 text-[#5E5E5D] w-3.5 h-3.5 sm:w-4 sm:h-4" />,
	Globe: <Globe size={14} className="mr-0.5 sm:mr-1 text-[#5E5E5D] w-3.5 h-3.5 sm:w-4 sm:h-4" />,
	ArrowUp: <ArrowUp size={16} className="text-[#5E5E5D] w-4 h-4 sm:w-5 sm:h-5" />,
};

interface RoleButtonGroupProps {
	selectedAgentMode: 'tutor' | 'investigator' | 'analyst' | undefined;
	onAgentModeChange: (mode: 'tutor' | 'investigator' | 'analyst' | undefined) => void;
	agentButtonsDisabled: boolean;
	handleSend: () => void;
}

export default function RoleButtonGroup({
	selectedAgentMode,
	onAgentModeChange,
	agentButtonsDisabled,
	handleSend,
}: RoleButtonGroupProps): JSX.Element {
	interface TooltipDataItem {
		label: string;
		icon: keyof typeof iconMap;
		tooltip: string;
		iconOnly?: boolean;
	}

	const leftButtons: TooltipDataItem[] = tooltipData.slice(0, 3) as TooltipDataItem[];
	const rightButtons: TooltipDataItem[] = tooltipData.slice(3) as TooltipDataItem[];

	return (
		<TooltipProvider>
			<div className="flex justify-between items-center mt-2 sm:mt-3 flex-wrap gap-2">
				{/* Left Group - Agent Personality Buttons */}
				<div className="flex space-x-1 sm:space-x-2 flex-wrap gap-y-1">
					{leftButtons.map(({ label, icon, tooltip }) => {
						const agentMode = label.toLowerCase() as 'tutor' | 'investigator' | 'analyst';
						const isSelected = selectedAgentMode === agentMode;
						// Update iconElement logic to use text-white dark:text-black for selected, text-muted-foreground otherwise
						const iconElement = React.cloneElement(iconMap[icon], {
							className: isSelected ? 'mr-0.5 sm:mr-1 text-white dark:text-black w-3.5 h-3.5 sm:w-4 sm:h-4' : 'mr-0.5 sm:mr-1 text-muted-foreground w-3.5 h-3.5 sm:w-4 sm:h-4'
						});
						return (
							<Tooltip key={label}>
								<TooltipTrigger asChild>
									<button
										onClick={() => !agentButtonsDisabled && onAgentModeChange(isSelected ? undefined : agentMode)}
										disabled={agentButtonsDisabled}
										className={`flex items-center space-x-0.5 sm:space-x-1 px-2 py-1 sm:px-3 sm:py-1 rounded-full border transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-black/30 focus:z-10 touch-manipulation
  ${isSelected
    ? 'border-sidebar-border bg-black text-white dark:bg-white dark:text-black font-bold'
    : 'border-sidebar-border text-muted-foreground hover:bg-accent/60'}
  ${agentButtonsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
`}
									>
										{iconElement}
										<span className="text-xs sm:text-sm whitespace-nowrap">{label}</span>
									</button>
								</TooltipTrigger>
								<TooltipContent>
									<p>{tooltip} {isSelected ? '(Active)' : ''}</p>
								</TooltipContent>
							</Tooltip>
						);
					})}
				</div>

				{/* Right Group */}
				<div className="flex items-center space-x-1 sm:space-x-2 mt-0">
					{rightButtons.map(({ label, icon, tooltip }) => {
						// Regular button for all icons
						return (
							<Tooltip key={label}>
								<TooltipTrigger asChild>
									{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
									<button
										onClick={icon === "ArrowUp" ? () => {handleSend();
										} : undefined}
										disabled={icon === "ArrowUp" ? false : agentButtonsDisabled}
                                        className={
                                            icon === "ArrowUp"
                                                ? "w-8 h-8 sm:w-10 sm:h-10 p-1.5 sm:p-2 rounded-full flex items-center justify-center transition-all duration-200 bg-black text-white dark:bg-white dark:text-black touch-manipulation"
                                                : "border p-1.5 sm:p-2 rounded-full border-sidebar-border text-muted-foreground hover:text-sidebar-foreground touch-manipulation"
                                        }
									>
                                        {icon === "ArrowUp"
                                            ? (
                                                <motion.span
                                                    whileHover={{ scale: 1.25 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center"
                                                >
                                                    {React.cloneElement(iconMap[icon], {
                                                        className: "text-white dark:text-black w-4 h-4 sm:w-5 sm:h-5"
                                                    })}
                                                </motion.span>
                                            )
                                            : (
                                                <>
                                                    {iconMap[icon]}
                                                    <span className="text-xs sm:text-sm">{label}</span>
                                                </>
                                            )
                                        }
									</button>
								</TooltipTrigger>
								<TooltipContent>
									<p>{tooltip}</p>
								</TooltipContent>
							</Tooltip>
						);
					})}
				</div>
			</div>
		</TooltipProvider>
	);
}
