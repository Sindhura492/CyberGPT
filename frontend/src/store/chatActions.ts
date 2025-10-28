import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { ChatActionStore } from "../types/chatActions";
import type { Message } from "../types/chats";

const useChatActionStore = create<ChatActionStore>()(
	persist(
		(set) => ({
			targetUrl: "",
			fetchChatsRegurlarly: true,
			messages: [],
			createdChatId: null,
			pendingAction: null,
			actionType: null,
			actionPrompts: [],
			humanInTheLoopMessage: null,
			chatSummaryContent: "",
			setChatSummaryContent: (content: string) =>
				set((state) => ({ ...state, chatSummaryContent: content })),
			setTargetUrl: (url: string) => set(() => ({ targetUrl: url })),
			setFetchChatsRegurlarly: (value: boolean) =>
				set(() => ({ fetchChatsRegurlarly: value })),
			setMessages: (updater) =>
				set((state) => {
					if (typeof updater === "function") {
						return { messages: updater(state.messages) };
					}
					return { messages: updater };
				}),
			setCreatedChatId: (id: string | null) =>
				set(() => ({ createdChatId: id })),
			setPendingAction: (action: string | null) =>
				set(() => ({ pendingAction: action })),
			setActionPrompts: (
				action: { id: string; name: string; type: string }[],
			) => set(() => ({ actionPrompts: action })),
			setActionType: (type: string | null) =>
				set(() => ({ actionType: type })),
			setHumanInTheLoopMessage: (message: string | null) =>
				set(() => ({ humanInTheLoopMessage: message })),
			addMessage: (message: Message) =>
				set((state) => ({ messages: [...state.messages, message] })),
			clearStore: () =>
				set(() => ({
					messages: [],
					createdChatId: null,
					pendingAction: null,
					actionPrompts: [],
					actionType: null,
					humanInTheLoopMessage: null,
					targetUrl: "",
					chatSummaryContent: "",
					chatTitle: "",
				})),
		}),
		{
			name: "chatActions",
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export default useChatActionStore;
