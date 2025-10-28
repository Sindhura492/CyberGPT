import SendIcon from "../../assets/SendIcon.svg";
// import AttachIcon from "../../assets/AttachIcon.svg";

interface ChatActionsProps {
	handleSend: () => void;
}

const ChatActions: React.FC<ChatActionsProps> = ({ handleSend }) => {
	return (
		<>
			{/* <button type="button" className="p-2 hover:bg-gray-200 rounded-md">
				<img
					src={AttachIcon} 
					alt="Logo"
					className="w-5 h-5"
				/>
			</button> */}
			<button
				onClick={handleSend}
				type="button"
				className="p-2 hover:bg-gray-200 rounded-md"
			>
				<img src={SendIcon} alt="Logo" className="w-5 h-5" />
			</button>
		</>
	);
};

export { ChatActions };
