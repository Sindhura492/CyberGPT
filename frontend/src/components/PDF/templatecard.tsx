import { FileIcon } from "lucide-react";
import { Button } from "@components/ui/button";

interface TemplateCardProps {
	title: string;
	content: string;
	onClick: () => void;
	// onDownload: () => void
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
	title,
	content,
	onClick,
	// onDownload,
}) => (
	<div className="flex flex-col border rounded-lg p-4">
		<FileIcon className="h-16 w-16 text-blue-500 mx-auto" />
		<h3 className="mt-2 font-semibold text-center">{title}</h3>
		<p className="text-sm text-muted-foreground text-center">{content}</p>
		<div className="mt-4 flex justify-between">
			<Button variant="outline" onClick={onClick}>
				View
			</Button>
			{/* <Button variant="outline" onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      // onDownload()
    }}>
       <Download className="mr-2 h-4 w-4" />
       Download PDF
    </Button> */}
		</div>
	</div>
);
