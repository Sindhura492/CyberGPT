import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface MarkdownViewerProps {
	content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
	return (
		<div className="prose max-w-none">
			<ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
		</div>
	);
}
