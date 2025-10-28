import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { ModeToggle } from "../theme/mode-toggle";

export function Navbar() {
	return (
		<header className="bg-background sticky top-0 z-40 w-full border-b">
			<div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
				<div className="flex gap-6 md:gap-10">
					<Link to="/" className="flex items-center space-x-2">
						<span className="inline-block font-bold text-xl">
							MyProject
						</span>
					</Link>
					<nav className="flex gap-6">
						<Button variant="link" asChild>
							<Link to="/">Home</Link>
						</Button>
						<Button variant="link" asChild>
							<Link to="/about">About</Link>
						</Button>
						<Button variant="link" asChild>
							<Link to="/contact">Contact</Link>
						</Button>
					</nav>
					<ModeToggle />
				</div>
			</div>
		</header>
	);
}
