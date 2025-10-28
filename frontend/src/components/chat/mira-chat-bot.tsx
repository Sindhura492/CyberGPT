import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { FaChevronRight } from 'react-icons/fa';
import { Brain, Link, TagIcon } from "lucide-react";

//components
import { ScrollArea } from "@components/ui/scroll-area";
import { Spinner } from "@components/loader/spinner";
import { Progress } from "@components/ui/progress";
import { HumanInTheLoopOptions } from "./human-in-the-loop-options";
import { HumanInTheLoopApproval } from "./human-in-the-loop-approval";
import GraphGenerationModal from "./GraphGenerationModal";
import { useGraphGenerationModal } from "../../hooks/useGraphGenerationModal";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@components/ui/dialog";
import { Sheet, SheetTrigger, SheetContent } from '../ui/sheet';
// Removed unused Link2 import
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

//apis
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { chatApis } from "../../api/chat";
import { chatWithJargon } from '../../api/chat';
import { BASE_URL } from '../../api/config.backend';
import type { Id } from "../../convex/_generated/dataModel";

//store
import useStore from "../../store/store";
import useChatActionStore from "../../store/chatActions";

// svgs
// import mira_logo from "../../assets/Mira_logo.png";

// types
import type { TriggerAgentData } from "../../types/agent";
import type { Folder, FolderItem, FolderType } from "../../types/reports";
import type {
	Message,
	ChatHistory,
	Info,
	RequestHumanInLoop,
} from "../../types/chats";

//constants
import { scanApis } from "../../api/scan";
import { ragApis } from "../../api/rag";
import useScanStore from "../../store/scanStore";
import MarkdownViewer from "../file/MarkdownViewer";
import {
	URL_PATTERN,
	STANDARDS,
	REPORTS,
	NEGATION_PATTERNS,
	CLARIFICATION_PATTERNS,
	SCANTYPES,
	CREATE_FOLDER_ACTION,
	GITHUB_URL_PATTERN,
	GITHUB_SCAN,
} from "./constants";
import { CreateFolderDialog } from "../folder/CreateFolderDialog";
import { HumanInTheLoopInput } from "./human-in-the-loop-input";
// import { getGreeting } from "./greetings";
import { showErrorToast, showInfoToast, showSuccessToast } from "../toaster";

import { agentApi } from "../../api/agent";
import RoleButtonGroup from "./chatComponents/RoleButton/RoleButtonGroup";
import { SourceLinks } from "./SourceLinks";
import GraphButton, { convertGraphDataToGraphVisualization } from "../graph-visualization/GraphButton";
import TodoListButton from "./TodoListButton";

// Interactive Loading Messages
const INTERACTIVE_LOADING_MESSAGES = [
	"Thinking... 🤔",
	"Oh well, it's taking long... ⏳",
	"Maybe the knowledge is self-growing... 🌱",
	"Oh, I'm trying to search across the web... 🔍",
	"Analyzing security vulnerabilities... 🔒",
	"Scanning CVE databases... 🛡️",
	"Checking threat intelligence feeds... 📊",
	"Validating security findings... ✅",
	"Cross-referencing with NVD... 🔍",
	"Analyzing attack vectors... ⚔️",
	"Evaluating risk levels... 📈",
	"Compiling mitigation strategies... 🛠️",
	"Verifying security recommendations... 🔐",
	"Checking compliance frameworks... 📋",
	"Analyzing exploit techniques... 💻",
	"Reviewing security best practices... 📖",
	"Validating patch recommendations... 🔧",
	"Ohh, found it! Let me add it to my knowledge... 📚",
	"About to prepare the answer... Almost done! ✨",
	"Just a few more seconds... ⏳",
	"Completing the answer... ✨",

];

// Function to start interactive loading with progressive messages
const startInteractiveLoading = (
	setLoadingMessage: (message: string) => void, 
	setLoadingMessageIndex: (index: number) => void,
	loadingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>
) => {
	let currentIndex = 0;
	
	// Clear any existing interval
	if (loadingIntervalRef.current) {
		clearInterval(loadingIntervalRef.current);
	}
	
	// Set initial message
	setLoadingMessage(INTERACTIVE_LOADING_MESSAGES[currentIndex]);
	setLoadingMessageIndex(currentIndex);
	
	// Create interval to cycle through messages
	const interval = setInterval(() => {
		currentIndex++;
		if (currentIndex < INTERACTIVE_LOADING_MESSAGES.length) {
			setLoadingMessage(INTERACTIVE_LOADING_MESSAGES[currentIndex]);
			setLoadingMessageIndex(currentIndex);
		} else {
			// Stop at the last message
			clearInterval(interval);
			loadingIntervalRef.current = null;
		}
	}, 3500); // Change message every 5 seconds
	
	// Store the interval in the ref
	loadingIntervalRef.current = interval;
	
	return interval;
};

// Function to stop interactive loading
const stopInteractiveLoading = (loadingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
	console.log('stopInteractiveLoading called - checking interval');
	if (loadingIntervalRef.current) {
		console.log('Clearing loading interval');
		clearInterval(loadingIntervalRef.current);
		loadingIntervalRef.current = null;
		console.log('Loading interval cleared');
	} else {
		console.log('No loading interval to clear');
	}
};

// Helper function to stop loading and reset state
const stopLoading = (
	setIsLoading: (loading: boolean) => void,
	setAgentButtonsDisabled: (disabled: boolean) => void,
	loadingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
	setLoadingMessage: (message: string) => void
) => {
	console.log('stopLoading called - clearing loading state');
	stopInteractiveLoading(loadingIntervalRef);
	setIsLoading(false);
	setAgentButtonsDisabled(false);
	setLoadingMessage("Thinking..."); // Reset to initial message
	console.log('stopLoading completed - loading state cleared');
};

async function getRelatedQuestions(userQuestion: string, aiAnswer: string, kgContext: string, chatHistory: Message[]) {
	try {
		console.log('[Related Questions] Starting generation for question:', userQuestion.substring(0, 50) + '...');
		console.log('[Related Questions] AI answer length:', aiAnswer.length);
		console.log('[Related Questions] KG context length:', kgContext.length);
		
		// Get previous questions to avoid duplicates
		const previousQuestions = (chatHistory || [])
			.filter((msg) => msg.sender === 'user' || msg.isRelatedQuestion)
			.map((msg) => msg.message || '');

		console.log('[Related Questions] Previous questions count:', previousQuestions.length);

		// Call backend API to generate contextual questions
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
		
		try {
			const response = await fetch(`${BASE_URL}/chat/related-questions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userQuestion,
					aiAnswer,
					kgContext,
					previousQuestions
				}),
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('[Related Questions] API Error:', response.status, errorText);
				throw new Error(`Failed to generate related questions: ${response.status} ${errorText}`);
			}

			const data = await response.json();
			const questions = data.questions || [];

			console.log('[Related Questions] Generated:', questions);
			console.log('[Related Questions] Questions count:', questions.length);
			
			// Ensure we have exactly 3 questions
			if (questions.length < 3) {
				console.warn('[Related Questions] Only got', questions.length, 'questions, using fallback for remaining');
				const fallbackQuestions = [
					'What are the main attack vectors for this vulnerability?',
					'How do the prevention techniques work in practice?',
					'What are the latest tools for detecting this threat?'
		];
				return [...questions, ...fallbackQuestions.slice(0, 3 - questions.length)];
			}
			
			return questions.slice(0, 3); // Ensure exactly 3 questions
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error && error.name === 'AbortError') {
				console.error('[Related Questions] API call timed out after 10 seconds');
			}
			throw error;
		}
	} catch (error) {
		console.error('[Related Questions] Error generating questions:', error);
		// Fallback to basic questions if API fails
		return [
			'What are the main attack vectors for this vulnerability?',
			'How do the prevention techniques work in practice?',
			'What are the latest tools for detecting this threat?'
		];
	}
}



const MiraChatBot: React.FC = () => {
	const navigate = useNavigate();
	const [scanType, setScanType] = useState<string | null>(null);
	const [confirmType, setConfirmType] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [, setStreaming] = useState(false);
	const [chatsLoader, setChatsLoader] = useState(false);
	const [info, setInfo] = useState<Info[]>([]);
	const [isScanLoading, setIsScanLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [input, setInput] = useState("");
	const [progressLoaderMessage, setProgressLoaderMessage] = useState("");
	const [folderId, setFolderId] = useState("");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [foldersList, setFoldersList] = useState(CREATE_FOLDER_ACTION);
	const [requestHumanInLoop, setRequestHumanInLoop] =
		useState<RequestHumanInLoop | null>();

	// Interactive Loading State
	const [loadingMessage, setLoadingMessage] = useState("Thinking...");
	const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
	const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Agent Personality State
	const [selectedAgentMode, setSelectedAgentMode] = useState<'tutor' | 'investigator' | 'analyst' | undefined>('tutor');
	const [agentButtonsDisabled, setAgentButtonsDisabled] = useState(false);

	// Graph Generation Modal State
	const { closeModal, isModalOpen } = useGraphGenerationModal();

	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const { chatId: chatIdParam } = useParams<{ chatId: string }>();
	const chatId = chatIdParam;

	// const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	//store actions

	const { user } = useStore();
	const {
		scanResponse,
		setScanResponse,
		scanSastResponse,
		setScanSastResponse,
	} = useScanStore();
	const {
		targetUrl,
		fetchChatsRegurlarly,
		messages,
		createdChatId,
		pendingAction,
		actionPrompts,
		actionType,
		humanInTheLoopMessage,
		setTargetUrl,
		setFetchChatsRegurlarly,
		setMessages,
		setCreatedChatId,
		setPendingAction,
		setActionPrompts,
		setActionType,
		setHumanInTheLoopMessage,
		chatSummaryContent,
		setChatSummaryContent,
	} = useChatActionStore();

	// Add state to track shown related questions
	const [_, setShownRelatedQuestions] = useState<string[]>([]);
	// Collector for all related questions shown in this render
	let allRelatedQuestionsThisRender: string[] = [];

	// Track shown related questions per context
	// const [contextToShownQuestions, setContextToShownQuestions] = useState<{ [context: string]: string[] }>({});

	// Track when the AI starts thinking (spinner shown)
	const thinkingStartRef = useRef<number | null>(null);

	// Get greeting based on the detected time zone
	// const greeting = getGreeting(timeZone);
	const saveChatMessage = useMutation(api.chats.saveChatMessage);
	const saveEnhancedChatMessage = useMutation(api.chats.saveEnhancedChatMessage);
	const saveChat = useMutation(api.chats.saveChat);
	const saveFile = useMutation(api.reports.addReport);
	const saveSummary = useMutation(api.summaries.saveSummary);
	const isValidChatId = useQuery(api.chats.validateChatId, {
		chatId: chatIdParam ? chatIdParam : "",
		userId: String(user?.id),
	});
	const folderData = useQuery(
		api.reports.getReportFoldersByUser,
		user?.id && {
			userId: String(user?.id),
		},
	);
	const chatData = useQuery(
		api.chats.getChatHistory,
		fetchChatsRegurlarly && isValidChatId ? { chatId: chatId } : "skip",
	);

	// Add state to track expanded reasoning per message
	const [expandedReasoning, setExpandedReasoning] = useState<{ [id: string]: boolean }>({});
	const [relatedQuestions, setRelatedQuestions] = useState<{ [messageId: string]: string[] }>({});
	// Add state to track expanded tags per message
	const [expandedTags, setExpandedTags] = useState<{ [id: string]: boolean }>({});
	
	// Add state to track which messages have already had related questions generated
	const [processedRelatedQuestions, setProcessedRelatedQuestions] = useState<Set<string>>(new Set());
	
	// Force re-render trigger for related questions
	// Removed unused: const [relatedQuestionsUpdateTrigger, setRelatedQuestionsUpdateTrigger] = useState(0);
	
	// Add state to track when a related question is being processed
	const [relatedQuestionFlag, setRelatedQuestionFlag] = useState<boolean>(false);
	
	// Reasoning visibility is now handled by expandedReasoning state only
	
	// Add ref to track ongoing related questions requests to prevent duplicates
	const ongoingRequestsRef = useRef<Set<string>>(new Set());

	// biome-ignore lint/correctness/useExhaustiveDependencies: all dependencies not needed
	useEffect(() => {
		setChatsLoader(true);
		if (chatIdParam) {
			setFetchChatsRegurlarly(true);
			setCreatedChatId(chatIdParam);
			if (isValidChatId !== undefined) {
				if (isValidChatId) {
					setChatsLoader(false);
				} else {
					navigate("/chatbot");
				}
			}
		} else {
			setChatsLoader(false);
		}
		
		// Reset reasoning state when chat changes
		setExpandedReasoning({});
		setProcessedRelatedQuestions(new Set());
		ongoingRequestsRef.current.clear();
	}, [chatIdParam, isValidChatId, navigate]);

	// Cleanup loading interval on component unmount
	useEffect(() => {
		return () => {
			if (loadingIntervalRef.current) {
				clearInterval(loadingIntervalRef.current);
			}
		};
	}, []);

	// Reset processed related questions when chat changes
	useEffect(() => {
		console.log('[Chat Change] Resetting processed related questions');
		setProcessedRelatedQuestions(new Set());
	}, [chatId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: all dependencies not needed
	useEffect(() => {
		handleScrollToBottom();
	}, [messages]);

	// Debug effect to monitor messages state changes
	useEffect(() => {
		console.log('Messages state changed:', {
			count: messages.length,
			lastMessage: messages[messages.length - 1],
			lastMessageSender: messages[messages.length - 1]?.sender,
			lastMessageContent: messages[messages.length - 1]?.message?.substring(0, 100) + '...'
		});
	}, [messages]);

	// Debug effect to monitor loading state changes
	useEffect(() => {
		console.log('Loading state changed:', {
			isLoading,
			loadingMessage,
			loadingMessageIndex
		});
	}, [isLoading, loadingMessage, loadingMessageIndex]);

	// Generate related questions for new AI messages immediately
	useEffect(() => {
		console.log('[Related Questions] useEffect triggered with messages count:', messages.length);
		if (messages.length > 0) {
			const lastMessage = messages[messages.length - 1];
			const messageId = String(lastMessage.id);
			
			console.log('[Related Questions] Checking message:', {
				messageId,
				sender: lastMessage.sender,
				hasRelatedQuestions: !!relatedQuestions[messageId],
				isProcessed: processedRelatedQuestions.has(messageId),
				isOngoing: ongoingRequestsRef.current.has(messageId)
			});
			
			// Only generate for new AI messages that don't have related questions yet
			if (lastMessage.sender === 'ai' && 
				!relatedQuestions[messageId] && 
				!processedRelatedQuestions.has(messageId) &&
				!ongoingRequestsRef.current.has(messageId)) {
				
				console.log('[Related Questions] ✅ Conditions met - immediately generating for new AI message:', messageId);
				
				// Mark as processed to prevent duplicate calls
				setProcessedRelatedQuestions(prev => new Set([...prev, messageId]));
				ongoingRequestsRef.current.add(messageId);
				
				// Find the user question that prompted this AI response
				const userQuestion = messages.slice(0, -1).reverse().find(m => m.sender === 'user')?.message || '';
				
				console.log('[Related Questions] User question found:', userQuestion.substring(0, 50) + '...');
				
				// Generate contextual questions immediately
				getRelatedQuestions(
					userQuestion,
					lastMessage.message,
					lastMessage.reasoningTrace ? JSON.stringify(lastMessage.reasoningTrace) : '',
					messages
				).then(generatedQuestions => {
					if (generatedQuestions && generatedQuestions.length > 0) {
						console.log('[Related Questions] ✅ Successfully generated context-specific questions:', generatedQuestions);
						setRelatedQuestions(prev => {
							const newState = {
								...prev,
								[messageId]: generatedQuestions
							};
							console.log('[Related Questions] Updated relatedQuestions state:', newState);
							return newState;
						});
						console.log('[Related Questions] ✅ Related questions state updated');
					} else {
						console.log('[Related Questions] ⚠️ No questions generated');
					}
					// Clean up ongoing request
					ongoingRequestsRef.current.delete(messageId);
				}).catch(error => {
					console.error('[Related Questions] ❌ Failed to generate context-specific questions:', error);
					// Remove from processed set if it failed so it can be retried
					setProcessedRelatedQuestions(prev => {
						const newSet = new Set(prev);
						newSet.delete(messageId);
						return newSet;
					});
					// Clean up ongoing request
					ongoingRequestsRef.current.delete(messageId);
				});
			} else {
				console.log('[Related Questions] ❌ Conditions not met for message:', messageId);
			}
		}
	}, [messages]); // Only depend on messages to avoid infinite loops

	// Auto-expand reasoning traces for new AI messages with reasoning data
	useEffect(() => {
		if (messages.length > 0) {
			const lastMessage = messages[messages.length - 1];
			
			// Check if this is a new AI message with reasoning trace that's not already expanded
			if (lastMessage.sender === 'ai' && 
				lastMessage.reasoningTrace && 
				!expandedReasoning[String(lastMessage.id)]) {
				
				console.log('[Reasoning] Auto-expanding reasoning for new AI message:', {
					messageId: lastMessage.id,
					hasReasoningTrace: !!lastMessage.reasoningTrace,
					reasoningType: typeof lastMessage.reasoningTrace,
					isArray: Array.isArray(lastMessage.reasoningTrace),
					reasoningLength: Array.isArray(lastMessage.reasoningTrace) ? lastMessage.reasoningTrace.length : 'N/A',
					currentExpandedState: expandedReasoning[String(lastMessage.id)]
				});
				
				// Auto-expand the reasoning trace for new messages
				setExpandedReasoning(prev => ({
					...prev,
					[String(lastMessage.id)]: true
				}));
			}
		}
	}, [messages]); // Removed expandedReasoning from dependencies to prevent conflicts

	// Additional effect to ensure reasoning is collapsed by default for AI messages with reasoning data
	useEffect(() => {
		messages.forEach((message) => {
			if (message.sender === 'ai' && 
				message.reasoningTrace && 
				expandedReasoning[String(message.id)] === undefined) {
				
				console.log('[Reasoning] Setting reasoning to collapsed by default for message:', message.id);
				setExpandedReasoning(prev => ({
					...prev,
					[String(message.id)]: false
				}));
			}
		});
	}, [messages, expandedReasoning]);

	// Set reasoning to collapsed by default when new AI messages are added
	useEffect(() => {
		const lastMessage = messages[messages.length - 1];
		if (lastMessage?.sender === 'ai' && lastMessage?.reasoningTrace) {
			console.log('[Reasoning] Setting reasoning to collapsed for new AI message:', {
				messageId: lastMessage.id,
				hasReasoningTrace: !!lastMessage.reasoningTrace,
				reasoningType: typeof lastMessage.reasoningTrace,
				isArray: Array.isArray(lastMessage.reasoningTrace),
				relatedQuestionFlag: relatedQuestionFlag
			});
			
			// Set reasoning to collapsed by default for new AI messages
			setExpandedReasoning(prev => ({
				...prev,
				[String(lastMessage.id)]: false
			}));
			
			// Reset the related question flag after processing
			if (relatedQuestionFlag) {
				setRelatedQuestionFlag(false);
			}
		}
	}, [messages.length, relatedQuestionFlag]); // Trigger when message count changes or related question flag changes

	// Additional effect to ensure all AI messages with reasoning are collapsed by default
	useEffect(() => {
		messages.forEach((message) => {
			if (message.sender === 'ai' && 
				message.reasoningTrace && 
				expandedReasoning[String(message.id)] === undefined) {
				
				console.log('[Reasoning] Setting reasoning to collapsed for existing AI message:', {
					messageId: message.id,
					hasReasoningTrace: !!message.reasoningTrace,
					currentExpandedState: expandedReasoning[String(message.id)]
				});
				
				setExpandedReasoning(prev => ({
					...prev,
					[String(message.id)]: false
				}));
			}
		});
	}, [messages]); // Trigger when messages change

	// Force initialize reasoning state for new AI messages (especially from related questions)
	useEffect(() => {
		const lastMessage = messages[messages.length - 1];
		if (lastMessage?.sender === 'ai' && 
			lastMessage?.reasoningTrace && 
			expandedReasoning[String(lastMessage.id)] === undefined) {
			
			console.log('[Reasoning Force Init] Initializing reasoning state for new AI message:', {
				messageId: lastMessage.id,
				hasReasoningTrace: !!lastMessage.reasoningTrace,
				currentExpandedState: expandedReasoning[String(lastMessage.id)],
				relatedQuestionFlag: relatedQuestionFlag
			});
			
			// Force set reasoning to collapsed for new AI messages
			setExpandedReasoning(prev => ({
				...prev,
				[String(lastMessage.id)]: false
			}));
		}
	}, [messages, expandedReasoning, relatedQuestionFlag]); // Trigger when messages, reasoning state, or related question flag changes

	// Handle related question flag changes
	useEffect(() => {
		if (relatedQuestionFlag) {
			console.log('[Related Question Flag] Flag is set, ensuring reasoning state will be properly initialized for next AI response');
		}
	}, [relatedQuestionFlag]);

	// AGGRESSIVE: Ensure ALL AI messages with reasoning have their state set
	useEffect(() => {
		let hasChanges = false;
		const newExpandedReasoning = { ...expandedReasoning };
		
		messages.forEach((message) => {
			if (message.sender === 'ai' && 
				message.reasoningTrace && 
				expandedReasoning[String(message.id)] === undefined) {
				
				console.log('[AGGRESSIVE] Setting reasoning state for message:', {
					messageId: message.id,
					hasReasoningTrace: !!message.reasoningTrace,
					currentState: expandedReasoning[String(message.id)]
				});
				
				newExpandedReasoning[String(message.id)] = false;
				hasChanges = true;
			}
		});
		
		if (hasChanges) {
			console.log('[AGGRESSIVE] Updating reasoning state with new entries');
			setExpandedReasoning(newExpandedReasoning);
		}
	}, [messages, expandedReasoning]); // Run on every render to catch any missing states

	// IMMEDIATE: Set reasoning state for any AI message that doesn't have it
	useEffect(() => {
		const newMessages = messages.filter(msg => 
			msg.sender === 'ai' && 
			msg.reasoningTrace && 
			expandedReasoning[String(msg.id)] === undefined
		);
		
		if (newMessages.length > 0) {
			console.log('[IMMEDIATE] Found AI messages without reasoning state:', newMessages.map(m => m.id));
			
			const newExpandedReasoning = { ...expandedReasoning };
			newMessages.forEach(msg => {
				newExpandedReasoning[String(msg.id)] = false;
			});
			
			setExpandedReasoning(newExpandedReasoning);
		}
	}, [messages]); // Only depend on messages to avoid infinite loops

	// TEMPORARY: Force reasoning to be visible for testing
	useEffect(() => {
		const aiMessagesWithReasoning = messages.filter(msg => 
			msg.sender === 'ai' && msg.reasoningTrace
		);
		
		if (aiMessagesWithReasoning.length > 0) {
			console.log('[TEMPORARY] Found AI messages with reasoning:', aiMessagesWithReasoning.map(m => ({
				id: m.id,
				hasReasoning: !!m.reasoningTrace,
				currentState: expandedReasoning[String(m.id)]
			})));
			
			// Force all reasoning to be visible for testing
			const newExpandedReasoning = { ...expandedReasoning };
			aiMessagesWithReasoning.forEach(msg => {
				newExpandedReasoning[String(msg.id)] = true;
			});
			
			setExpandedReasoning(newExpandedReasoning);
		}
	}, [messages]); // Run when messages change



	// biome-ignore lint/correctness/useExhaustiveDependencies: all dependencies not needed
	useEffect(() => {
		if (chatData) {
			console.log('Loading chat history from database:', chatData);
			const chatHistory: Message[] = chatData.map(
				(chat: ChatHistory): Message => {
					// Debug: Check if enhanced data exists
					if (chat.sender === "ai") {
						console.log('AI message enhanced data:', {
							messageId: chat._id,
							hasJargons: !!chat.Jargons,
							jargonsKeys: chat.Jargons ? Object.keys(chat.Jargons) : [],
							jargonsData: chat.Jargons,
							hasReasoning: !!chat.Reasoning,
							hasInfo: !!chat.Info,
							hasAnswer: !!chat.Answer,
							answerLength: chat.Answer?.length || 0,
							messageLength: chat.message?.length || 0,
							answerPreview: chat.Answer?.substring(0, 100) + '...',
							messagePreview: chat.message?.substring(0, 100) + '...',
							answerHasMarkdown: chat.Answer?.includes('**') || chat.Answer?.includes('*') || chat.Answer?.includes('`'),
							messageHasMarkdown: chat.message?.includes('**') || chat.message?.includes('*') || chat.message?.includes('`')
						});
					}
					
					// Convert Jargons object back to array format for frontend
					const jargons = chat.Jargons 
						? Object.entries(chat.Jargons).map(([term, description]) => ({ term, description }))
						: undefined;
					
					// Map reasoningTrace to narrative if present (from DB Reasoning field or trace)
					let reasoningTrace;
					if (chat.Reasoning) {
						// If we have a Reasoning string, create a proper reasoningTrace structure
						reasoningTrace = [
							{
								narrative: chat.Reasoning
							},
							{
								step: "Step1",
								message: "Context retrieved from knowledge graph."
							},
							{
								step: "Step2", 
								message: "Comprehensive analysis completed."
							},
							{
								step: "Step3",
								message: "Response generated using LLM with context."
							}
						];
						console.log('[Message Loading] Created reasoningTrace from Reasoning field:', {
							messageId: chat._id,
							reasoningLength: chat.Reasoning?.length || 0,
							hasReasoningTrace: !!reasoningTrace
						});
					} else if ((chat as any).trace && typeof (chat as any).trace[0]?.narrative === 'string') {
						reasoningTrace = (chat as any).trace;
						console.log('[Message Loading] Using existing trace with narrative:', {
							messageId: chat._id,
							hasReasoningTrace: !!reasoningTrace
						});
					} else if ((chat as any).trace) {
						reasoningTrace = (chat as any).trace;
						console.log('[Message Loading] Using existing trace:', {
							messageId: chat._id,
							hasReasoningTrace: !!reasoningTrace
						});
					} else {
						reasoningTrace = undefined;
						console.log('[Message Loading] No reasoning found for message:', {
							messageId: chat._id,
							hasReasoning: !!chat.Reasoning,
							hasTrace: !!(chat as any).trace
						});
					}
					
					// Create CVE descriptions map from Info if available
					const cveDescriptionsMap = chat.Info?.cve_id 
						? { [chat.Info.cve_id]: chat.Info.cve_desc || 'CVE description not available' }
						: undefined;
					
					// Map SourceLinks from database format with type casting
					const sourceLinks = chat.SourceLinks?.map(source => ({
						...source,
						type: source.type as 'official' | 'reference' | 'framework'
					})) || undefined;
					
					return {
						id: chat._id,
						humanInTheLoopId: chat.humanInTheLoopId,
						chatId: chat.chatId,
						// Always use message field for consistency (Answer field might have processing issues)
						message: (() => {
							const content = chat.message;
							console.log('Message content selection:', {
								messageId: chat._id,
								sender: chat.sender,
								usingAnswer: false, // Always use message field now
								contentLength: content?.length || 0,
								contentPreview: content?.substring(0, 100) + '...',
								hasMarkdown: content?.includes('**') || content?.includes('*') || content?.includes('`')
							});
							return content;
						})(),
						sender: chat.sender as "user" | "ai",
						// Include enhanced fields for AI messages
						...(chat.sender === "ai" && {
							jargons,
							reasoningTrace,
							cveDescriptionsMap,
							sourceLinks,
							tags: Array.isArray((chat as any).tags) ? (chat as any).tags : undefined,
						}),
					};
				},
			);

			setMessages(chatHistory);
			
			// Set reasoning to collapsed by default for loaded messages
			const reasoningState: { [id: string]: boolean } = {};
			chatHistory.forEach((message) => {
				if (message.sender === 'ai' && message.reasoningTrace) {
					reasoningState[String(message.id)] = false; // Collapse reasoning by default for loaded messages
				}
			});
			setExpandedReasoning(prev => ({ ...prev, ...reasoningState }));

			setChatsLoader(false);
		}
		if (folderData) {
			const newFolders: FolderItem[] = folderData.map(
				(item: FolderType): FolderItem => ({
					id: item._id,
					name: item.folderName,
					type: "folder",
				}),
			);

			const updatedFoldersList: FolderItem[] = [
				...foldersList,
				...newFolders.filter(
					(newFolder: FolderItem) =>
						!foldersList.some(
							(folder: FolderItem) => folder.id === newFolder.id,
						),
				),
			];

			setFoldersList(updatedFoldersList);
		}
	}, [chatData, folderData]);

	const handleTitleGeneration = async (messages: string) => {
		try {
			const response = await generateTitle(messages);

			return response;
		} catch (error) {
			return error;
		}
	};

	const handleScrollToBottom = useCallback(() => {
		requestAnimationFrame(() => {
			if (scrollAreaRef.current) {
				const scrollContainer = scrollAreaRef.current.querySelector(
					"[data-radix-scroll-area-viewport]",
				);
				if (scrollContainer) {
					scrollContainer.scrollTop = scrollContainer.scrollHeight;
				}
			}
		});
	}, []);
	const saveReport = useMutation(api.reports.createReportFolder);

	const handleCreateFolder = async (
		name: string,
		action: RequestHumanInLoop | null | undefined,
	) => {
		if (
			foldersList.some(
				(folder) => folder.name.toLowerCase() === name.toLowerCase(),
			)
		) {
			showErrorToast("A folder with this name already exists.");
			return;
		}

		const newFolder: Folder = {
			id: uuidv4(),
			name,
			files: [],
			createdAt: new Date(),
		};

		const response = await saveReport({
			folderName: newFolder.name,
			userId: String(user?.id),
		});
		if (response && action) {
			setPendingAction(null);
			addBotMessage(`Created folder ${newFolder.name} `);
			const manualMessage = "Thank you for providing the file name";
			const botMessage: Message = {
				id: uuidv4(),
				message: manualMessage,
				sender: "ai",
			};
			setFolderId(response);
			await saveChatMessage({
				chatId: createdChatId
					? (createdChatId as Id<"chats">)
					: (chatId as Id<"chats">),
				humanInTheLoopId: botMessage.id,
				sender: botMessage.sender,
				message: botMessage.message,
			});
			setPendingAction(botMessage.id as string);
			setRequestHumanInLoop({
				action: action.action,
				prompt: manualMessage,
				type: action.type,
				id: botMessage.id,
			});
			requestHumanApproval(
				action.action,
				manualMessage,
				action.type,
				botMessage.id,
			);
		}
	};

	const processPrompt = async (userMessage: Message, _useRAG?: boolean) => {
		console.log("🚨 [Frontend] PROCESS PROMPT CALLED - This should appear for every message!");
		console.log("🚨 [Frontend] User message:", userMessage);
		setIsLoading(true);
		setAgentButtonsDisabled(true); // Disable agent buttons during processing
		
		// Start interactive loading with progressive messages
		startInteractiveLoading(setLoadingMessage, setLoadingMessageIndex, loadingIntervalRef);
		const lowerPrompt = userMessage.message.toLowerCase().trim();
		const extractURLs = (text: string): string[] => {
			return text.match(URL_PATTERN) || [];
		};
		const urls = extractURLs(userMessage.message);
		setTargetUrl(urls[0]);
		const isGitHubURL = GITHUB_URL_PATTERN.test(lowerPrompt);
		const hasNegation = NEGATION_PATTERNS.some((pattern) =>
			pattern.test(lowerPrompt),
		);
		const isClarification = CLARIFICATION_PATTERNS.test(lowerPrompt);
		// const reportRequest = isReportRequest(lowerPrompt);

		console.log('🔍 FLOW DEBUG:', {
			lowerPrompt,
			hasNegation,
			isClarification,
			isGitHubURL,
			willTakeMainFlow: !hasNegation && !isClarification && !isGitHubURL
		});

		if (hasNegation) {
			// Use chatWithJargon for all questions, including negations
			const graphChatId = createdChatId || chatId;
			const botMessageId = uuidv4(); // Generate bot message ID for graph generation
			
			const graphRAGResponse = await chatWithJargon({
				message: userMessage.message,
				agentPersonality: selectedAgentMode,
				messageId: botMessageId, // Pass message ID for graph generation
				chatId: graphChatId // Pass chat ID for graph generation
			});

			// Graph generation is now manual only - triggered by graph icon click
			console.log("📝 [Frontend] Graph generation is manual only:", {
				status: graphRAGResponse.graphGenerationStatus,
				note: "Click graph icon to generate visualization"
			});

				const botMessage: Message = {
				id: botMessageId, // Use the same ID that was passed to the API for graph generation
				message: graphRAGResponse.answer,
				sender: "ai",
				reasoningTrace: graphRAGResponse.reasoningTrace,
				jargons: graphRAGResponse.jargons,
				cveDescriptionsMap: graphRAGResponse.cveDescriptionsMap,
				sourceLinks: graphRAGResponse.sourceLinks || [],
					...(graphRAGResponse.dynamicTag ? { tags: [graphRAGResponse.dynamicTag] as any } : {}),
				durationSec: thinkingStartRef.current ? (Date.now() - thinkingStartRef.current) / 1000 : undefined,
			};
			// Reset start ref after computing
			thinkingStartRef.current = null;

			// Add messages to UI
			setMessages((prev) => [...prev, botMessage]);
			
			// Generate related questions immediately after adding bot message
			console.log('[Related Questions] 🚀 Triggering immediate generation after bot message added');
			const userQuestion = userMessage.message;
			getRelatedQuestions(
				userQuestion,
				botMessage.message,
				botMessage.reasoningTrace ? JSON.stringify(botMessage.reasoningTrace) : '',
				[...messages, userMessage, botMessage]
			).then(generatedQuestions => {
				if (generatedQuestions && generatedQuestions.length > 0) {
					console.log('[Related Questions] ✅ Successfully generated questions immediately:', generatedQuestions);
					setRelatedQuestions(prev => ({
						...prev,
						[String(botMessage.id)]: generatedQuestions
					}));
				}
			}).catch(error => {
				console.error('[Related Questions] ❌ Failed to generate questions immediately:', error);
			});

			// Save messages to database with graph visualization
			if (!chatId && !createdChatId) {
				await processManualMessages(userMessage, botMessage);
			} else {
				await saveChatMessage({
					chatId: chatId
						? (chatId as Id<"chats">)
						: (createdChatId as Id<"chats">),
					humanInTheLoopId: userMessage.id,
					sender: userMessage.sender,
					message: userMessage.message,
				});

				// Save AI response with enhanced data including graph visualization
				try {
					console.log("📊 [Frontend] Preparing to save negation chat message with graph visualization:", {
						messageId: botMessage.id,
						chatId: graphChatId,
						hasGraphData: !!graphRAGResponse.graphData,
						graphDataKeys: graphRAGResponse.graphData ? Object.keys(graphRAGResponse.graphData) : 'No graph data'
					});

					// Prepare enhanced data for AI response
					const jargonsObject = graphRAGResponse.jargons ? 
						graphRAGResponse.jargons.reduce((acc: Record<string, string>, jargon: { term: string; description: string }) => {
							acc[jargon.term] = jargon.description;
							return acc;
						}, {}) : {};
					
					// Extract reasoning string
					let reasoningString: string | undefined = undefined;
					if (typeof graphRAGResponse.trace === 'string') {
						reasoningString = graphRAGResponse.trace;
					} else if (Array.isArray(graphRAGResponse.trace) && graphRAGResponse.trace[0]?.narrative) {
						reasoningString = graphRAGResponse.trace[0].narrative;
					} else if (graphRAGResponse.trace && typeof graphRAGResponse.trace.narrative === 'string') {
						reasoningString = graphRAGResponse.trace.narrative;
					}

					// Convert graph data to schema-compliant format
					console.log("🔍 [Frontend] Debug - graphRAGResponse.graphData:", {
						hasGraphData: !!graphRAGResponse.graphData,
						graphDataKeys: graphRAGResponse.graphData ? Object.keys(graphRAGResponse.graphData) : 'No graph data',
						graphDataType: typeof graphRAGResponse.graphData,
						graphDataPreview: graphRAGResponse.graphData ? JSON.stringify(graphRAGResponse.graphData).substring(0, 200) + '...' : 'No data'
					});

					const convertedGraphVisualization = graphRAGResponse.graphData ? 
						convertGraphDataToGraphVisualization(graphRAGResponse.graphData) : null;

					console.log("🔍 [Frontend] Debug - convertedGraphVisualization:", {
						hasConvertedData: !!convertedGraphVisualization,
						convertedKeys: convertedGraphVisualization ? Object.keys(convertedGraphVisualization) : 'No converted data',
						convertedPreview: convertedGraphVisualization ? JSON.stringify(convertedGraphVisualization).substring(0, 200) + '...' : 'No converted data'
					});

					const enhancedDataWithGraph = {
						humanInTheLoopId: botMessage.id,
						chatId: graphChatId as Id<"chats">,
						sender: botMessage.sender,
						message: botMessage.message,
						Answer: graphRAGResponse.answer,
						Reasoning: reasoningString,
						Sources: [],
						SourceLinks: graphRAGResponse.sourceLinks || [],
						Jargons: jargonsObject,
						Info: undefined,
						Severity: "Medium",
						tags: [graphRAGResponse.dynamicTag || "cybersecurity_general"],
						graphVisualization: convertedGraphVisualization // Use converted graph data
					};

					console.log("💾 [Frontend] Saving negation chat message with graph visualization to database...");
					await saveEnhancedChatMessage(enhancedDataWithGraph);
					console.log("✅ [Frontend] Negation chat message with graph visualization saved successfully");
				} catch (saveError) {
					console.error('Failed to save negation AI response with graph data:', saveError);
					// Fallback to basic save
					await saveChatMessage({
						chatId: chatId
							? (chatId as Id<"chats">)
							: (createdChatId as Id<"chats">),
						humanInTheLoopId: botMessage.id,
						sender: botMessage.sender,
						message: botMessage.message,
					});
				}
			}

			stopLoading(setIsLoading, setAgentButtonsDisabled, loadingIntervalRef, setLoadingMessage);
		} else if (isClarification) {
			// Route clarification to main flow for enhanced processing
			console.log('🔄 CLARIFICATION ROUTED TO MAIN FLOW');
			// Use the same logic as main flow
			try {
				console.log('🚀 ENTERING CLARIFICATION WITH ENHANCED FLOW');
				console.log('UserMessage:', userMessage);
				setIsLoading(true);
				
				// User message is already added earlier, no need to add again
				
				// Use chatWithJargon for clarifications with agent personality
				console.log('Sending clarification request with agent personality:', selectedAgentMode);
				const graphChatId = createdChatId || chatId;
				const botMessageId = uuidv4(); // Generate bot message ID for graph generation
				
				const response = await chatWithJargon({ 
					message: userMessage.message,
					agentPersonality: selectedAgentMode,
					messageId: botMessageId, // Pass message ID for graph generation
					chatId: graphChatId // Pass chat ID for graph generation
				});

				// Graph generation is now manual only - triggered by graph icon click
				console.log("📝 [Frontend] Graph generation is manual only (clarification):", {
					status: response.graphGenerationStatus,
					note: "Click graph icon to generate visualization"
				});
				
				// Validate response structure
				if (!response.answer) {
					console.error('ERROR: No answer in response!');
					throw new Error('Backend response missing answer field');
				}
				// Test if saveEnhancedChatMessage function exists
				console.log('saveEnhancedChatMessage function:', typeof saveEnhancedChatMessage);
				
				const botMessage: Message = {
					id: botMessageId, // Use the same ID that was passed to the API for graph generation
					message: response.answer,
					sender: 'ai',
					reasoningTrace: response.reasoningTrace,
					jargons: response.jargons,
					cveDescriptionsMap: response.cveDescriptionsMap,
					sourceLinks: response.sourceLinks || [],
					...(response.dynamicTags ? { tags: response.dynamicTags as any } : {}),
					durationSec: thinkingStartRef.current ? (Date.now() - thinkingStartRef.current) / 1000 : undefined,
				};
				thinkingStartRef.current = null;
				
				// Save AI response to database (same logic as main flow)
				const currentChatId = createdChatId || chatId;
				console.log('Debug - Chat IDs:', { createdChatId, chatId, currentChatId });
				console.log('Will save to database:', !!currentChatId, 'or create new chat:', !currentChatId);
				
				if (currentChatId) {
					try {
						console.log('Saving AI response to database with chatId:', currentChatId);
						
						// Prepare enhanced data for AI response
						const jargonsObject = response.jargons ? 
							response.jargons.reduce((acc: Record<string, string>, jargon: { term: string; description: string }) => {
								acc[jargon.term] = jargon.description;
								return acc;
							}, {}) : {};
						
						// Always extract the summary narrative as a string for Reasoning
						let reasoningString: string | undefined = undefined;
						if (typeof response.trace === 'string') {
							reasoningString = response.trace;
						} else if (Array.isArray(response.trace) && response.trace[0]?.narrative) {
							reasoningString = response.trace[0].narrative;
						} else if (response.trace && typeof response.trace.narrative === 'string') {
							reasoningString = response.trace.narrative;
						}
						
						// Enhanced Info field population with context data
						const cveIds = Object.keys(response.cveDescriptionsMap || {});
						const contextCveIds = response.contextData?.cveIds || [];
						const allCveIds = [...cveIds, ...contextCveIds.filter((id: string) => !cveIds.includes(id))];
						
						const mainCveId = allCveIds.length > 0 ? allCveIds[0] : undefined;
						const mainCveDesc = mainCveId ? (
							response.cveDescriptionsMap?.[mainCveId] || 
							response.contextData?.cveDescriptions?.[0] ||
							"CVE description not available"
						) : undefined;
						
						// Get mitigation from context data
						const mitigation = response.contextData?.mitigations?.[0] || "Apply security patches and follow vendor recommendations";
						
						const sources = response.reasoningTrace && Array.isArray(response.reasoningTrace)
							? response.reasoningTrace.map((step: { step: string; message: string }) => step.step).filter(Boolean)
							: [];
						
						console.log('Prepared enhanced data:', {
							jargonsObject,
							reasoningString,
							sourceLinks: response.sourceLinks,
							cveInfo: mainCveId ? { cve_id: mainCveId, cve_desc: mainCveDesc, mitigation } : response.contextData ? {
								concept: response.contextData.concept,
								risk_level: response.contextData.riskLevels?.[0],
								mitigation: mitigation
							} : undefined,
							contextData: response.contextData,
							sources,
							jargonsCount: Object.keys(jargonsObject).length
						});
						
						// Use enhanced save for AI response with all the extra fields
						const enhancedData = {
							humanInTheLoopId: botMessage.id || uuidv4(),
							chatId: currentChatId as Id<"chats">,
							sender: botMessage.sender,
							message: botMessage.message,
							Answer: response.answer,
							Reasoning: reasoningString, // Always a string summary
							Sources: sources,
							SourceLinks: response.sourceLinks || [],
							Jargons: jargonsObject,
							Info: mainCveId ? {
								cve_id: mainCveId,
								cve_desc: mainCveDesc,
								mitigation: mitigation
							} : (response.contextData && (response.contextData.concept || response.contextData.riskLevels?.[0])) ? {
								cve_id: response.contextData.concept || "General Security Topic",
								cve_desc: `Risk Level: ${response.contextData.riskLevels?.[0] || "Unknown"}. Topic: ${response.contextData.concept || "Security analysis"}`,
								mitigation: mitigation
							} : undefined,
							Severity: "Medium",
							tags: response.dynamicTags || ["cybersecurity_general"]
						};
						
						console.log('About to save with data:', enhancedData);
						console.log('Tag being saved to database:', enhancedData.tags);
						
						// Include graph visualization data if available from the response
						console.log("📊 [Frontend] Preparing to save clarification chat message with graph visualization:", {
							messageId: botMessage.id,
							chatId: currentChatId,
							hasGraphData: !!response.graphData,
							graphDataKeys: response.graphData ? Object.keys(response.graphData) : 'No graph data'
						});

						// Convert graph data to schema-compliant format
						console.log("🔍 [Frontend] Debug - response.graphData (clarification):", {
							hasGraphData: !!response.graphData,
							graphDataKeys: response.graphData ? Object.keys(response.graphData) : 'No graph data',
							graphDataType: typeof response.graphData,
							graphDataPreview: response.graphData ? JSON.stringify(response.graphData).substring(0, 200) + '...' : 'No data'
						});

						const convertedGraphVisualization = response.graphData ? 
							convertGraphDataToGraphVisualization(response.graphData) : null;

						console.log("🔍 [Frontend] Debug - convertedGraphVisualization (clarification):", {
							hasConvertedData: !!convertedGraphVisualization,
							convertedKeys: convertedGraphVisualization ? Object.keys(convertedGraphVisualization) : 'No converted data',
							convertedPreview: convertedGraphVisualization ? JSON.stringify(convertedGraphVisualization).substring(0, 200) + '...' : 'No converted data'
						});

						const enhancedDataWithGraph = {
							...enhancedData,
							graphVisualization: convertedGraphVisualization // Use converted graph data
						};
						
						console.log("💾 [Frontend] Saving clarification chat message with graph visualization to database...");
						await saveEnhancedChatMessage(enhancedDataWithGraph);
						console.log("✅ [Frontend] Clarification chat message with graph visualization saved successfully");
						console.log('AI response saved successfully with enhanced data');
					} catch (saveError) {
						console.error('Failed to save AI response with enhanced data:', saveError);
						console.error('Save error details:', saveError);
						console.error('Enhanced data that failed to save:', {
							humanInTheLoopId: botMessage.id || uuidv4(),
							chatId: currentChatId,
							sender: botMessage.sender,
							message: botMessage.message,
							Answer: response.answer,
							hasSourceLinks: !!(response.sourceLinks && response.sourceLinks.length > 0),
							hasJargons: !!(response.jargons && response.jargons.length > 0),
							hasDynamicTag: !!response.dynamicTags,
							hasContextData: !!response.contextData
						});
						
						// Fallback: try saving with basic saveChatMessage
						try {
							console.log('Attempting fallback save with basic saveChatMessage...');
							await saveChatMessage({
								humanInTheLoopId: botMessage.id || uuidv4(),
								chatId: currentChatId as Id<"chats">,
								sender: botMessage.sender,
								message: botMessage.message,
							});
							console.log('Fallback save successful');
						} catch (fallbackError) {
							console.error('Fallback save also failed:', fallbackError);
						}
					}
				} else {
					console.log('No chatId available, creating new chat first...');
					console.log('User ID for new chat:', user?.id);
					
					// Try to create a new chat if none exists
					try {
						console.log('Creating new chat with default title...');
						const chatTitle = await generateTitle(userMessage.message || response.answer);
						const newChatResult = await saveChat({
							userId: String(user?.id || "anonymous"),
							title: chatTitle,
						});
						setCreatedChatId(newChatResult);
						console.log('New chat created with ID:', newChatResult);
						
						// Now save the user message (if not already saved)
						await saveChatMessage({
							humanInTheLoopId: userMessage.id || uuidv4(),
							chatId: newChatResult as Id<"chats">,
							sender: userMessage.sender,
							message: userMessage.message,
						});
						console.log('User message saved to new chat');
						
						// Save the AI response with enhanced data
						const jargonsObject = response.jargons ? 
							response.jargons.reduce((acc: Record<string, string>, jargon: { term: string; description: string }) => {
								acc[jargon.term] = jargon.description;
								return acc;
							}, {}) : {};
						
						// Always extract the summary narrative as a string for Reasoning
						let reasoningString: string | undefined = undefined;
						if (typeof response.trace === 'string') {
							reasoningString = response.trace;
						} else if (Array.isArray(response.trace) && response.trace[0]?.narrative) {
							reasoningString = response.trace[0].narrative;
						} else if (response.trace && typeof response.trace.narrative === 'string') {
							reasoningString = response.trace.narrative;
						}
						
						// Enhanced Info field population with context data (for new chat)
						const cveIds = Object.keys(response.cveDescriptionsMap || {});
						const contextCveIds = response.contextData?.cveIds || [];
						const allCveIds = [...cveIds, ...contextCveIds.filter((id: string) => !cveIds.includes(id))];
						
						const mainCveId = allCveIds.length > 0 ? allCveIds[0] : undefined;
						const mainCveDesc = mainCveId ? (
							response.cveDescriptionsMap?.[mainCveId] || 
							response.contextData?.cveDescriptions?.[0] ||
							"CVE description not available"
						) : undefined;
						
						// Get mitigation from context data
						const mitigation = response.contextData?.mitigations?.[0] || "Apply security patches and follow vendor recommendations";
						
						const sources = response.reasoningTrace && Array.isArray(response.reasoningTrace)
							? response.reasoningTrace.map((step: { step: string; message: string }) => step.step).filter(Boolean)
							: [];
						
						await saveEnhancedChatMessage({
							humanInTheLoopId: botMessage.id || uuidv4(),
							chatId: newChatResult as Id<"chats">,
							sender: botMessage.sender,
							message: botMessage.message,
							Answer: response.answer,
							Reasoning: reasoningString, // Always a string summary
							Sources: sources,
							SourceLinks: response.sourceLinks || [],
							Jargons: jargonsObject,
							Info: mainCveId ? {
								cve_id: mainCveId,
								cve_desc: mainCveDesc,
								mitigation: mitigation
							} : (response.contextData && (response.contextData.concept || response.contextData.riskLevels?.[0])) ? {
								cve_id: response.contextData.concept || "General Security Topic",
								cve_desc: `Risk Level: ${response.contextData.riskLevels?.[0] || "Unknown"}. Topic: ${response.contextData.concept || "Security analysis"}`,
								mitigation: mitigation
							} : undefined,
							Severity: "Medium",
							tags: response.dynamicTags || ["cybersecurity_general"]
						});
						console.log('AI response saved to new chat with enhanced data');
						
						// Update URL
						window.history.pushState(
							{ path: `/chatbot/${newChatResult}` },
							"",
							`/chatbot/${newChatResult}`,
						);
					} catch (chatCreateError) {
						console.error('Failed to create new chat:', chatCreateError);
					}
				}
				
				console.log('Adding botMessage to UI with jargons:', {
					hasJargons: !!botMessage.jargons,
					jargonsCount: botMessage.jargons?.length || 0,
					jargons: botMessage.jargons,
					hasSourceLinks: !!botMessage.sourceLinks,
					sourceLinksCount: botMessage.sourceLinks?.length || 0
				});
				
				// Add bot message to UI for clarification flow
				setMessages((prev) => {
					console.log('Previous messages count:', prev.length);
					const newMessages = [...prev, botMessage];
					console.log('New messages count:', newMessages.length);
					return newMessages;
				});
				
				// Generate related questions immediately after adding bot message in clarification flow
				console.log('[Related Questions] 🚀 Triggering immediate generation after clarification bot message added');
				const userQuestion = userMessage.message;
				getRelatedQuestions(
					userQuestion,
					botMessage.message,
					botMessage.reasoningTrace ? JSON.stringify(botMessage.reasoningTrace) : '',
					[...messages, userMessage, botMessage]
				).then(generatedQuestions => {
					if (generatedQuestions && generatedQuestions.length > 0) {
						console.log('[Related Questions] ✅ Successfully generated questions immediately (clarification):', generatedQuestions);
						setRelatedQuestions(prev => ({
							...prev,
							[String(botMessage.id)]: generatedQuestions
						}));
					}
				}).catch(error => {
					console.error('[Related Questions] ❌ Failed to generate questions immediately (clarification):', error);
				});
				
				// Stop loading state
				stopLoading(setIsLoading, setAgentButtonsDisabled, loadingIntervalRef, setLoadingMessage);
				console.log('Loading state stopped');
			} catch (error) {
				stopLoading(setIsLoading, setAgentButtonsDisabled, loadingIntervalRef, setLoadingMessage);
				showErrorToast('Failed to get answer.');
			}
		} else if (isGitHubURL) {
			stopLoading(setIsLoading, setAgentButtonsDisabled, loadingIntervalRef, setLoadingMessage);
			const urls = extractURLs(userMessage.message);
			setTargetUrl(urls[0]);
			const manualMessage =
				"Thank you for providing the URL. Please select type of repository.";
			const botMessage: Message = {
				id: uuidv4(),
				message: manualMessage,
				sender: "ai",
			};

			if (!chatId && !createdChatId) {
				processManualMessages(userMessage, botMessage);
			} else {
				await saveChatMessage({
					chatId: chatId
						? (chatId as Id<"chats">)
						: (createdChatId as Id<"chats">),
					humanInTheLoopId: botMessage.id,
					sender: botMessage.sender,
					message: botMessage.message,
				});
			}
			setPendingAction(botMessage.id as string);
			setRequestHumanInLoop({
				action: "github-scan",
				prompt: manualMessage,
				type: "none",
				id: botMessage.id,
			});
			requestHumanApproval("github-scan", manualMessage, "none", botMessage.id);
		} else {
			try {
				console.log('🚀 ENTERING MAIN CHAT FLOW');
				console.log("🚀 [Frontend] MAIN CHAT FLOW STARTED - This should appear for every message!");
				console.log('UserMessage:', userMessage);
				setIsLoading(true);
				
				// Add user message to UI first
				setMessages((prev) => [...prev, userMessage]);
				
				// Use chatWithJargon for the main chat flow with agent personality and automatic graph generation
				console.log('Sending request with agent personality:', selectedAgentMode);
				
				// Create a new chat if none exists, so we have a chatId for graph generation
				let graphChatId = createdChatId || chatId;
				console.log('🔄 [Frontend] Initial chatId check:', {
					createdChatId,
					chatId,
					graphChatId,
					hasCreatedChatId: !!createdChatId,
					hasChatId: !!chatId,
					hasGraphChatId: !!graphChatId
				});
				
				if (!graphChatId) {
					console.log('🔄 [Frontend] No chatId available, creating new chat first...');
					try {
						const chatTitle = await generateTitle(userMessage.message);
						console.log('Generated title:', chatTitle);
						const newChatResult = await saveChat({
							userId: String(user?.id || "anonymous"),
							title: chatTitle,
							tags: ["cybersecurity_general"], // Default tag
						});
						setCreatedChatId(newChatResult);
						graphChatId = newChatResult;
						console.log('✅ [Frontend] New chat created with ID:', newChatResult);
						
						// Save the user message to the new chat
						await saveChatMessage({
							humanInTheLoopId: userMessage.id || uuidv4(),
							chatId: newChatResult as Id<"chats">,
							sender: userMessage.sender,
							message: userMessage.message,
						});
						console.log('✅ [Frontend] User message saved to new chat');
					} catch (error) {
						console.error('❌ [Frontend] Failed to create new chat:', error);
						// Continue without chatId if creation fails
					}
				}
				
				// Final validation - ensure we have a chatId
				if (!graphChatId) {
					console.error('❌ [Frontend] CRITICAL: No chatId available after all attempts!');
					throw new Error('Failed to create or obtain chatId for graph generation');
				}
				
				console.log('✅ [Frontend] Final chatId validation:', {
					graphChatId,
					graphChatIdType: typeof graphChatId,
					hasGraphChatId: !!graphChatId
				});
				
				const botMessageId = uuidv4(); // Generate bot message ID for graph generation
				
				console.log('🔄 [Frontend] Sending request to backend with graph generation params:', {
					message: userMessage.message.substring(0, 50) + '...',
					agentPersonality: selectedAgentMode,
					messageId: botMessageId,
					chatId: graphChatId,
					hasMessageId: !!botMessageId,
					hasChatId: !!graphChatId
				});

				// Final validation before API call
				if (!graphChatId) {
					console.error('❌ [Frontend] CRITICAL: chatId is undefined before API call!');
					throw new Error('chatId is required for graph generation');
				}

				const response = await chatWithJargon({ 
					message: userMessage.message,
					agentPersonality: selectedAgentMode,
					messageId: botMessageId, // Pass message ID for graph generation
					chatId: graphChatId // Pass chat ID for graph generation
				});

				// Graph generation is now manual only - triggered by graph icon click
				console.log("📝 [Frontend] Graph generation is manual only (main flow):", {
					status: response.graphGenerationStatus,
					note: "Click graph icon to generate visualization"
				});

				console.log('Backend response received:', {
					hasAnswer: !!response.answer,
					answerLength: response.answer?.length,
					hasJargons: !!response.jargons,
					jargonsCount: response.jargons?.length || 0,
					hasCveDescriptionsMap: !!response.cveDescriptionsMap,
					hasSourceLinks: !!response.sourceLinks,
					hasReasoningTrace: !!response.reasoningTrace,
					hasGraphData: !!response.graphData,
					graphDataKeys: response.graphData ? Object.keys(response.graphData) : 'No graph data',
					responseKeys: Object.keys(response)
				});
				console.log('Full backend response:', response);
				console.log('Response answer field:', response.answer);
				console.log('Response answer type:', typeof response.answer);
				
				// Validate response structure
				if (!response.answer) {
					console.error('ERROR: No answer in response!');
					throw new Error('Backend response missing answer field');
				}
				
				if (typeof response.answer !== 'string' || response.answer.trim() === '') {
					console.error('ERROR: Answer is empty or not a string!');
					throw new Error('Backend response has empty answer field');
				}
				console.log('Dynamic tag validation:', {
					exists: !!response.dynamicTags,
					value: response.dynamicTags,
					type: typeof response.dynamicTags,
					fallback: response.dynamicTags || "cybersecurity_general"
				});
				console.log('Context data from backend:', response.contextData);
				
				// Test if saveEnhancedChatMessage function exists
				console.log('saveEnhancedChatMessage function:', typeof saveEnhancedChatMessage);
				
				console.log('Creating botMessage with response data:', {
					hasJargons: !!(response.jargons && response.jargons.length > 0),
					jargonsCount: response.jargons?.length || 0,
					hasSourceLinks: !!(response.sourceLinks && response.sourceLinks.length > 0),
					sourceLinksCount: response.sourceLinks?.length || 0
				});
				
				const getReasoningString = (trace: any, fallback: any) => {
					console.log('[Reasoning] Processing reasoning trace:', {
						traceType: typeof trace,
						traceIsArray: Array.isArray(trace),
						traceLength: Array.isArray(trace) ? trace.length : 'N/A',
						fallbackType: typeof fallback,
						fallbackIsArray: Array.isArray(fallback),
						fallbackLength: Array.isArray(fallback) ? fallback.length : 'N/A'
					});
					
					if (typeof trace === 'string') {
						console.log('[Reasoning] Using trace as string:', trace.substring(0, 100) + '...');
						return trace;
					}
					if (Array.isArray(trace) && trace[0]?.narrative) {
						console.log('[Reasoning] Using trace[0].narrative:', trace[0].narrative.substring(0, 100) + '...');
						return trace[0].narrative;
					}
					if (trace && typeof trace.narrative === 'string') {
						console.log('[Reasoning] Using trace.narrative:', trace.narrative.substring(0, 100) + '...');
						return trace.narrative;
					}
					
					// Try fallback
					if (typeof fallback === 'string') {
						console.log('[Reasoning] Using fallback as string:', fallback.substring(0, 100) + '...');
						return fallback;
					}
					if (Array.isArray(fallback) && fallback[0]?.narrative) {
						console.log('[Reasoning] Using fallback[0].narrative:', fallback[0].narrative.substring(0, 100) + '...');
						return fallback[0].narrative;
					}
					if (fallback && typeof fallback.narrative === 'string') {
						console.log('[Reasoning] Using fallback.narrative:', fallback.narrative.substring(0, 100) + '...');
						return fallback.narrative;
					}
					
					console.log('[Reasoning] No valid reasoning trace found, returning empty string');
					return '';
				};
				
				// Create proper reasoning trace structure for frontend display
				const createReasoningTrace = (trace: any, fallback: any): any[] | undefined => {
					// If we have a proper trace array, use it
					if (Array.isArray(trace) && trace.length > 0) {
						return trace;
					}
					
					// If we have a fallback array, use it
					if (Array.isArray(fallback) && fallback.length > 0) {
						return fallback;
					}
					
					// If we have a string, create a simple array structure
					const reasoningString = getReasoningString(trace, fallback);
					if (reasoningString) {
						return [
							{
								narrative: reasoningString
							},
							{
								step: "Step1",
								message: "Context retrieved from knowledge graph."
							},
							{
								step: "Step2", 
								message: "Comprehensive analysis completed."
							},
							{
								step: "Step3",
								message: "Response generated using LLM with context."
							}
						];
					}
					
					return undefined;
				};

				const reasoningTrace = createReasoningTrace(response.trace, response.reasoningTrace);
				
				console.log('[Reasoning] Created reasoning trace for bot message:', {
					messageId: uuidv4(),
					hasReasoningTrace: !!reasoningTrace,
					reasoningType: typeof reasoningTrace,
					isArray: Array.isArray(reasoningTrace),
					reasoningLength: Array.isArray(reasoningTrace) ? reasoningTrace.length : 'N/A',
					reasoningContent: Array.isArray(reasoningTrace) ? reasoningTrace[0]?.narrative?.substring(0, 100) + '...' : 'N/A'
				});
				
				const botMessage: Message = {
					id: botMessageId, // Use the same ID that was passed to the API for graph generation
					message: response.answer,
					sender: 'ai',
					reasoningTrace: reasoningTrace,
					jargons: response.jargons,
					cveDescriptionsMap: response.cveDescriptionsMap,
					sourceLinks: response.sourceLinks || [],
					// include tag for UI (single dynamicTag or array from history)
					// backend saves tags array; for immediate UI, include the dynamicTag
					...(response.dynamicTags ? { tags: response.dynamicTags as any } : {}),
					durationSec: thinkingStartRef.current ? (Date.now() - thinkingStartRef.current) / 1000 : undefined,
				};
				thinkingStartRef.current = null;
				
				// Validate bot message was created correctly
				if (!botMessage.message || botMessage.message.trim() === '') {
					console.error('ERROR: Bot message is empty after creation!');
					throw new Error('Bot message creation failed - empty message');
				}
				
				console.log('Created botMessage:', {
					id: botMessage.id,
					messageLength: botMessage.message?.length,
					hasJargons: !!(botMessage.jargons && botMessage.jargons.length > 0),
					jargonsCount: botMessage.jargons?.length || 0,
					hasSourceLinks: !!(botMessage.sourceLinks && botMessage.sourceLinks.length > 0),
					sourceLinksCount: botMessage.sourceLinks?.length || 0,
					hasReasoningTrace: !!botMessage.reasoningTrace
				});
				
				// 🚀 IMMEDIATELY add bot message to UI for instant display
				console.log('🚀 [Frontend] IMMEDIATELY adding bot message to UI for instant display');
				setMessages((prev) => {
					console.log('Previous messages count:', prev.length);
					const newMessages = [...prev, botMessage];
					console.log('New messages count:', newMessages.length);
					return newMessages;
				});
				
				// Generate related questions immediately after adding bot message in main flow
				console.log('[Related Questions] 🚀 Triggering immediate generation after main flow bot message added');
				const userQuestion = userMessage.message;
				getRelatedQuestions(
					userQuestion,
					botMessage.message,
					botMessage.reasoningTrace ? JSON.stringify(botMessage.reasoningTrace) : '',
					[...messages, userMessage, botMessage]
				).then(generatedQuestions => {
					if (generatedQuestions && generatedQuestions.length > 0) {
						console.log('[Related Questions] ✅ Successfully generated questions immediately (main flow):', generatedQuestions);
						setRelatedQuestions(prev => ({
							...prev,
							[String(botMessage.id)]: generatedQuestions
						}));
					}
				}).catch(error => {
					console.error('[Related Questions] ❌ Failed to generate questions immediately (main flow):', error);
				});
				
				// Stop loading state immediately so user sees the response
				stopLoading(setIsLoading, setAgentButtonsDisabled, loadingIntervalRef, setLoadingMessage);
				console.log('✅ [Frontend] UI updated immediately - user can now see the response');
				
				// Save AI response to database - use the same graphChatId that was used for the API call
				const currentChatId = graphChatId; // Use the same chatId that was validated and used for the API call
				console.log('Debug - Chat IDs:', { 
					createdChatId, 
					chatId, 
					graphChatId,
					currentChatId,
					usingGraphChatId: currentChatId === graphChatId
				});
				console.log('Will save to database:', !!currentChatId, 'or create new chat:', !currentChatId);
				
				if (currentChatId) {
					try {
						console.log('Saving AI response to database with chatId:', currentChatId);
						
						// Prepare enhanced data for AI response
						const jargonsObject = response.jargons ? 
							response.jargons.reduce((acc: Record<string, string>, jargon: { term: string; description: string }) => {
								acc[jargon.term] = jargon.description;
								return acc;
							}, {}) : {};
						
						// Always extract the summary narrative as a string for Reasoning
						let reasoningString: string | undefined = undefined;
						if (typeof response.trace === 'string') {
							reasoningString = response.trace;
						} else if (Array.isArray(response.trace) && response.trace[0]?.narrative) {
							reasoningString = response.trace[0].narrative;
						} else if (response.trace && typeof response.trace.narrative === 'string') {
							reasoningString = response.trace.narrative;
						}
						
						// Enhanced Info field population with context data
						const cveIds = Object.keys(response.cveDescriptionsMap || {});
						const contextCveIds = response.contextData?.cveIds || [];
						const allCveIds = [...cveIds, ...contextCveIds.filter((id: string) => !cveIds.includes(id))];
						
						const mainCveId = allCveIds.length > 0 ? allCveIds[0] : undefined;
						const mainCveDesc = mainCveId ? (
							response.cveDescriptionsMap?.[mainCveId] || 
							response.contextData?.cveDescriptions?.[0] ||
							"CVE description not available"
						) : undefined;
						
						// Get mitigation from context data
						const mitigation = response.contextData?.mitigations?.[0] || "Apply security patches and follow vendor recommendations";
						
						const sources = response.reasoningTrace && Array.isArray(response.reasoningTrace)
							? response.reasoningTrace.map((step: { step: string; message: string }) => step.step).filter(Boolean)
							: [];
						
						console.log('Prepared enhanced data:', {
							jargonsObject,
							reasoningString,
							sourceLinks: response.sourceLinks,
							cveInfo: mainCveId ? { cve_id: mainCveId, cve_desc: mainCveDesc, mitigation } : response.contextData ? {
								concept: response.contextData.concept,
								risk_level: response.contextData.riskLevels?.[0],
								mitigation: mitigation
							} : undefined,
							contextData: response.contextData,
							sources,
							jargonsCount: Object.keys(jargonsObject).length
						});
						
						// Use enhanced save for AI response with all the extra fields
						const enhancedData = {
							humanInTheLoopId: botMessage.id || uuidv4(),
							chatId: currentChatId as Id<"chats">,
							sender: botMessage.sender,
							message: botMessage.message,
							Answer: response.answer,
							Reasoning: reasoningString, // Always a string summary
							Sources: sources,
							SourceLinks: response.sourceLinks || [],
							Jargons: jargonsObject,
							Info: mainCveId ? {
								cve_id: mainCveId,
								cve_desc: mainCveDesc,
								mitigation: mitigation
							} : (response.contextData && (response.contextData.concept || response.contextData.riskLevels?.[0])) ? {
								cve_id: response.contextData.concept || "General Security Topic",
								cve_desc: `Risk Level: ${response.contextData.riskLevels?.[0] || "Unknown"}. Topic: ${response.contextData.concept || "Security analysis"}`,
								mitigation: mitigation
							} : undefined,
							Severity: "Medium",
							tags: response.dynamicTags || ["cybersecurity_general"]
						};
						
						console.log('About to save with data:', enhancedData);
						console.log('Tag being saved to database:', enhancedData.tags);
						
						// Include graph visualization data if available from the response
						console.log("📊 [Frontend] Preparing to save chat message with graph visualization:", {
							messageId: botMessage.id,
							chatId: currentChatId,
							hasGraphData: !!response.graphData,
							graphDataKeys: response.graphData ? Object.keys(response.graphData) : 'No graph data'
						});

						// Convert graph data to schema-compliant format
						console.log("🔍 [Frontend] Debug - response.graphData (main flow):", {
							hasGraphData: !!response.graphData,
							graphDataKeys: response.graphData ? Object.keys(response.graphData) : 'No graph data',
							graphDataType: typeof response.graphData,
							graphDataPreview: response.graphData ? JSON.stringify(response.graphData).substring(0, 200) + '...' : 'No data'
						});

						const convertedGraphVisualization = response.graphData ? 
							convertGraphDataToGraphVisualization(response.graphData) : null;

						console.log("🔍 [Frontend] Debug - convertedGraphVisualization (main flow):", {
							hasConvertedData: !!convertedGraphVisualization,
							convertedKeys: convertedGraphVisualization ? Object.keys(convertedGraphVisualization) : 'No converted data',
							convertedPreview: convertedGraphVisualization ? JSON.stringify(convertedGraphVisualization).substring(0, 200) + '...' : 'No converted data'
						});

						// Sanitize data to remove invalid characters for Convex while preserving markdown formatting
						const sanitizeString = (str: string | undefined): string => {
							if (!str) return '';
							return str
								.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters but preserve \n and \t
								.replace(/\r/g, '') // Remove carriage returns
								.trim();
						};

						const sanitizedEnhancedData = {
							...enhancedData,
							message: sanitizeString(enhancedData.message),
							Answer: sanitizeString(enhancedData.Answer),
							Reasoning: sanitizeString(enhancedData.Reasoning),
							Info: enhancedData.Info ? {
								...enhancedData.Info,
								cve_id: sanitizeString(enhancedData.Info.cve_id),
								cve_desc: sanitizeString(enhancedData.Info.cve_desc),
								mitigation: sanitizeString(enhancedData.Info.mitigation)
							} : undefined
						};

						const enhancedDataWithGraph = {
							...sanitizedEnhancedData,
							graphVisualization: convertedGraphVisualization // Use converted graph data
						};
						
						console.log("💾 [Frontend] Saving enhanced chat message with graph visualization to database...");
						console.log("🔍 [Frontend] Enhanced data being saved:", JSON.stringify(enhancedDataWithGraph, null, 2));
						
						try {
							const saveResult = await saveEnhancedChatMessage(enhancedDataWithGraph);
							console.log("✅ [Frontend] Enhanced chat message with graph visualization saved successfully");
							console.log("🚀 [Frontend] GRAPH SAVE COMPLETED - TODO generation should start now!");
							console.log("📊 [Frontend] Save result:", saveResult);
						} catch (saveError) {
							console.error("❌ [Frontend] Failed to save enhanced chat message:", saveError);
							console.error("❌ [Frontend] Enhanced data that failed to save:", JSON.stringify(enhancedDataWithGraph, null, 2));
							
							// Try to save with minimal data as fallback
							const minimalData = {
								humanInTheLoopId: enhancedDataWithGraph.humanInTheLoopId,
								chatId: enhancedDataWithGraph.chatId,
								sender: enhancedDataWithGraph.sender,
								message: enhancedDataWithGraph.message.substring(0, 1000), // Truncate if too long
								Answer: enhancedDataWithGraph.Answer.substring(0, 1000), // Truncate if too long
								Reasoning: enhancedDataWithGraph.Reasoning.substring(0, 500), // Truncate if too long
								Sources: [],
								SourceLinks: [],
								Jargons: {},
								Info: undefined,
								Severity: "Medium",
								tags: ["cybersecurity_general"]
							};
							
							console.log("🔄 [Frontend] Attempting fallback save with minimal data...");
							await saveEnhancedChatMessage(minimalData);
							console.log("✅ [Frontend] Fallback save successful");
						}
						console.log('AI response saved successfully with enhanced data');
						console.log("🚀 [Frontend] ABOUT TO START TODO GENERATION - This should appear!");
						console.log("🔍 [Frontend] CHECKING IF WE REACH TODO GENERATION - This should appear!");
						
						// Generate TODO list after chat history is saved
						try {
							console.log("🚀 [Frontend] TODO GENERATION STARTED - This should appear!");
							console.log("🔍 [Frontend] ENTERED TODO GENERATION TRY BLOCK - This should appear!");
							console.log("🔄 [Frontend] Generating TODO list for saved chat message...");
							console.log("📊 [Frontend] TODO generation params:", {
								chatId: currentChatId,
								messageId: botMessage.id,
								aiResponseLength: response.answer?.length,
								hasKGContext: !!response.contextData,
								hasCveInfo: !!response.cveDescriptionsMap,
								hasReasoningTrace: !!response.reasoningTrace,
								hasSourceLinks: !!response.sourceLinks,
								hasJargons: !!response.jargons
							});
							
							console.log("🔍 [Frontend] TODO generation parameter validation:", {
								chatIdType: typeof currentChatId,
								messageIdType: typeof botMessage.id,
								chatIdValid: !!currentChatId,
								messageIdValid: !!botMessage.id,
								chatIdLength: currentChatId?.length || 0,
								messageIdLength: botMessage.id?.length || 0,
								chatIdValue: currentChatId,
								messageIdValue: botMessage.id,
							});
							console.log("🚨 [Frontend] CRITICAL DEBUG - botMessage object:", {
								id: botMessage.id,
								sender: botMessage.sender,
								message: botMessage.message?.substring(0, 100) + '...',
								hasId: !!botMessage.id,
								idType: typeof botMessage.id
						});
						
					// TODO lists are now generated on-demand when user clicks the TODO button
					console.log("✅ [Frontend] Chat message saved. TODO list will be generated when user clicks the TODO button.");
					} catch (saveError) {
						console.error('Failed to save AI response with enhanced data:', saveError);
						console.error('Save error details:', saveError);
						console.error('Enhanced data that failed to save:', {
							humanInTheLoopId: botMessage.id || uuidv4(),
							chatId: currentChatId,
							sender: botMessage.sender,
							message: botMessage.message,
							Answer: response.answer,
							hasSourceLinks: !!(response.sourceLinks && response.sourceLinks.length > 0),
							hasJargons: !!(response.jargons && response.jargons.length > 0),
							hasDynamicTag: !!response.dynamicTags,
							hasContextData: !!response.contextData
						});
						
						// Fallback: try saving with basic saveChatMessage
						try {
							console.log('Attempting fallback save with basic saveChatMessage...');
							await saveChatMessage({
								humanInTheLoopId: botMessage.id || uuidv4(),
								chatId: currentChatId as Id<"chats">,
								sender: botMessage.sender,
								message: botMessage.message,
							});
							console.log('Fallback save successful');
						} catch (fallbackError) {
							console.error('Fallback save also failed:', fallbackError);
						}
					}
				} catch (saveError) {
					console.error('Failed to save AI response with enhanced data:', saveError);
					console.error('Save error details:', saveError);
					console.error('Enhanced data that failed to save:', {
						humanInTheLoopId: botMessage.id || uuidv4(),
						chatId: currentChatId,
						sender: botMessage.sender,
						message: botMessage.message,
						Answer: response.answer,
						hasSourceLinks: !!(response.sourceLinks && response.sourceLinks.length > 0),
						hasJargons: !!(response.jargons && response.jargons.length > 0),
						hasDynamicTag: !!response.dynamicTags,
						hasContextData: !!response.contextData
					});
					
					// Fallback: try saving with basic saveChatMessage
					try {
						console.log('Attempting fallback save with basic saveChatMessage...');
						await saveChatMessage({
							humanInTheLoopId: botMessage.id || uuidv4(),
							chatId: currentChatId as Id<"chats">,
							sender: botMessage.sender,
							message: botMessage.message,
						});
						console.log('Fallback save successful');
					} catch (fallbackError) {
						console.error('Fallback save also failed:', fallbackError);
					}
				}
			} else {
				console.log('❌ [Frontend] No chatId available after API call - this should not happen since we create chat before API call');
					// This should not happen since we now create the chat before the API call
					// But if it does, we'll handle it gracefully
					try {
						console.log('🔄 [Frontend] Creating emergency chat...');
						const chatTitle2 = await generateTitle(userMessage.message || response.answer);
						const newChatResult2 = await saveChat({
							userId: String(user?.id || "anonymous"),
							title: chatTitle2,
						});
						setCreatedChatId(newChatResult2);
						console.log('✅ [Frontend] Emergency chat created with ID:', newChatResult2);
						
						// Now save the user message (if not already saved)
						await saveChatMessage({
							humanInTheLoopId: userMessage.id || uuidv4(),
							chatId: newChatResult2 as Id<"chats">,
							sender: userMessage.sender,
							message: userMessage.message,
						});
						console.log('✅ [Frontend] User message saved to emergency chat');
						
						// Save the AI response with enhanced data
						const jargonsObject = response.jargons ? 
							response.jargons.reduce((acc: Record<string, string>, jargon: { term: string; description: string }) => {
								acc[jargon.term] = jargon.description;
								return acc;
							}, {}) : {};
						
						// Always extract the summary narrative as a string for Reasoning
						let reasoningString: string | undefined = undefined;
						if (typeof response.trace === 'string') {
							reasoningString = response.trace;
						} else if (Array.isArray(response.trace) && response.trace[0]?.narrative) {
							reasoningString = response.trace[0].narrative;
						} else if (response.trace && typeof response.trace.narrative === 'string') {
							reasoningString = response.trace.narrative;
						}
						
						// Enhanced Info field population with context data (for new chat)
						const cveIds = Object.keys(response.cveDescriptionsMap || {});
						const contextCveIds = response.contextData?.cveIds || [];
						const allCveIds = [...cveIds, ...contextCveIds.filter((id: string) => !cveIds.includes(id))];
						
						const mainCveId = allCveIds.length > 0 ? allCveIds[0] : undefined;
						const mainCveDesc = mainCveId ? (
							response.cveDescriptionsMap?.[mainCveId] || 
							response.contextData?.cveDescriptions?.[0] ||
							"CVE description not available"
						) : undefined;
						
						// Get mitigation from context data
						const mitigation = response.contextData?.mitigations?.[0] || "Apply security patches and follow vendor recommendations";
						
						const sources = response.reasoningTrace && Array.isArray(response.reasoningTrace)
							? response.reasoningTrace.map((step: { step: string; message: string }) => step.step).filter(Boolean)
							: [];
						
						console.log("📊 [Frontend] Preparing to save emergency chat message with graph visualization:", {
							messageId: botMessage.id,
							chatId: newChatResult2,
							hasGraphData: !!response.graphData,
							graphDataKeys: response.graphData ? Object.keys(response.graphData) : 'No graph data'
						});

						await saveEnhancedChatMessage({
							humanInTheLoopId: botMessage.id || uuidv4(),
							chatId: newChatResult2 as Id<"chats">,
							sender: botMessage.sender,
							message: botMessage.message,
							Answer: response.answer,
							Reasoning: reasoningString, // Always a string summary
							Sources: sources,
							SourceLinks: response.sourceLinks || [],
							Jargons: jargonsObject,
							Info: mainCveId ? {
								cve_id: mainCveId,
								cve_desc: mainCveDesc,
								mitigation: mitigation
							} : (response.contextData && (response.contextData.concept || response.contextData.riskLevels?.[0])) ? {
								cve_id: response.contextData.concept || "General Security Topic",
								cve_desc: `Risk Level: ${response.contextData.riskLevels?.[0] || "Unknown"}. Topic: ${response.contextData.concept || "Security analysis"}`,
								mitigation: mitigation
							} : undefined,
							Severity: "Medium",
							tags: response.dynamicTags || ["cybersecurity_general"],
							graphVisualization: response.graphData || null // Include graph data from response
						});
						
						console.log("✅ [Frontend] New chat message with graph visualization saved successfully");
						console.log('AI response saved to new chat with enhanced data');
						
						// TODO lists are now generated on-demand when user clicks the TODO button
						console.log("✅ [Frontend] Chat message saved. TODO list will be generated when user clicks the TODO button.");
						
						// Update URL
						window.history.pushState(
							{ path: `/chatbot/${newChatResult2}` },
							"",
							`/chatbot/${newChatResult2}`,
						);
					} catch (chatCreateError) {
						console.error('Failed to create new chat:', chatCreateError);
					}
				}
				
				console.log('Adding botMessage to UI with jargons:', {
					hasJargons: !!botMessage.jargons,
					jargonsCount: botMessage.jargons?.length || 0,
					jargons: botMessage.jargons,
					hasSourceLinks: !!botMessage.sourceLinks,
					sourceLinksCount: botMessage.sourceLinks?.length || 0
				});
				// DUPLICATE CODE REMOVED - Bot message already added to UI immediately after response
				// setMessages((prev) => {
				// 	console.log('Previous messages count:', prev.length);
				// 	const newMessages = [...prev, botMessage];
				// 	console.log('New messages count:', newMessages.length);
				// 	return newMessages;
				// });
				// DUPLICATE CODE REMOVED - Loading state already stopped immediately after response
				// console.log('About to stop loading state...');
				// stopLoading(setIsLoading, setAgentButtonsDisabled, loadingIntervalRef, setLoadingMessage);
				// console.log('Loading state stopped');
			} catch (error) {
				stopLoading(setIsLoading, setAgentButtonsDisabled, loadingIntervalRef, setLoadingMessage);
				showErrorToast('Failed to get answer.');
			}
		}
	};

	const processManualMessages = async (
		userMessage: Message,
		botMessage: Message,
	) => {
		const latestMessage = [userMessage, botMessage];
		const response = await handleTitleGeneration(botMessage.message);

		const result = await saveChat({
			userId: String((response as { userId: string }).userId),
			title: (response as { title: string })?.title,
		});

		setCreatedChatId(result);

		for (const msg of latestMessage) {
			await saveChatMessage({
				chatId: result,
				humanInTheLoopId: msg.id,
				sender: msg.sender,
				message: msg.message,
			});
		}
		window.history.pushState(
			{ path: `/chatbot/${result}` },
			"",
			`/chatbot/${result}`,
		);
	};

	const requestHumanApproval = async (
		action: string, // action for the approval message
		prompt: string, // prompt to show to the human
		type?: string, // type of action to perform [none for options] [action type for approval]
		id?: string, // id to link the approval message to the action
		updatedOptions?: {
			name: string;
			id: string;
			type: string;
			description: string;
		}[], // options to show to the human
	) => {
		let approvalMessage = "";
		if (action === "scan") {
			approvalMessage = "You can choose from the following:";
			if (updatedOptions) {
				setActionPrompts(updatedOptions);
				setInfo(updatedOptions);
			}
			setHumanInTheLoopMessage(approvalMessage);
		} else if (action === "github-scan") {
			approvalMessage =
				"Select type of github repository. You can choose from the following:";
			setActionPrompts(GITHUB_SCAN);
			setInfo(GITHUB_SCAN);
			setHumanInTheLoopMessage(approvalMessage);
		} else if (action === "standards") {
			approvalMessage =
				"Select your preferred standard for the scan. You can choose from the following:";
			setActionPrompts(STANDARDS);
			setInfo(STANDARDS);
			setHumanInTheLoopMessage(approvalMessage);
		} else if (action === "report") {
			approvalMessage = "What type of report do you want to generate?";
			setActionPrompts(REPORTS);
			setInfo(REPORTS);
			setHumanInTheLoopMessage(approvalMessage);
		} else if (action === "approval") {
			approvalMessage = prompt;
			setActionPrompts([]);
			setHumanInTheLoopMessage(approvalMessage);
		} else if (action === "folder") {
			approvalMessage =
				"Select or create a folder where you want to save the scan report.";
			const folders = foldersList.map((folder) => {
				if (folder.type === "folder") {
					return { ...folder, type: "scan-summary" }; // Change type to "chat-summary"
				}
				return folder; // Return the folder unchanged if type is not "folder"
			});
			setActionPrompts(folders);
			setHumanInTheLoopMessage(approvalMessage);
		} else if (action === "folder-sast") {
			approvalMessage =
				"Select or create a folder where you want to save the scan report.";
			const folders = foldersList.map((folder) => {
				if (folder.type === "folder") {
					return { ...folder, type: "scan-sast-summary" };
				}
				return folder; // Return the folder unchanged if type is not "folder"
			});
			setActionPrompts(folders);
			setHumanInTheLoopMessage(approvalMessage);
		} else if (action === "save-chat-summary") {
			approvalMessage =
				"Select or create a folder where you want to save the chat summary report.";
			const folders = foldersList.map((folder) => {
				if (folder.type === "folder") {
					return { ...folder, type: "chat-summary" }; // Change type to "chat-summary"
				}
				return folder; // Return the folder unchanged if type is not "folder"
			});
			setActionPrompts(folders);
			setHumanInTheLoopMessage(approvalMessage);
		} else if (action === "input") {
			approvalMessage = "Please enter the file name for the report";
			setHumanInTheLoopMessage(approvalMessage);
		} else if (action === "sast-input") {
			approvalMessage = "Please enter the access token of github repository";
			setHumanInTheLoopMessage(approvalMessage);
		} else {
			approvalMessage = "You can choose from the following options";
			if (updatedOptions) {
				setActionPrompts(updatedOptions);
				setInfo(updatedOptions);
			}
			setHumanInTheLoopMessage(approvalMessage);
		}
		const approvalMessageObject: Message = {
			id: id,
			message: prompt,
			sender: "ai",
			actionType: action,
			confirmType: type,
			humanInTheLoopMessage: approvalMessage,
		};

		setActionType(action);
		setConfirmType(type || null);

		setMessages((prev) => [...prev, approvalMessageObject]);
	};

	const [showInfo, setShowInfo] = useState(false);

	const confirmAction = async (
		action: string, //action name
		type: string, //action type
		actionId?: string, //action id
	) => {
		if (!pendingAction) return;

		const userMessage: Message = {
			id: uuidv4(),
			message: action,
			sender: "user",
		};

		if (type === "scan") {
			setScanType(action);
			try {
				setMessages((prev) => [...prev, userMessage]);
				await saveChatMessage({
					humanInTheLoopId: userMessage.id,
					chatId: chatId
						? (chatId as Id<"chats">)
						: (createdChatId as Id<"chats">),
					sender: userMessage.sender,
					message: userMessage.message,
				});
				//message to pop after HIT
				const manualMessage =
					"Thank you for providing the scan type. Please select the standard you want to scan against.";
				const botMessage: Message = {
					id: uuidv4(),
					message: manualMessage,
					sender: "ai",
				};
				setPendingAction(botMessage.id as string);
				await saveChatMessage({
					humanInTheLoopId: botMessage.id,
					chatId: createdChatId
						? (createdChatId as Id<"chats">)
						: (chatId as Id<"chats">),
					sender: botMessage.sender,
					message: botMessage.message,
				});

				setRequestHumanInLoop({
					action: "standards",
					prompt: manualMessage,
					type: "none",
					id: botMessage.id,
				});
				requestHumanApproval("standards", manualMessage, "none", botMessage.id);
			} catch {
				addBotMessage("An error occurred while processing your request.");
			}
		} else if (type === "github-scan") {
			setScanType(action);
			if (action === "Private Repository") {
				try {
					setMessages((prev) => [...prev, userMessage]);
					await saveChatMessage({
						humanInTheLoopId: userMessage.id,
						chatId: chatId
							? (chatId as Id<"chats">)
							: (createdChatId as Id<"chats">),
						sender: userMessage.sender,
						message: userMessage.message,
					});
					//message to pop after HIT
					const manualMessage = "Thank you for selecting type of repository.";
					const botMessage: Message = {
						id: uuidv4(),
						message: manualMessage,
						sender: "ai",
					};
					setPendingAction(botMessage.id as string);
					await saveChatMessage({
						humanInTheLoopId: botMessage.id,
						chatId: createdChatId
							? (createdChatId as Id<"chats">)
							: (chatId as Id<"chats">),
						sender: botMessage.sender,
						message: botMessage.message,
					});
					setRequestHumanInLoop({
						action: "sast-input",
						prompt: manualMessage,
						type: "github-scan",
						id: botMessage.id,
					});
					requestHumanApproval(
						"sast-input",
						manualMessage,
						"github-scan",
						botMessage.id,
					);
				} catch {
					addBotMessage("An error occurred while processing your request.");
				}
			} else {
				try {
					setMessages((prev) => [...prev, userMessage]);
					await saveChatMessage({
						humanInTheLoopId: userMessage.id,
						chatId: chatId
							? (chatId as Id<"chats">)
							: (createdChatId as Id<"chats">),
						sender: userMessage.sender,
						message: userMessage.message,
					});
					//scan api call
					try {
						let payload: {
							githubUrl: string;
							repoType: string;
							accessToken?: string;
							userId: string | null | undefined;
						};
						if (action === "Public Repository") {
							payload = {
								githubUrl: targetUrl as string,
								repoType: "public",
								userId: user?.id,
							};
						} else {
							payload = {
								githubUrl: targetUrl as string,
								accessToken: action as string,
								repoType: "private",
								userId: user?.id,
							};
						}
						setPendingAction(null);
						setIsScanLoading(true);
						setProgress(0);
						setProgressLoaderMessage("Scanning in progress...");

						const totalSteps = 20;
						const stepDelay = 500;
						// Create the progress animation promise
						const progressAnimation = (async () => {
							for (let i = 0; i < totalSteps; i++) {
								await new Promise((resolve) => setTimeout(resolve, stepDelay));
								setProgress(
									(prevProgress) =>
										Math.min(prevProgress + 100 / totalSteps, 95), // Stop at 95% until API completes
								);
							}
						})();

						// Run both the animation and API call
						const [response] = await Promise.all([
							scanApis.scanWithGithubURL(payload),
							progressAnimation,
						]);
						setProgress(100);
						setScanSastResponse(response.data);
						addBotMessage(
							`Scan completed successfully. Found **${response.data.issues.length}** issues and **${response.data.hotspots.length}** hotspots.`,
						);
					} catch (error) {
						addBotMessage("An error occurred while processing your request.");
						return error;
					} finally {
						setIsScanLoading(false);
					}

					const manualMessage = "Do you want to generate a brief summary?";
					const botMessage: Message = {
						id: uuidv4(),
						message: manualMessage,
						sender: "ai",
					};

					await saveChatMessage({
						chatId: createdChatId
							? (createdChatId as Id<"chats">)
							: (chatId as Id<"chats">),
						humanInTheLoopId: botMessage.id,
						sender: botMessage.sender,
						message: botMessage.message,
					});

					setPendingAction(botMessage.id as string);
					setRequestHumanInLoop({
						action: "approval",
						prompt: manualMessage,
						type: "sast-report",
						id: botMessage.id,
					});
					requestHumanApproval(
						"approval",
						manualMessage,
						"sast-report",
						botMessage.id,
					);
				} catch {
					addBotMessage("An error occurred while processing your request.");
				}
			}
		} else if (type === "standards") {
			try {
				setMessages((prev) => [...prev, userMessage]);
				await saveChatMessage({
					humanInTheLoopId: userMessage.id,
					chatId: chatId
						? (chatId as Id<"chats">)
						: (createdChatId as Id<"chats">),
					sender: userMessage.sender,
					message: userMessage.message,
				});
				//scan api call
				try {
					const payload = {
						url: targetUrl as string,
						complianceStandard: action as string,
						scanType: scanType as string,
						userId: Number(user?.id),
					};
					setPendingAction(null);
					setIsScanLoading(true);
					setProgress(0);
					setProgressLoaderMessage("Scanning in progress...");

					const totalSteps = 20;
					const stepDelay = 500;

					// Create the progress animation promise
					const progressAnimation = (async () => {
						for (let i = 0; i < totalSteps; i++) {
							await new Promise((resolve) => setTimeout(resolve, stepDelay));
							setProgress(
								(prevProgress) => Math.min(prevProgress + 100 / totalSteps, 95), // Stop at 95% until API completes
							);
						}
					})();

					// Running both the animation and API call
					const [response] = await Promise.all([
						scanApis.scanWithProgress(payload),
						progressAnimation,
					]);

					setProgress(100);
					setScanResponse(response.data);

					addBotMessage(
						`Scan completed using **${response.data.complianceStandardUrl}**. Found **${response.data.totals.totalIssues}** vulnerabilities.`,
					);
				} catch (error) {
					addBotMessage("An error occurred while processing your request.");
					return error;
				} finally {
					setIsScanLoading(false);
				}

				const manualMessage = "Do you want to generate a brief summary?";
				const botMessage: Message = {
					id: uuidv4(),
					message: manualMessage,
					sender: "ai",
				};

				await saveChatMessage({
					chatId: createdChatId
						? (createdChatId as Id<"chats">)
						: (chatId as Id<"chats">),
					humanInTheLoopId: botMessage.id,
					sender: botMessage.sender,
					message: botMessage.message,
				});

				setPendingAction(botMessage.id as string);
				setRequestHumanInLoop({
					action: "approval",
					prompt: manualMessage,
					type: "report",
					id: botMessage.id,
				});
				requestHumanApproval(
					"approval",
					manualMessage,
					"report",
					botMessage.id,
				);
			} catch {
				addBotMessage("An error occurred while processing your request.");
			}
		} else if (type === "report") {
			if (action === "Chat Summary Report") {
				if (createdChatId) {
					setMessages((prev) => [...prev, userMessage]);
					await saveChatMessage({
						humanInTheLoopId: userMessage.id,
						chatId: createdChatId as Id<"chats">,
						sender: userMessage.sender,
						message: userMessage.message,
					});
				} else {
					await saveChatMessage({
						humanInTheLoopId: userMessage.id,
						chatId: chatId as Id<"chats">,
						sender: userMessage.sender,
						message: userMessage.message,
					});
				}
				setPendingAction(null);
				const payload = {
					messages: messages.map((msg) => msg.message),
				};
				const responseStream = (await chatApis.chatSummaryOpenAI(
					payload,
				)) as StreamResponse;

				await streamChatResponse(
					userMessage,
					responseStream as StreamResponse,
					action as string,
				);
				const manualMessage =
					"Do you want to save this as a detailed Chat Summary report?";
				const botMessage: Message = {
					id: uuidv4(),
					message: manualMessage,
					sender: "ai",
				};

				await saveChatMessage({
					chatId: createdChatId
						? (createdChatId as Id<"chats">)
						: (chatId as Id<"chats">),
					humanInTheLoopId: botMessage.id,
					sender: botMessage.sender,
					message: botMessage.message,
				});

				setPendingAction(botMessage.id as string);
				setRequestHumanInLoop({
					action: "approval",
					prompt: manualMessage,
					type: "save-chat-summary",
					id: botMessage.id,
				});

				requestHumanApproval(
					"approval",
					manualMessage,
					"save-chat-summary",
					botMessage.id,
				);
			} else if (action === "Vulnerability Report") {
				if (createdChatId) {
					setMessages((prev) => [...prev, userMessage]);
				} else {
					await saveChatMessage({
						humanInTheLoopId: userMessage.id,
						chatId: chatId as Id<"chats">,
						sender: userMessage.sender,
						message: userMessage.message,
					});
				}
				setPendingAction(null);
				const manualMessage = "Thank you for your response";
				const botMessage: Message = {
					id: uuidv4(),
					message: manualMessage,
					sender: "ai",
				};

				setPendingAction(botMessage.id as string);

				await saveChatMessage({
					chatId: createdChatId
						? (createdChatId as Id<"chats">)
						: (chatId as Id<"chats">),
					humanInTheLoopId: botMessage.id,
					sender: botMessage.sender,
					message: botMessage.message,
				});
				if (!targetUrl) {
					addBotMessage("Please provide a URL to scan");
					setPendingAction(null);
					return;
				}

				setRequestHumanInLoop({
					action: "standards",
					prompt: manualMessage,
					type: "none",
					id: botMessage.id,
				});
				requestHumanApproval("standards", manualMessage, "none", botMessage.id);
			}
		} else if (type === "scan-summary") {
			// Folder selection

			if (action === "Create New Folder") {
				setIsCreateDialogOpen(true);
				setRequestHumanInLoop({
					action: "input",
					type: "create-file",
				});
			} else {
				setFolderId(actionId as string);
				const manualMessage = "Thank you for providing the file name";
				const botMessage: Message = {
					id: uuidv4(),
					message: manualMessage,
					sender: "ai",
				};

				await saveChatMessage({
					chatId: createdChatId
						? (createdChatId as Id<"chats">)
						: (chatId as Id<"chats">),
					humanInTheLoopId: botMessage.id,
					sender: botMessage.sender,
					message: botMessage.message,
				});

				setPendingAction(botMessage.id as string);
				setRequestHumanInLoop({
					action: "input",
					prompt: manualMessage,
					type: "create-file",
					id: botMessage.id,
				});
				requestHumanApproval(
					"input",
					manualMessage,
					"create-file",
					botMessage.id,
				);
			}
		} else if (type === "chat-summary") {
			if (action === "Create New Folder") {
				setRequestHumanInLoop({
					action: "input",
					type: "chat-summary-create-file",
				});
				setIsCreateDialogOpen(true);
			} else {
				setFolderId(actionId as string);
				const manualMessage = "Thank you for providing the file name";
				const botMessage: Message = {
					id: uuidv4(),
					message: manualMessage,
					sender: "ai",
				};
				await saveChatMessage({
					chatId: createdChatId
						? (createdChatId as Id<"chats">)
						: (chatId as Id<"chats">),
					humanInTheLoopId: botMessage.id,
					sender: botMessage.sender,
					message: botMessage.message,
				});
				setPendingAction(botMessage.id as string);
				setRequestHumanInLoop({
					action: "input",
					prompt: manualMessage,
					type: "chat-summary-create-file",
					id: botMessage.id,
				});
				requestHumanApproval(
					"input",
					manualMessage,
					"chat-summary-create-file",
					botMessage.id,
				);
			}
		} else if (type === "scan-sast-summary") {
			// Folder selection
			if (action === "Create New Folder") {
				setIsCreateDialogOpen(true);
				setRequestHumanInLoop({
					action: "input",
					type: "create-file",
				});
			} else {
				setFolderId(actionId as string);
				const manualMessage = "Thank you for providing the file name";
				const botMessage: Message = {
					id: uuidv4(),
					message: manualMessage,
					sender: "ai",
				};

				await saveChatMessage({
					chatId: createdChatId
						? (createdChatId as Id<"chats">)
						: (chatId as Id<"chats">),
					humanInTheLoopId: botMessage.id,
					sender: botMessage.sender,
					message: botMessage.message,
				});

				setPendingAction(botMessage.id as string);
				setRequestHumanInLoop({
					action: "input",
					prompt: manualMessage,
					type: "sast-summary-create-file",
					id: botMessage.id,
				});
				requestHumanApproval(
					"input",
					manualMessage,
					"sast-summary-create-file",
					botMessage.id,
				);
			}
		} else if (type === "create-file" && action) {
			let markDownContent = "";
			try {
				setPendingAction(null);
				setIsScanLoading(true);
				setProgress(0);
				setProgressLoaderMessage("Generating report");

				const totalSteps = 10;
				const stepDelay = 500;

				// Create the progress animation promise
				const progressAnimation = (async () => {
					for (let i = 0; i < totalSteps; i++) {
						await new Promise((resolve) => setTimeout(resolve, stepDelay));
						setProgress(
							(prevProgress) => Math.min(prevProgress + 100 / totalSteps, 95), // Stop at 95% until API completes
						);
					}
				})();

				// Run both the animation and API call
				const [response] = await Promise.all([
					scanApis.detailedReportGeneration(scanResponse),
					progressAnimation,
				]);

				setProgress(100);

				setIsScanLoading(true);

				markDownContent = response.data.response;
				const fileId = await saveFile({
					fileName: action,
					fileUrl: "randomUrl",
					folderId: folderId as Id<"reportFolders">,
					reportType: "vulnerabilityReport",
					markdownContent: markDownContent,
				});

				const fileLink = `/file/${fileId}`;
				const message = `Report saved successfully. Click [here](${fileLink}) to view the report.`;

				addBotMessage(message);
			} catch (error) {
				return error;
			} finally {
				setIsScanLoading(false);
			}
		} else if (type === "chat-summary-create-file" && action) {
			let markDownContent = "";
			try {
				setPendingAction(null);
				setIsScanLoading(true);
				setProgress(0);
				if (!chatSummaryContent) {
					throw new Error("No chat summary available");
				}
				markDownContent = chatSummaryContent;
			} catch (error) {
				return error;
			} finally {
				setIsScanLoading(false);
			}
			const fileId = await saveFile({
				fileName: action,
				fileUrl: "randomUrl",
				folderId: folderId as Id<"reportFolders">,
				reportType: "chatSummaryReport",
				markdownContent: markDownContent,
			});
			const fileLink = `/file/${fileId}`;
			const message = `Report saved successfully. Click [here](${fileLink}) to view the report.`;
			setChatSummaryContent("");
			addBotMessage(message);
			setPendingAction(null);
		} else if (type === "sast-summary-create-file" && action) {
			let markDownContent = "";
			try {
				setPendingAction(null);
				setIsScanLoading(true);
				setProgress(0);
				setProgressLoaderMessage("Generating report");

				const totalSteps = 10;
				const stepDelay = 500;

				// Create the progress animation promise
				const progressAnimation = (async () => {
					for (let i = 0; i < totalSteps; i++) {
						await new Promise((resolve) => setTimeout(resolve, stepDelay));
						setProgress(
							(prevProgress) => Math.min(prevProgress + 100 / totalSteps, 95), // Stop at 95% until API completes
						);
					}
				})();

				// Run both the animation and API call
				const [response] = await Promise.all([
					scanApis.detailedSastReportGeneration(scanSastResponse),
					progressAnimation,
				]);

				setProgress(100);

				setIsScanLoading(true);

				markDownContent = response.data.response;
				const fileId = await saveFile({
					fileName: action,
					fileUrl: "randomUrl",
					folderId: folderId as Id<"reportFolders">,
					reportType: "vulnerabilityReport",
					markdownContent: markDownContent,
				});

				const fileLink = `/file/${fileId}`;
				const message = `Report saved successfully. Click [here](${fileLink}) to view the report.`;

				addBotMessage(message);
			} catch (error) {
				return error;
			} finally {
				setIsScanLoading(false);
			}
		} else {
			setPendingAction(null);
			handleSend(userMessage.message);
			// processPrompt(userMessage);
		}
	};

	const streamChatResponse = async (
		userMessage: Message,
		responseStream: StreamResponse,
		action?: string,
	) => {
		try {
			setStreaming(true);

			if (!responseStream.ok || !responseStream.body) {
				throw new Error("Failed to get response stream");
			}

			const reader = responseStream.body.getReader();
			const decoder = new TextDecoder();
			let accumulatedMessage = "";
			let humanAction = "";
			let humanOptions: { option: string; description: string }[] = [];
			let question = "";

			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					stopLoading(setIsLoading, setAgentButtonsDisabled, loadingIntervalRef, setLoadingMessage);
					if (!accumulatedMessage && humanAction !== "sendRagQuery") {
						accumulatedMessage = question;
					}

					await completeMessage();

					const botMessage: Message = {
						id: uuidv4(),
						message: accumulatedMessage,
						sender: "ai",
					};

					handleMessagesUpdate([userMessage, botMessage]);

					if (humanAction === "sendRagQuery") {
						try {
							setIsLoading(true);
							const response = await ragApis.sendRagQuery(question);
							addBotMessage(response.data.answer);
						} catch (error) {
							return error;
						} finally {
							stopLoading(setIsLoading, setAgentButtonsDisabled, loadingIntervalRef, setLoadingMessage);
						}
					} else if (humanAction === "sendEmail") {
						const manualMessage = "Please select either yes or no";
						setPendingAction(botMessage.id as string);
						requestHumanApproval(
							"approval",
							manualMessage,
							"email",
							botMessage.id,
						);
					} else if (humanAction === "select_scan_option") {
						const updatedScanTypes = SCANTYPES.map((scanType, index) => ({
							...scanType,
							name: humanOptions[index].option,
						}));

						const manualMessage =
							"Thank you for providing the scan type. Please select the standard you want to scan against.";

						setPendingAction(botMessage.id as string);

						requestHumanApproval(
							"scan",
							manualMessage,
							"none",
							botMessage.id,
							updatedScanTypes,
						);
					} else if (humanAction === "select_general_option") {
						const updatedOptions = humanOptions?.map((options, index) => ({
							id: String(index),
							type: options.option,
							name: options.option,
							description: options.description,
						}));

						setPendingAction(botMessage.id as string);

						requestHumanApproval(
							"random",
							"Human in the loop Action Completed",
							"none",
							botMessage.id,
							updatedOptions,
						);
					}

					//addd toolcall completion here

					if (action === "Chat Summary Report") {
						setChatSummaryContent(accumulatedMessage);
						await saveSummary({
							userId: String(user?.id),
							title: `Chat Summary - ${new Date().toLocaleDateString()}`,
							content: accumulatedMessage,
						});
					}
					break;
				}

				if (value) {
					const chunkText = decoder.decode(value, { stream: true });

					accumulatedMessage += chunkText;
					try {
						const parsed = JSON.parse(chunkText);

						if (parsed.type === "tool_call") {
							setIsLoading(true);

							humanAction = parsed.data.name;

							const options = parsed.data.arguments.options;

							humanOptions = options;

							question = parsed.data.arguments.question;
							accumulatedMessage = question;
						}
					} catch {
						// Not JSON, use as regular text
						accumulatedMessage += "";
					}

					updateUI(accumulatedMessage);
				}
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";
			addBotMessage(`Error: ${errorMessage}`);
		} finally {
			setStreaming(false);
			stopLoading(setIsLoading, setAgentButtonsDisabled, loadingIntervalRef, setLoadingMessage);
		}
	};

	const yesClicked = async (confirmType: string) => {
		setPendingAction(null);
		const userMessage: Message = {
			id: uuidv4(),
			message: "Yes",
			sender: "user",
		};
		setMessages((prev) => [...prev, userMessage]);
		if (confirmType === "report") {
			await saveChatMessage({
				humanInTheLoopId: userMessage.id,
				chatId: chatId
					? (chatId as Id<"chats">)
					: (createdChatId as Id<"chats">),
				sender: userMessage.sender,
				message: userMessage.message,
			});

			try {
				setIsLoading(true);
				//report generation api call
				const responseStream =
					await scanApis.scanReportGeneration(scanResponse);
				stopLoading(setIsLoading, setAgentButtonsDisabled, loadingIntervalRef, setLoadingMessage);

				await streamChatResponse(userMessage, responseStream);

				const manualMessage = "Do you want to save this as a detailed report?";
				const botMessage: Message = {
					id: uuidv4(),
					message: manualMessage,
					sender: "ai",
				};

				await saveChatMessage({
					chatId: createdChatId
						? (createdChatId as Id<"chats">)
						: (chatId as Id<"chats">),
					humanInTheLoopId: botMessage.id,
					sender: botMessage.sender,
					message: botMessage.message,
				});

				setPendingAction(botMessage.id as string);
				setRequestHumanInLoop({
					action: "approval",
					prompt: manualMessage,
					type: "save",
					id: botMessage.id,
				});
				requestHumanApproval("approval", manualMessage, "save", botMessage.id);
			} catch (error) {
				return error;
			}
		}
		if (confirmType === "sast-report") {
			await saveChatMessage({
				humanInTheLoopId: userMessage.id,
				chatId: chatId
					? (chatId as Id<"chats">)
					: (createdChatId as Id<"chats">),
				sender: userMessage.sender,
				message: userMessage.message,
			});

			try {
				setIsLoading(true);
				//report generation api call
				const responseStream =
					await scanApis.scanSastReportGeneration(scanSastResponse);
				stopLoading(setIsLoading, setAgentButtonsDisabled, loadingIntervalRef, setLoadingMessage);

				await streamChatResponse(userMessage, responseStream);

				const manualMessage = "Do you want to save this as a detailed report?";
				const botMessage: Message = {
					id: uuidv4(),
					message: manualMessage,
					sender: "ai",
				};

				await saveChatMessage({
					chatId: createdChatId
						? (createdChatId as Id<"chats">)
						: (chatId as Id<"chats">),
					humanInTheLoopId: botMessage.id,
					sender: botMessage.sender,
					message: botMessage.message,
				});

				setPendingAction(botMessage.id as string);
				setRequestHumanInLoop({
					action: "approval",
					prompt: manualMessage,
					type: "save-sast-summary",
					id: botMessage.id,
				});
				requestHumanApproval(
					"approval",
					manualMessage,
					"save-sast-summary",
					botMessage.id,
				);
			} catch (error) {
				return error;
			}
		} else if (confirmType === "save") {
			await saveChatMessage({
				humanInTheLoopId: userMessage.id,
				chatId: chatId
					? (chatId as Id<"chats">)
					: (createdChatId as Id<"chats">),
				sender: userMessage.sender,
				message: userMessage.message,
			});
			const manualMessage = "Thank you for folder name";
			const botMessage: Message = {
				id: uuidv4(),
				message: manualMessage,
				sender: "ai",
			};
			await saveChatMessage({
				chatId: createdChatId
					? (createdChatId as Id<"chats">)
					: (chatId as Id<"chats">),
				humanInTheLoopId: botMessage.id,
				sender: botMessage.sender,
				message: botMessage.message,
			});

			setPendingAction(botMessage.id as string);
			setRequestHumanInLoop({
				action: "folder",
				prompt: manualMessage,
				type: "none",
				id: botMessage.id,
			});
			requestHumanApproval("folder", manualMessage, "none", botMessage.id);
		} else if (confirmType === "save-chat-summary") {
			await saveChatMessage({
				humanInTheLoopId: userMessage.id,
				chatId: chatId
					? (chatId as Id<"chats">)
					: (createdChatId as Id<"chats">),
				sender: userMessage.sender,
				message: userMessage.message,
			});

			const manualMessage = "Thank you for folder name.";
			const botMessage: Message = {
				id: uuidv4(),
				message: manualMessage,
				sender: "ai",
			};
			await saveChatMessage({
				chatId: createdChatId
					? (createdChatId as Id<"chats">)
					: (chatId as Id<"chats">),
				humanInTheLoopId: botMessage.id,
				sender: botMessage.sender,
				message: botMessage.message,
			});

			setPendingAction(botMessage.id as string);
			setRequestHumanInLoop({
				action: "save-chat-summary",
				prompt: manualMessage,
				type: "summary",
				id: botMessage.id,
			});

			requestHumanApproval(
				"save-chat-summary",
				manualMessage,
				"summary",
				botMessage.id,
			);
		} else if (confirmType === "save-sast-summary") {
			await saveChatMessage({
				humanInTheLoopId: userMessage.id,
				chatId: chatId
					? (chatId as Id<"chats">)
					: (createdChatId as Id<"chats">),
				sender: userMessage.sender,
				message: userMessage.message,
			});

			const manualMessage = "Thank you for folder name.";
			const botMessage: Message = {
				id: uuidv4(),
				message: manualMessage,
				sender: "ai",
			};
			await saveChatMessage({
				chatId: createdChatId
					? (createdChatId as Id<"chats">)
					: (chatId as Id<"chats">),
				humanInTheLoopId: botMessage.id,
				sender: botMessage.sender,
				message: botMessage.message,
			});

			setPendingAction(botMessage.id as string);
			setRequestHumanInLoop({
				action: "folder-sast",
				prompt: manualMessage,
				type: "non",
				id: botMessage.id,
			});

			requestHumanApproval("folder-sast", manualMessage, "none", botMessage.id);
		} else if (confirmType === "email") {
			const response = await ragApis.getLatestCVEs();
			const { cveIds } = response.data;
			const uniqueCveList = [...new Set(cveIds)];

			const agentPayload: TriggerAgentData = {
				emailId: user?.email || "",
				cveIds: uniqueCveList as string[],
			};

			// Running ai agent API in background
			void (async () => {
				try {
					showInfoToast("Processed CVEs and triggering AI Agent");
					await agentApi.triggerAgent(agentPayload);
					showSuccessToast(
						"Please check your email for the Vulnerability Insights.",
					);
				} catch (error) {
					showErrorToast("Agent trigger failed. Please try again.");

					return error;
				}
			})();
		}
	};

	const cancelAction = async () => {
		setPendingAction(null);
		const userMessage: Message = {
			id: uuidv4(),
			message: "No",
			sender: "user",
		};
		setMessages((prev) => [...prev, userMessage]);
		await saveChatMessage({
			humanInTheLoopId: userMessage.id,
			chatId: chatId ? (chatId as Id<"chats">) : (createdChatId as Id<"chats">),
			sender: userMessage.sender,
			message: userMessage.message,
		});
		setChatSummaryContent("");
		// processPrompt(userMessage);
		// addBotMessage("Action cancelled. How else can I assist you?");
	};

	const addBotMessage = async (message: string) => {
		const botMessage: Message = { id: uuidv4(), message, sender: "ai" };
		setMessages((prev) => [...prev, botMessage]);

		await saveChatMessage({
			humanInTheLoopId: botMessage.id,
			chatId: createdChatId
				? (createdChatId as Id<"chats">)
				: (chatId as Id<"chats">),
			sender: botMessage.sender,
			message: botMessage.message,
		});
	};

	const generateTitle = async (botMessage: string) => {
		try {
			const { data } = await chatApis.generateTitle({
				botMessage: botMessage,
			});

			return data.response || "Chat";
		} catch (error) {
			console.error("Error generating title:", error);
		return "Chat";
	}
};

	const handleSend = async (message?: string, useRAG?: boolean, isRelatedQuestion = false) => {
		console.log('handleSend called with:', { message, useRAG, isRelatedQuestion, input: input.trim() });
		const finalMessage = message || input.trim();
		console.log('finalMessage:', finalMessage);
		if (finalMessage) {
			// Record the time when AI will start thinking
			thinkingStartRef.current = Date.now();

			const userMessage: Message = {
				id: uuidv4(),
				message: finalMessage,
				sender: "user",
				isRelatedQuestion: isRelatedQuestion,
			};
			
			// If this is a related question, preserve existing reasoning states but prepare for new AI response
			if (isRelatedQuestion) {
				console.log('[Related Question] Preparing for new reasoning display');
				// Don't clear reasoning states - preserve them for existing messages
				// Set a flag to ensure reasoning state is properly initialized for the next AI response
				setRelatedQuestionFlag(true);
			} else {
				// If this is a new user question (not a related question), clear all related questions
				console.log('[New Question] Clearing related questions for new user question');
				setRelatedQuestions({});
				setProcessedRelatedQuestions(new Set());
			}
			// Always optimistically add the user message
			setMessages((prev) => {
				if (prev.some(m => m.id === userMessage.id)) return prev;
				return [...prev, userMessage];
			});
				
				// If this is a related question, ensure reasoning will be visible for the next AI response
				if (isRelatedQuestion) {
					console.log('[Related Question] Setting up reasoning visibility for next AI response');
				}
			setInput("");
			if (createdChatId || chatId) {
				setFetchChatsRegurlarly(false);
				try {
					await saveChatMessage({
						humanInTheLoopId: userMessage.id,
						chatId: createdChatId
							? (createdChatId as Id<"chats">)
							: (chatId as Id<"chats">),
						sender: userMessage.sender,
						message: userMessage.message,
					});
					// Always use GraphRAG for cybersecurity questions
					processPrompt(userMessage, true);
				} catch (error) {
					return error;
				}
			} else {
				// Always use GraphRAG for cybersecurity questions
				processPrompt(userMessage, true);
			}
		}
	};

	const updateUI = (message: string) => {
		setMessages((prev) => {
			const lastMessage = prev[prev.length - 1];
			if (lastMessage?.sender === "ai" && lastMessage.isStreaming) {
				return [...prev.slice(0, -1), { ...lastMessage, message: message }];
			}

			return [
				...prev,
				{
					id: uuidv4(),
					message: message,
					sender: "ai",
					isStreaming: true,
				},
			];
		});
	};

	const handleMessagesUpdate = async (updatedMessages: Message[]) => {
		const lastMessage = updatedMessages[updatedMessages.length - 1];
		const chatId = createdChatId;
		if (!chatId && !createdChatId) {
			const response = await handleTitleGeneration(lastMessage.message);
			const result = await saveChat({
				userId: String((response as { userId: string }).userId),
				title: (response as { title: string })?.title,
			});
			setCreatedChatId(result);

			// Save all messages
			for (const msg of updatedMessages) {
				await saveChatMessage({
					chatId: result,
					humanInTheLoopId: msg.id,
					sender: msg.sender,
					message: msg.message,
				});
			}

			window.history.pushState(
				{ path: `/chatbot/${result}` },
				"",
				`/chatbot/${result}`,
			);
		} else {
			// Handle existing chat
			const targetChatId = createdChatId || chatId;

			if (targetChatId) {
				await saveChatMessage({
					humanInTheLoopId: lastMessage.id,
					chatId: targetChatId as Id<"chats">,
					sender: "ai",
					message: lastMessage.message,
				});
			}
		}
		return;
	};

	const completeMessage = async () => {
		setMessages((prev) => {
			const updatedMessages = prev.map((msg) =>
				msg.isStreaming ? { ...msg, isStreaming: false } : msg,
			);

			return updatedMessages;
		});
	};

	const handleFileCreation = async (
		selectedAction: string,
		action: RequestHumanInLoop | null,
	) => {
		if (action) {
			await confirmAction(selectedAction, action.type ?? "create-file");
		}
	};

	useEffect(() => {
		if (allRelatedQuestionsThisRender.length > 0) {
			setShownRelatedQuestions(prev => Array.from(new Set([...prev, ...allRelatedQuestionsThisRender])));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [messages]);

	// Find the index of the last AI message
	// const lastAiIndex = [...messages].reverse().findIndex(m => m.sender === "ai");
	// const lastAiMessageIdx = lastAiIndex === -1 ? -1 : messages.length - 1 - lastAiIndex;

	// Add duplicate ID check before rendering
	const idSet = new Set();
	messages.forEach(m => {
		if (idSet.has(m.id)) {
			console.warn('Duplicate message id detected:', m.id);
		}
		idSet.add(m.id);
	});

	// Filter out duplicate message IDs before rendering
	const uniqueMessages: Message[] = [];
	const seenIds = new Set();
	for (const msg of messages) {
		if (!seenIds.has(msg.id)) {
			uniqueMessages.push(msg);
			seenIds.add(msg.id);
		}
	}

	// Helper to normalize reasoningTrace to string
	const getReasoningString = (trace: any) => {
		if (typeof trace === 'string') return trace;
		if (Array.isArray(trace) && trace[0]?.narrative) return trace[0].narrative;
		if (trace && typeof trace.narrative === 'string') return trace.narrative;
		return '';
	};

	// Helper to preprocess message.message for jargons before passing to MarkdownViewer
	const preprocessJargonMarkdown = (content: string, jargons: any[] = [], cveDescriptionsMap: Record<string, string> = {}) => {
		console.log('Preprocessing jargons:', jargons.length, 'jargons found');
		
		// Check if content contains jargon highlighting syntax or is too jargon-heavy
		const jargonHighlightCount = (content.match(/\[JARGON_HIGHLIGHT:/g) || []).length;
		const wordCount = content.split(/\s+/).length;
		const jargonRatio = jargonHighlightCount / wordCount;
		
		console.log('🔍 Jargon detection:', {
			jargonHighlightCount,
			wordCount,
			jargonRatio: jargonRatio.toFixed(2),
			hasJargonSyntax: jargonHighlightCount > 0,
			contentPreview: content.substring(0, 100) + '...'
		});
		
		// If content contains jargon syntax or is too jargon-heavy, provide a clean fallback
		if (jargonHighlightCount > 0 || (jargonRatio > 0.3 && wordCount < 100)) {
			console.log('⚠️ Content contains jargon highlighting or is too jargon-heavy, providing clean fallback');
			return generateCleanFallbackAnswer(content, jargons);
		}
		
		// Additional check: if we have many jargons and the content is short, use fallback
		if (jargons.length > 3 && wordCount < 50) {
			console.log('⚠️ Too many jargons for short content, providing clean fallback');
			return generateCleanFallbackAnswer(content, jargons);
		}
		
		if (!jargons || jargons.length === 0) return content;
		
		// Split content into code blocks and regular text to preserve code blocks
		const codeBlockRegex = /```[\s\S]*?```/g;
		const codeBlocks: string[] = [];
		let processed = content.replace(codeBlockRegex, (match) => {
			codeBlocks.push(match);
			return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
		});
		
		// Sort by term length descending to avoid partial matches (longer terms first)
		const sortedJargons = [...jargons].sort((a, b) => b.term.length - a.term.length);
		
		sortedJargons.forEach(j => {
			const term = j.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			// Use word boundaries for single words, but allow partial matches for multi-word terms and technical terms
			const isMultiWord = j.term.includes(' ') || j.term.includes('-') || /^[A-Z]{2,}/.test(j.term);
			const regex = isMultiWord 
				? new RegExp(`(${term})`, 'gi')
				: new RegExp(`\\b(${term})\\b`, 'gi');
			
			const desc = j.description || cveDescriptionsMap[j.term] || '';
			console.log(`Highlighting term: "${j.term}" with description: "${desc.substring(0, 50)}..."`);
			
			// Replace with MarkdownViewer's expected syntax for clean highlighting
			processed = processed.replace(
				regex,
				`[JARGON_HIGHLIGHT:${j.term}|${desc.replace(/"/g, '&quot;')}]`
			);
		});
		
		// Restore code blocks
		codeBlocks.forEach((block, index) => {
			processed = processed.replace(`__CODE_BLOCK_${index}__`, block);
		});
		
		console.log('Jargon preprocessing complete');
		return processed;
	};

	// Generate a clean fallback answer when content is too jargon-heavy
	const generateCleanFallbackAnswer = (originalContent: string, jargons: any[]) => {
		// Clean the original content by removing jargon syntax
		const cleanedContent = originalContent.replace(/\[JARGON_HIGHLIGHT:[^|]+\|[^\]]+\]/g, (match) => {
			// Extract just the term from the jargon syntax
			const termMatch = match.match(/\[JARGON_HIGHLIGHT:([^|]+)\|/);
			return termMatch ? termMatch[1] : '';
		});
		
		// Also clean any other jargon patterns
		const fullyCleanedContent = cleanedContent
			.replace(/\[JARGON:[^|]+\|[^\]]+\]/g, (match) => {
				const termMatch = match.match(/\[JARGON:([^|]+)\|/);
				return termMatch ? termMatch[1] : '';
			})
			.replace(/JARGON_HIGHLIGHT/g, '')
			.replace(/JARGON:/g, '');
		
		// Extract the main topic from jargons or cleaned content
		const mainTerms = jargons.length > 0 
			? jargons.slice(0, 3).map(j => j.term).join(', ')
			: fullyCleanedContent.split(' ').slice(0, 5).join(' ');
		
		// Create a comprehensive, clean answer
		const cleanAnswer = `## Security Guidance 🔐

Based on your question about **${mainTerms}**, here's a comprehensive overview:

### Key Concepts

${jargons.length > 0 ? jargons.map(j => `- **${j.term}**: ${j.description}`).join('\n') : '- **Security Implementation**: Implementing robust security measures\n- **Risk Management**: Identifying and mitigating potential threats\n- **Best Practices**: Following industry-standard security guidelines'}

### Implementation Recommendations

1. **Access Control Implementation**
   - Implement role-based access controls (RBAC)
   - Use principle of least privilege
   - Regular access reviews and audits

2. **Security Best Practices**
   - Multi-factor authentication (MFA)
   - Regular security assessments
   - Continuous monitoring and logging

3. **Risk Mitigation**
   - Regular vulnerability scanning
   - Security awareness training
   - Incident response planning

### Next Steps

- Review current security policies
- Implement recommended controls
- Schedule regular security assessments
- Monitor and update security measures

For more specific guidance, please ask about particular aspects of these security measures.`;

		return cleanAnswer;
	};



	// const [isSearchOpen, setIsSearchOpen] = useState(false);
	const location = useLocation();
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
	const [highlightChatBlock, setHighlightChatBlock] = useState(false);
	const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
	const [highlightedTagMessageId, setHighlightedTagMessageId] = useState<string | null>(null);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const messageId = params.get("messageId");
		if (messageId) {
			setHighlightedMessageId(messageId);
			setTimeout(() => {
				const el = messageRefs.current[messageId];
				if (el) {
					el.scrollIntoView({ behavior: "smooth", block: "center" });
				}
			}, 300); // Wait for render
			// Remove highlight after 3 seconds
			setTimeout(() => setHighlightedMessageId(null), 3000);
		}
		// Highlight chat block if highlight param is present
		if (params.get("highlight") === "1") {
			setHighlightChatBlock(true);
			setTimeout(() => setHighlightChatBlock(false), 2500);
		}
		// Highlight first message with tag if tag param is present
		const tag = params.get("tag");
		if (tag) {
			const found = uniqueMessages.find(m => Array.isArray(m.tags) && m.tags.includes(tag));
			if (found) {
				setHighlightedTagMessageId(String(found.id));
				setTimeout(() => {
					const el = messageRefs.current[String(found.id)];
					if (el) {
						el.scrollIntoView({ behavior: "smooth", block: "center" });
					}
				}, 300);
				setTimeout(() => setHighlightedTagMessageId(null), 3000);
			}
		}
		// Remove chat block highlight logic
	}, [location.search, uniqueMessages.length]);

	return (
		<div className={`relative flex h-screen flex-col overflow-hidden${highlightChatBlock ? ' ring-4 ring-yellow-300/60 bg-yellow-50 dark:bg-yellow-900/30 transition-all duration-700' : ''}`}>
			<div className={`flex flex-col h-full ${uniqueMessages.length === 0 ? 'justify-between md:justify-center' : 'justify-between'}`}>
				<div className={`flex flex-col w-full max-w-6xl mx-auto ${uniqueMessages.length === 0 ? 'flex-1 md:flex-none' : 'flex-1 overflow-hidden'}`}>
					{uniqueMessages.length === 0 ? (
						<div className="flex-1 md:flex-none flex items-center justify-center" />
					) : chatsLoader ? (
						<div className="flex items-center justify-center w-full h-full">
							<Spinner />
						</div>
					) : (
						<ScrollArea
							ref={scrollAreaRef}
							className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 pb-2 w-full overflow-y-auto"
						>
							{uniqueMessages.map((message, idx) => {
								const isPendingAction =
									pendingAction === message.id ||
									pendingAction === message.humanInTheLoopId;
								const isAISender = message.sender === "ai";
								const isHighlighted = highlightedMessageId === String(message.id) || highlightedTagMessageId === String(message.id);

								if (isPendingAction && isAISender) {
									return actionType === "approval" ? (
										<motion.div
											key={message.id + '-' + idx}
											initial={{ opacity: 0, y: 50 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -50 }}
											transition={{ duration: 0.3 }}
										>
											<HumanInTheLoopApproval
												addBotMessage={addBotMessage}
												key={message.id}
												message={humanInTheLoopMessage || ""}
												onCancel={cancelAction}
												confirmType={confirmType || ""}
												onConfirm={yesClicked}
											/>
										</motion.div>
									) : actionType === "input" || actionType === "sast-input" ? (
										<motion.div
											key={message.id + '-' + idx}
											initial={{ opacity: 0, y: 50 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -50 }}
											transition={{ duration: 0.3 }}
										>
											<HumanInTheLoopInput
												addBotMessage={addBotMessage}
												key={message.id}
												message={humanInTheLoopMessage || ""}
												onConfirm={handleFileCreation}
												setShowInfo={setShowInfo}
												requestHumanInLoop={requestHumanInLoop ?? null}
											/>
										</motion.div>
									) : (
										<motion.div
											key={message.id + '-' + idx}
											initial={{ opacity: 0, y: 50 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -50 }}
											transition={{ duration: 0.3 }}
										>
											<HumanInTheLoopOptions
												addBotMessage={addBotMessage}
												key={message.id}
												setShowInfo={setShowInfo}
												question={humanInTheLoopMessage || ""}
												actionPrompts={actionPrompts || []}
												onConfirm={confirmAction}
											/>
										</motion.div>
									);
								}
								if (isPendingAction && isAISender) {
									return actionType === "approval" ? (
										<motion.div
											key={message.id + '-' + idx}
											initial={{ opacity: 0, y: 50 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -50 }}
											transition={{ duration: 0.3 }}
										>
											<HumanInTheLoopApproval
												addBotMessage={addBotMessage}
												key={message.id}
												message={humanInTheLoopMessage || ""}
												onCancel={cancelAction}
												confirmType={confirmType || ""}
												onConfirm={yesClicked}
											/>
										</motion.div>
									) : actionType === "input" || actionType === "sast-input" ? (
										<motion.div
											key={message.id + '-' + idx}
											initial={{ opacity: 0, y: 50 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -50 }}
											transition={{ duration: 0.3 }}
										>
											<HumanInTheLoopInput
												addBotMessage={addBotMessage}
												key={message.id}
												message={humanInTheLoopMessage || ""}
												onConfirm={handleFileCreation}
												setShowInfo={setShowInfo}
												requestHumanInLoop={requestHumanInLoop ?? null}
											/>
										</motion.div>
									) : (
										<motion.div
											key={message.id + '-' + idx}
											initial={{ opacity: 0, y: 50 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -50 }}
											transition={{ duration: 0.3 }}
										>
											<HumanInTheLoopOptions
												addBotMessage={addBotMessage}
												key={message.id}
												setShowInfo={setShowInfo}
												question={humanInTheLoopMessage || ""}
												actionPrompts={actionPrompts || []}
												onConfirm={confirmAction}
											/>
										</motion.div>
									);
								}

							const isUser = message.sender === "user";
							const messageClasses = `inline-block rounded-2xl max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] ${
								isUser
									? "bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base break-words text-foreground font-normal text-left"
									: "text-foreground pr-2 sm:pr-4 overflow-y-auto text-pretty break-words text-xs sm:text-sm leading-relaxed"
							}`;
							const containerClasses = `mb-3 sm:mb-4 ${isUser ? "text-right" : "text-left"} w-full`;

								// Only show related questions for the very last message if it is an AI message
								const isLastMessage = idx === uniqueMessages.length - 1;
								const isLastAiMessage = isLastMessage && message.sender === 'ai';

								// Get related questions from state or use fallback
								// Include trigger to ensure re-render when questions are updated
								const messageRelatedQuestions = relatedQuestions[String(message.id)] || [
									'Can you explain this in more detail?',
									'What are the key takeaways?',
								'How can I apply this knowledge?'
							];

							console.log('Related questions for message:', {
								messageId: String(message.id),
								hasGeneratedQuestions: !!relatedQuestions[String(message.id)],
								generatedQuestions: relatedQuestions[String(message.id)],
								fallbackQuestions: messageRelatedQuestions,
								questionCount: messageRelatedQuestions.length
							});

							console.log('[MiraChatBot] Rendering message:', {
								index: idx,
								messageId: message.id,
								sender: message.sender,
								isUser: message.sender === 'user',
								isLastAiMessage,
								messageLength: message.message.length
							});

							// Related questions generation is now handled in the useEffect hook above
							// This prevents duplicate API calls and infinite loops

							// Debug: Log reasoning state for this message
							if (message.sender === 'ai') {
								console.log('[Message Render] AI message reasoning state:', {
									messageId: message.id,
									hasReasoningTrace: !!message.reasoningTrace,
									reasoningType: typeof message.reasoningTrace,
									isArray: Array.isArray(message.reasoningTrace),
									expandedState: expandedReasoning[String(message.id)],
									willShowReasoning: !!(message.reasoningTrace && expandedReasoning[String(message.id)])
								});
							}

								return (
									<motion.div
										key={message.id + '-' + idx}
										className={containerClasses + (isHighlighted ? " border-2 border-gray-400 bg-gray-100 dark:bg-gray-800 transition-all duration-700" : "")}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1, y: 0 }}
										ref={el => {
											if (el) messageRefs.current[String(message.id)] = el;
										}}
									>
										<div
											className={`items-center ${message.sender === "ai" ? "flex space-x-3" : ""}`}
										>
										<div className={`${messageClasses}`}>
											{/* Reasoning summary indicator (before every message if present) */}
											{message.reasoningTrace && (
																									<div className="flex items-center mb-2 text-[10px] sm:text-xs text-sidebar-foreground cursor-pointer select-none hover:text-sidebar-accent-foreground transition-colors"
														onClick={() => {
															const messageId = String(message.id);
															// Ensure the state is always defined
															const currentState = expandedReasoning[messageId] === undefined ? false : expandedReasoning[messageId];
															const newState = !currentState;
															
															console.log('[Reasoning Toggle] Clicked reasoning for message:', {
																messageId: message.id,
																hasReasoningTrace: !!message.reasoningTrace,
																currentExpandedState: currentState,
																newState: newState,
																allExpandedReasoning: expandedReasoning
															});
															
															setExpandedReasoning(prev => {
																const updated = { ...prev, [messageId]: newState };
																console.log('[Reasoning Toggle] Updated state:', {
																	messageId: messageId,
																	oldState: prev[messageId],
																	newState: newState,
																	updatedState: updated
																});
																return updated;
															});
														}}
														onKeyDown={(e) => {
															if (e.key === 'Enter' || e.key === ' ') {
																e.preventDefault();
																const messageId = String(message.id);
																// Ensure the state is always defined
																const currentState = expandedReasoning[messageId] === undefined ? false : expandedReasoning[messageId];
																const newState = !currentState;
																setExpandedReasoning(prev => ({ ...prev, [messageId]: newState }));
															}
														}}
														tabIndex={0}
														role="button"
														aria-expanded={expandedReasoning[String(message.id)] === true}
														aria-controls={`reasoning-summary-${String(message.id)}`}
													>
														<Brain className="mr-1 sm:mr-2 text-sidebar-foreground w-3 h-3 sm:w-4 sm:h-4" />
														<span className="text-[10px] sm:text-xs">Reasoning</span>
														{typeof message.durationSec === 'number' && (
															<span className="ml-1 sm:ml-2 text-sidebar-foreground/60 text-[10px] sm:text-xs hidden sm:inline">Thought for {Math.round(message.durationSec)}s</span>
														)}

														<motion.div
															animate={{ rotate: expandedReasoning[String(message.id)] ? 90 : 0 }}
															transition={{ duration: 0.2, ease: "easeInOut" }}
															className="ml-1"
														>
															<FaChevronRight className="text-sidebar-foreground" />
														</motion.div>
													</div>
											)}
											<AnimatePresence>
											{message.reasoningTrace && expandedReasoning[String(message.id)] && (
																																							<motion.div
													id={`reasoning-summary-${String(message.id)}`}
														initial={{ opacity: 0, height: 0, y: -10 }}
														animate={{ opacity: 1, height: "auto", y: 0 }}
														exit={{ opacity: 0, height: 0, y: -10 }}
														transition={{ 
															duration: 0.3, 
															ease: "easeInOut",
															opacity: { duration: 0.2 },
															height: { duration: 0.3 }
														}}
														className="mb-2 p-2 sm:p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 rounded-lg border-l-2 sm:border-l-4 border-purple-400 dark:border-purple-400 shadow-sm relative overflow-hidden"
														style={{ fontSize: '0.75rem', lineHeight: 1.5 }}
													>
																												<div className="flex items-center mb-2 mt-1">
															<span className="text-lg mr-1">🤔</span>
														</div>
														<div className="text-purple-700 dark:text-purple-200 text-xs">
															{(() => {
																const reasoningContent = getReasoningString(message.reasoningTrace);
																console.log('[Reasoning Display] Rendering reasoning for message:', {
																	messageId: message.id,
																	reasoningContentLength: reasoningContent.length,
																	reasoningContentPreview: reasoningContent.substring(0, 100) + '...',
																	isExpanded: expandedReasoning[String(message.id)]
																});
																return <MarkdownViewer content={reasoningContent} />;
															})()}
												</div>
													</motion.div>
											)}
											</AnimatePresence>
											
											{!isUser && (
												<div className="mb-2 sm:mb-3 p-2 sm:p-3 md:p-5 bg-muted/30 dark:bg-muted/10 rounded-lg w-full">
													{(() => {
														// Check if the original message contains jargon syntax - if so, clean it but keep highlighting
														const jargonPatterns = [
															'[JARGON_HIGHLIGHT:',
															'[JARGON:',
															'JARGON_HIGHLIGHT',
															'JARGON:'
														];
														
														const hasJargonSyntax = jargonPatterns.some(pattern => 
															message.message?.includes(pattern)
														);
														
														if (hasJargonSyntax) {
															console.log('🚨 JARGON SYNTAX DETECTED - CLEANING SYNTAX BUT KEEPING HIGHLIGHTING');
															console.log('Original message:', message.message?.substring(0, 200));
															
															// Clean the jargon syntax but preserve the highlighting functionality using MarkdownViewer's built-in processing
															const cleanedContent = message.message
																.replace(/\[JARGON_HIGHLIGHT:([^|]+)\|([^\]]+)\]/g, (_match, term, description) => {
																	// Use MarkdownViewer's expected syntax for clean highlighting
																	return `[JARGON_HIGHLIGHT:${term}|${description.replace(/"/g, '&quot;')}]`;
																})
																.replace(/\[JARGON:([^|]+)\|([^\]]+)\]/g, (_match, term, description) => {
																	return `[JARGON_HIGHLIGHT:${term}|${description.replace(/"/g, '&quot;')}]`;
																})
																.replace(/JARGON_HIGHLIGHT/g, '')
																.replace(/JARGON:/g, '');
															
															return <MarkdownViewer content={cleanedContent} />;
														}
														
														// If no jargon syntax, proceed with normal jargon processing
														const processedContent = preprocessJargonMarkdown(message.message, message.jargons, message.cveDescriptionsMap);
														console.log('Rendering message:', {
															sender: message.sender,
															hasJargons: !!message.jargons,
															jargonsCount: message.jargons?.length || 0,
															messageId: message.id,
															hasCodeBlocks: processedContent.includes('```'),
															contentLength: processedContent.length,
															originalContent: message.message?.substring(0, 100) + '...',
															processedContent: processedContent?.substring(0, 100) + '...',
															originalHasMarkdown: message.message?.includes('**') || message.message?.includes('*') || message.message?.includes('`'),
															processedHasMarkdown: processedContent?.includes('**') || processedContent?.includes('*') || processedContent?.includes('`'),
															hasJargonSyntax: processedContent?.includes('[JARGON_HIGHLIGHT:'),
															jargonSyntaxCount: (processedContent?.match(/\[JARGON_HIGHLIGHT:/g) || []).length
														});
														return <MarkdownViewer content={processedContent} />;
													})()}
													{/* Old SourceLinks component - commented for future use
													{message.sourceLinks && message.sourceLinks.length > 0 && (
														<SourceLinks sourceLinks={message.sourceLinks || []} autoExpand={true} />
													)}
													*/}
													
													{/* Action Buttons - Sources, Graph, and TODO List */}
													<hr className="mt-2 sm:mt-4 mb-2 border-t border-sidebar-border/50" />
													<div className="flex items-center gap-1 sm:gap-2 -ml-1 sm:-ml-2 relative">
														{/* Sources */}
														{(() => {
															return (
																<Sheet>
																	<Tooltip>
																		<TooltipTrigger asChild>
																			<SheetTrigger asChild>
																				<button className="p-1.5 sm:p-2 rounded-full hover:bg-accent/60 transition-colors group touch-manipulation" title="Show sources">
																					<Link className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-black dark:group-hover:text-white transition-colors" />
																				</button>
																			</SheetTrigger>
																		</TooltipTrigger>
																		<TooltipContent side="top" align="center">
																			View sources
																		</TooltipContent>
																	</Tooltip>
																	<SheetContent side="right" className="max-w-full sm:max-w-md w-full">
																		<div className="p-4">
																			<SourceLinks sourceLinks={message.sourceLinks || []} autoExpand={true} />
																		</div>
																	</SheetContent>
																</Sheet>
															);
														})()}
														
														{/* Graph */}
														{(() => {
															const graphChatId = chatId || createdChatId || '';
															console.log('[MiraChatBot] Passing chatId to GraphButton:', {
																chatId,
																createdChatId,
																graphChatId,
																messageId: message.id
															});
															return (
																<GraphButton 
																	message={message} 
																	chatId={graphChatId} 
																	className="text-muted-foreground"
																/>
															);
														})()}
														
														{/* TODO List */}
														{(() => {
															const todoChatId = chatId || createdChatId || '';
															return (
																<TodoListButton 
																	message={message} 
																	chatId={todoChatId} 
																	className="text-muted-foreground"
																/>
															);
														})()}
														
														{/* Tags toggle */}
														{Array.isArray((message as any).tags) && (message as any).tags.length > 0 && (
															<Tooltip>
																<TooltipTrigger asChild>
																	<button
																		className="p-1.5 sm:p-2 rounded-full hover:bg-accent/60 transition-colors group touch-manipulation"
																		title="Show tags"
																		onClick={() => {
																			const messageId = String(message.id);
																			const currentState = expandedTags[messageId] === undefined ? false : expandedTags[messageId];
																			setExpandedTags(prev => ({ ...prev, [messageId]: !currentState }));
																		}}
																		aria-expanded={expandedTags[String(message.id)] === true}
																		aria-controls={`tags-${String(message.id)}`}
																	>
																		<TagIcon size={14} className="sm:w-4 sm:h-4 text-muted-foreground group-hover:text-black dark:group-hover:text-white transition-colors" />
																	</button>
																</TooltipTrigger>
																<TooltipContent side="top" align="center">
																	View tags
																</TooltipContent>
															</Tooltip>
														)}
                                                    </div>

                                                    {/* Tags appearing below tag button */}
                                                    {message.sender === 'ai' && Array.isArray((message as any).tags) && (message as any).tags.length > 0 && (
                                                        <AnimatePresence>
                                                            {expandedTags[String(message.id)] && (
                                                                <motion.div
                                                                    id={`tags-${String(message.id)}`}
                                                                    initial={{ 
                                                                        opacity: 0, 
                                                                        height: 0,
                                                                        y: -10
                                                                    }}
                                                                    animate={{ 
                                                                        opacity: 1, 
                                                                        height: "auto",
                                                                        y: 0
                                                                    }}
                                                                    exit={{ 
                                                                        opacity: 0, 
                                                                        height: 0,
                                                                        y: -10
                                                                    }}
                                                                    transition={{ 
                                                                        duration: 0.3, 
                                                                        ease: "easeOut"
                                                                    }}
                                                                    className="mt-2 mb-2 overflow-hidden"
                                                                >
                                                                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                                                        {((message as any).tags as string[]).map((tag, i) => (
                                                                            <motion.span 
                                                                                key={`${message.id}-tag-${i}`}
                                                                                initial={{ 
                                                                                    opacity: 0, 
                                                                                    y: -10, 
                                                                                    scale: 0.8 
                                                                                }}
                                                                                animate={{ 
                                                                                    opacity: 1, 
                                                                                    y: 0, 
                                                                                    scale: 1 
                                                                                }}
                                                                                transition={{ 
                                                                                    delay: i * 0.08, 
                                                                                    duration: 0.2,
                                                                                    ease: "easeOut"
                                                                                }}
                                                                                className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-blue-100 text-blue-800 text-[9px] sm:text-[10px] font-medium whitespace-nowrap shadow-sm hover:bg-blue-200 transition-colors duration-200"
                                                                            >
                                                                                #{tag.replace(/_/g, '').replace(/([A-Z])/g, (_match, p1, offset) => offset > 0 ? p1 : p1).toLowerCase()}
                                                                            </motion.span>
                                                                        ))}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    )}

                                                    {/* Suggested Questions - below icons and tags */}
                                                    {isLastAiMessage && (
                                                        <div className="mt-2 sm:mt-3">
                                                            <div className="text-[10px] sm:text-xs text-sidebar-foreground/70 mb-1.5 sm:mb-2 italic">Suggested follow-up questions:</div>
                                                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                            {messageRelatedQuestions.map((q: string, i: number) => (
                                                                <motion.button
                                                                    key={`${message.id}-${q}-${i}`}
                                                                    onClick={() => handleSend(q, false, true)}
                                                                    className="rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 bg-sidebar border border-sidebar-border text-sidebar-foreground text-[11px] sm:text-xs md:text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sidebar-ring touch-manipulation"
                                                                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                                                                    initial={{ opacity: 0, y: 20 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: 0.15 * i, duration: 0.35, type: 'spring', stiffness: 200 }}
                                                                >
                                                                    {q}
                                                                </motion.button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    )}
                                                </div>
											)}
											{isUser && (
												<div className="leading-relaxed text-foreground">
													{message.message}
												</div>
											)}
										</div>
									</div>
								</motion.div>
							);
						})}

							{isLoading && (
								<motion.div
									initial={{ opacity: 0, y: 50 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -50 }}
									transition={{ duration: 0.3 }}
									className="flex items-center space-x-2 text-gray-500"
								>
									<Spinner />
								<span>{loadingMessage}</span>
								</motion.div>
							)}
						</ScrollArea>
					)}
					{isScanLoading && (
						<div className="space-y-2">
							<Progress value={progress} className="w-full" />

							<p className="text-sm text-center text-gray-500">
								{progress === 95
									? "Almost done..."
									: `${progressLoaderMessage}: ${progress.toFixed(0)}%`}
							</p>
						</div>
					)}
				</div>
				
				{/* Input Section - Always at bottom on mobile, centered on desktop when empty */}
				<div className={`w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 ${uniqueMessages.length === 0 ? 'pb-6 sm:pb-8' : 'py-3 sm:py-4'} bg-background ${uniqueMessages.length === 0 ? 'md:pb-0' : ''}`}>
						{/* Welcome Message - GPT-style */}
						{uniqueMessages.length === 0 && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
								className="flex flex-col items-center justify-center text-center mb-8 sm:mb-10 md:mb-12 px-4 sm:px-6"
							>
								{/* Main message - GPT-style sizing */}
								<h1 
									className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground text-center"
									style={{ lineHeight: '1.2' }}
								>
									How can I help you?
								</h1>
							</motion.div>
						)}
						
						<motion.div
							key={`chat-input-${uniqueMessages.length === 0 ? 'new' : 'existing'}`}
							initial={{
								width: uniqueMessages.length === 0 ? '100%' : '100%',
								opacity: 0,
								y: uniqueMessages.length === 0 ? 50 : 20,
								scale: uniqueMessages.length === 0 ? 0.9 : 1
							}}
							animate={{
								width: '100%',
								opacity: 1,
								y: 0,
								scale: 1
							}}
							transition={{
								duration: uniqueMessages.length === 0 ? 0.8 : 0.5,
								ease: 'easeOut',
								delay: uniqueMessages.length === 0 ? 0.2 : 0.1
							}}
							className={`chat-input flex flex-col p-2 sm:p-2 rounded-xl sm:rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground w-full ${uniqueMessages.length === 0 ? 'max-w-full sm:max-w-2xl' : 'max-w-full lg:max-w-6xl'} shadow-md sm:shadow-sm transition-all mx-auto`}
						>
							{/* Input Field */}
							<motion.textarea
								initial={{ height: 0, opacity: 0, scale: 0.95 }}
								animate={{ height: "40px", opacity: 1, scale: 1 }}
								transition={{ 
									duration: 0.6, 
									ease: "easeOut",
									delay: 0.3,
									scale: { duration: 0.4, delay: 0.4 }
								}}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSend();
									}
								}}
								className="w-full text-sm sm:text-base bg-sidebar text-sidebar-foreground rounded-md px-3 py-2 sm:px-3 sm:py-2 placeholder:text-muted-foreground focus:outline-none border-none resize-none transition-colors overflow-hidden touch-manipulation"
								placeholder="Type your message here..."
								disabled={isLoading || !!pendingAction}
							/>

						{/* Buttons Section */}
						<RoleButtonGroup 
							selectedAgentMode={selectedAgentMode}
							onAgentModeChange={setSelectedAgentMode}
							agentButtonsDisabled={agentButtonsDisabled}
							handleSend={handleSend}
						/>
						</motion.div>
				</div>
			</div>

			<Dialog open={showInfo} onOpenChange={setShowInfo}>
						<DialogContent className="dialog-content">
							<DialogHeader>
								<DialogTitle className="dialog-title">Information</DialogTitle>
							</DialogHeader>
							<ScrollArea
								style={{
									maxHeight: "400px",
									width: "100%",
									overflowY: "auto",
									scrollbarWidth: "thick",
									scrollbarColor: "#888 #f0f0f0",
								}}
							>
								<div className="dialog-body">
									{info.map((item) => (
										<div key={item.id} className="info-item">
											<h2 className="text-lg font-semibold">{item.name}</h2>
											<p className="info-description">
												{item.description || "No description available."}
											</p>
										</div>
									))}
								</div>
							</ScrollArea>
						</DialogContent>
				</Dialog>
				
				<CreateFolderDialog
					open={isCreateDialogOpen}
					humanInTheLoopAction={requestHumanInLoop}
					onOpenChange={setIsCreateDialogOpen}
					onCreateFolder={handleCreateFolder}
				/>
				
				{/* Graph Generation Modal */}
				<GraphGenerationModal
					isOpen={isModalOpen}
					onClose={closeModal}
				/>
		</div>
	);
};

export default MiraChatBot;
