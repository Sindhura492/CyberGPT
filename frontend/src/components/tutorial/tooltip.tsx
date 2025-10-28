// import type React from "react";
// import { cn } from "@/lib/utils";

// interface TooltipProps {
// 	message: string;
// 	children: React.ReactNode;
// 	className?: string;
// }

// const Tooltip: React.FC<TooltipProps> = ({ message, children, className }) => {
// 	return (
// 		<div className={cn("group relative inline-block", className)}>
// 			{children}
// 			<span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-white opacity-0 transition before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-black before:content-[''] group-hover:opacity-100">
// 				{message}
// 				<span className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-t-black border-x-transparent border-b-transparent">Click Here</span>

// 			</span>
// 		</div>
// 	);
// };

// export default Tooltip;

import type React from "react";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";

interface TooltipProps {
	message: string;
	children: React.ReactNode;
	className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ message, children, className }) => {
	return (
		<div className={cn("group relative inline-block", className)}>
			{children}
			<span className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-black opacity-0 transition group-hover:opacity-100">
				{message}
				<span className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-t-black border-x-transparent border-b-transparent" />
				<div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
					<ArrowDown
						className="text-black animate-bounce"
						size={24}
					/>
					<span className="text-black font-semibold">Click Here</span>
				</div>
			</span>
		</div>
	);
};

export default Tooltip;
