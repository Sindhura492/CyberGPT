import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import {
	RadioGroup,
	RadioGroupItem,
} from "../ui/radio-group";
import { Label } from "../ui/label";

export function ModeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<RadioGroup
			defaultValue={theme}
			onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
			className="flex items-center space-x-6 mb-12"
		>
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="light" id="light" />
				<Label htmlFor="light" className="flex items-center gap-1">
					<Sun className="h-4 w-4" />
					Light
				</Label>
			</div>

			<div className="flex items-center space-x-2">
				<RadioGroupItem value="dark" id="dark" />
				<Label htmlFor="dark" className="flex items-center gap-1">
					<Moon className="h-4 w-4" />
					Dark
				</Label>
			</div>

			<div className="flex items-center space-x-2">
				<RadioGroupItem value="system" id="system" />
				<Label htmlFor="system" className="flex items-center gap-1">
					<Monitor className="h-4 w-4" />
					System
				</Label>
			</div>
		</RadioGroup>
	);
}
