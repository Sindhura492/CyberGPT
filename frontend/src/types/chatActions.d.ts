export interface ChatActionStore {
	targetUrl: string;
	fetchChatsRegurlarly: boolean;
	messages: Message[];
	createdChatId: string | null;
	pendingAction: string | null;
	humanInTheLoopMessage: string | null;
	actionType: string | null;
	actionPrompts: { id: string; name: string; type: string }[];
	setTargetUrl: (url: string) => void;
	setFetchChatsRegurlarly: (value: boolean) => void;
	setMessages: (
		updater: Message[] | ((prevMessages: Message[]) => Message[]),
	) => void;
	setCreatedChatId: (id: string | null) => void;
	setPendingAction: (action: string | null) => void;
	setActionPrompts: (
		prompts: { id: string; name: string; type: string }[],
	) => void;
	setActionType: (type: string | null) => void;
	setHumanInTheLoopMessage: (message: string | null) => void;
	addMessage: (message: Message) => void;
	clearStore: () => void;
	chatSummaryContent: string;
	setChatSummaryContent: (content: string) => void;
}
