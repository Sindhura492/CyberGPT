import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Loader2, EyeOff, ListTodo, Download, GripVertical, AlertTriangle, Shield, CheckCircle, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useAction, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Message } from '../../types/chats';
import { MoveTodoToSpaceDialog } from './MoveTodoToSpaceDialog';
import TodoListGenerationModal from './TodoListGenerationModal';
import { useTodoListGenerationModal } from '../../hooks/useTodoListGenerationModal';
import useStore from '../../store/store';

export interface TodoItem {
  id: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  description?: string;
  completed: boolean;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  cvssScore: number;
  confidence: number;
  cveIds?: string[];
  affectedSystems?: string[];
  emoji?: string;
}

export interface TodoList {
  id: string;
  title: string;
  description: string;
  items: TodoItem[];
  createdAt: number; // Timestamp from database
  lastModified?: number; // Optional timestamp for last modification
  // Note: messageId and chatId are stored separately as _messageId and _chatId
  // to avoid schema validation errors in Convex
}

interface TodoListButtonProps {
  message: Message;
  chatId: string;
  className?: string;
}

// Sortable Todo Item Component
const SortableTodoItem: React.FC<{
  item: TodoItem;
  index: number;
  onToggle: (itemId: string) => void;
  getPriorityColor: (priority: string) => string;
  getCategoryColor: (category: string) => string;
  getRiskColor: (riskLevel: string) => string;
  getCVSSColor: (score: number) => string;
}> = ({ item, index, onToggle, getPriorityColor, getCategoryColor, getRiskColor, getCVSSColor }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3
      }}
      className={`p-2.5 sm:p-4 md:p-5 rounded-lg transition-all duration-200 bg-card border border-border text-foreground shadow-sm w-full max-w-full relative group
        ${item.completed ? 'opacity-80 bg-green-50 dark:bg-green-900/30' : ''}
        ${isDragging ? 'shadow-lg ring-2 ring-primary/20 z-20' : ''}
        hover:border-primary hover:ring-2 hover:ring-primary/60 hover:shadow-lg`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Drag Handle for Reordering */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing rounded p-1 hover:bg-muted/60 transition-colors touch-none"
          >
            <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 group-hover:text-primary transition-colors" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(item.id)}
            className={`h-5 w-5 sm:h-6 sm:w-6 p-0 rounded touch-manipulation ${
              item.completed 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {item.completed ? (
              <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-current rounded" />
            )}
          </Button>
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Title and Category Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-2">
            <h4 className={`font-medium text-xs sm:text-sm md:text-base break-words ${
              item.completed 
                ? 'line-through text-gray-500 dark:text-gray-400' 
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {index + 1}. {item.emoji} {item.task}
            </h4>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              <Badge className={`text-[10px] sm:text-xs px-1.5 py-0.5 bg-sidebar text-sidebar-foreground border border-border hover:bg-sidebar/90 hover:text-sidebar-foreground focus:ring-2 focus:ring-primary/20 transition-colors duration-150 ${getPriorityColor(item.priority)}`}>{item.priority}</Badge>
              <Badge className={`text-[10px] sm:text-xs px-1.5 py-0.5 bg-sidebar text-sidebar-foreground border border-border hover:bg-sidebar/90 hover:text-sidebar-foreground focus:ring-2 focus:ring-primary/20 transition-colors duration-150 ${getCategoryColor(item.category)}`}>{item.category}</Badge>
            </div>
          </div>
          
          {/* Risk and CVSS Information */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
              <Badge className={`text-[10px] sm:text-xs px-1.5 py-0.5 border bg-card text-foreground border-border hover:bg-card/90 hover:text-foreground focus:ring-2 focus:ring-primary/20 transition-colors duration-150 ${getRiskColor(item.riskLevel)}`}>Risk: {item.riskLevel.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
              <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${getCVSSColor(item.cvssScore)}`}>
                CVSS: {item.cvssScore.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Confidence: {(item.confidence * 100).toFixed(0)}%
              </span>
              <Progress value={item.confidence * 100} className="w-12 sm:w-16 h-1.5 sm:h-2 flex-shrink-0" />
            </div>
          </div>
          
          {/* CVE IDs and Affected Systems */}
          {(item.cveIds && item.cveIds.length > 0) || (item.affectedSystems && item.affectedSystems.length > 0) ? (
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
              {item.cveIds && item.cveIds.map((cveId, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-muted text-muted-foreground border border-border hover:bg-muted/90 hover:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-colors duration-150">{cveId}</Badge>
              ))}
              {item.affectedSystems && item.affectedSystems.map((system, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-muted text-muted-foreground border border-border hover:bg-muted/90 hover:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-colors duration-150 break-all">{system}</Badge>
              ))}
            </div>
          ) : null}
          
          {item.description && (
            <p className={`text-xs sm:text-sm mb-2 sm:mb-3 break-words ${
              item.completed 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {item.description}
            </p>
          )}
          

        </div>
      </div>
    </motion.div>
  );
};

// DropIndicator component
const DropIndicator = ({ id }: { id: string }) => {
  const { isOver } = useDroppable({ id });
  return (
    <div
      className={`transition-all duration-150 h-0.5 flex items-center justify-center -my-1 ${isOver ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden={!isOver}
    >
      <div className="w-full h-1.5 rounded bg-primary" />
    </div>
  );
};

// Add animation variants for staggered reveal
const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } }
};

const TodoListButton: React.FC<TodoListButtonProps> = ({ message, chatId, className = '' }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTodoList, setShowTodoList] = useState(false);
  const [todoList, setTodoList] = useState<TodoList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [lastSavedOrder, setLastSavedOrder] = useState<string[]>([]);
  const [lastSavedCompletionStatus, setLastSavedCompletionStatus] = useState<Array<{id: string, completed: boolean}>>([]);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Get user from store
  const user = useStore((state) => state.user);
  
  // TODO List Generation Modal
  const { openModal, closeModal, isModalOpen } = useTodoListGenerationModal();
  
  // Convex mutations and queries
  const generateTodoTasksAction = useAction(api.todoApi.generateTodoTasksOnDemand);
  const updateTodoListMutation = useMutation(api.todoApi.saveTodoList);
  const getTodoListFromChatQuery = useQuery(api.todoApi.getTodoListFromChat, { 
    chatId, 
    messageId: message.humanInTheLoopId || message.id || '' 
  });
  const chatHistory = useQuery(api.chats.getChatHistory, { chatId });

  // Debug the query result
  React.useEffect(() => {
    console.log('[TodoListButton] Query result:', {
      getTodoListFromChatQuery,
      hasSuccess: getTodoListFromChatQuery?.success,
      hasTodoList: !!getTodoListFromChatQuery?.todoList,
      messageId: message.humanInTheLoopId || message.id,
      chatId
    });
  }, [getTodoListFromChatQuery, message.humanInTheLoopId, message.id, chatId]);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

    const generateTodoList = async (forceRegenerate = false) => {
      if (message.sender !== 'ai') {
        return;
      }

      // Check if TODO list already exists and we're not forcing regeneration
      if (!forceRegenerate && getTodoListFromChatQuery?.success && getTodoListFromChatQuery.todoList) {
        setTodoList(getTodoListFromChatQuery.todoList);
        setLastSavedOrder(getTodoListFromChatQuery.todoList.items.map((item: TodoItem) => item.id));
        setLastSavedCompletionStatus(getTodoListFromChatQuery.todoList.items.map((item: TodoItem) => ({ id: item.id, completed: item.completed })));
        setShowTodoList(true);
        return;
      }

      // Open the animated modal for TODO list generation
      const messageIdToUse = message.humanInTheLoopId || message.id || '';
      openModal(messageIdToUse, chatId);

      setIsGenerating(true);
      setError(null);
      setProgress(0);
      setCurrentStep(0);

      try {
        // Step 1: Analyzing Response
        setCurrentStep(0);
        setProgress(33);
        await new Promise(resolve => setTimeout(resolve, 1500));

        let result;
        let retryCount = 0;
        const maxRetries = 3;
        
        // Step 2: Generating Tasks
        setCurrentStep(1);
        setProgress(66);
        
        while (retryCount < maxRetries) {
          try {
            // Get the user question from the chat history
            const userQuestion = chatHistory ? (() => {
              const userMessages = chatHistory.filter((msg: any) => msg.sender === 'user');
              return userMessages[userMessages.length - 1]?.message || 'Security analysis request';
            })() : 'Security analysis request';

            const apiParams = {
              chatId: chatId,
              messageId: messageIdToUse,
              userQuestion: userQuestion,
              aiResponse: message.message || '',
              kgContext: message.reasoningTrace ? JSON.stringify(message.reasoningTrace) : undefined,
              cveInfo: message.cveDescriptionsMap ? {
                cve_id: Object.keys(message.cveDescriptionsMap)[0],
                cve_desc: Object.values(message.cveDescriptionsMap)[0],
              } : undefined,
              reasoningTrace: message.reasoningTrace,
              sourceLinks: message.sourceLinks,
              jargons: message.jargons,
            };

            result = await generateTodoTasksAction(apiParams);
            break;
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw error;
            }
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        // Step 3: Finalizing
        setCurrentStep(2);
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (result.success && result.todoList) {
          setTodoList(result.todoList);
          setLastSavedOrder(result.todoList.items.map((item: TodoItem) => item.id));
          setLastSavedCompletionStatus(result.todoList.items.map((item: TodoItem) => ({ id: item.id, completed: item.completed })));
          setShowTodoList(true);
          
          // Auto-close modal after a brief delay to show completion
          setTimeout(() => {
            closeModal();
          }, 1000);
        } else {
          throw new Error('Failed to generate TODO list');
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate TODO list';
        
        if (errorMessage.includes('Chat history entry not found')) {
          setError('TODO list generation failed. Please try again.');
        } else if (errorMessage.includes('setTimeout')) {
          setError('TODO list generation failed. Please try again.');
        } else {
          setError(errorMessage);
        }
        closeModal(); // Close modal on error
      } finally {
        setIsGenerating(false);
      }
    };

  const toggleTodoList = async () => {
    if (showTodoList) {
      setShowTodoList(false);
    } else {
      // Check if TODO list already exists in Convex
      if (getTodoListFromChatQuery?.success && getTodoListFromChatQuery.todoList) {
        // Load existing TODO list
        setTodoList(getTodoListFromChatQuery.todoList);
        setLastSavedOrder(getTodoListFromChatQuery.todoList.items.map((item: TodoItem) => item.id));
        setLastSavedCompletionStatus(getTodoListFromChatQuery.todoList.items.map((item: TodoItem) => ({ id: item.id, completed: item.completed })));
        setShowTodoList(true);
      } else {
        // Generate new TODO list only if none exists
        await generateTodoList(false);
      }
    }
  };

  // Cancel TODO list generation
  const cancelGeneration = () => {
    setIsGenerating(false);
    setError(null);
    setProgress(0);
    setCurrentStep(0);
    closeModal();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && todoList) {
      const oldIndex = todoList.items.findIndex(item => item.id === active.id);
      const newIndex = todoList.items.findIndex(item => item.id === over?.id);

      setTodoList(prev => {
        if (!prev) return prev;
        const newItems = arrayMove(prev.items, oldIndex, newIndex);
        
        // Auto-save the new order (prev should be clean without extra fields)
        autoSaveTodoList({
          ...prev,
          items: newItems
        });
        
        return {
          ...prev,
          items: newItems
        };
      });
    }
  };

  const autoSaveTodoList = async (updatedTodoList: TodoList) => {
    if (!updatedTodoList || !chatId) {
      return;
    }
    
    // Check if order has changed
    const currentOrder = updatedTodoList.items.map(item => item.id);
    const orderHasChanged = JSON.stringify(currentOrder) !== JSON.stringify(lastSavedOrder);
    
    // Check if completion status has changed
    const currentCompletionStatus = updatedTodoList.items.map(item => ({ id: item.id, completed: item.completed }));
    const completionHasChanged = JSON.stringify(currentCompletionStatus) !== JSON.stringify(lastSavedCompletionStatus);

    if (!orderHasChanged && !completionHasChanged) {
      return; // No change, don't save
    }

    setIsSaving(true);
    try {
      // Add retry mechanism for auto-save
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount < maxRetries) {
        try {
          // Use the messageId from the message object since todoList is now clean
          const messageIdToUse = message.humanInTheLoopId || message.id || '';
          
          // Validate that we have the correct messageId
          if (!messageIdToUse) {
            throw new Error("No messageId available for auto-save");
          }
          
          // Remove extra fields that are not allowed by the schema
          const { chatId: todoListChatId, messageId: todoListMessageId, ...cleanTodoList } = updatedTodoList as any;
          
          await updateTodoListMutation({
            chatId,
            messageId: messageIdToUse,
            todoList: cleanTodoList,
          });
          
          // If successful, break out of retry loop
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw error; // Re-throw if max retries reached
          }
          
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      setLastSavedOrder(currentOrder);
      setLastSavedCompletionStatus(currentCompletionStatus);
      
      // Show success message briefly
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000); // Hide after 2 seconds
    } catch (err) {
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleItem = (itemId: string) => {
    if (!todoList) return;
    
    setTodoList(prev => {
      if (!prev) return prev;
      const updatedItems = prev.items.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      
      const updatedTodoList = {
        ...prev,
        items: updatedItems
      };
      
      // Auto-save when items are toggled
      autoSaveTodoList(updatedTodoList);
      
      return updatedTodoList;
    });
  };

  const downloadAsPDF = async () => {
    if (!todoList) return;
    
    setIsDownloading(true);
    try {
      // Create PDF content
      const pdfContent = `
        <html>
          <head>
            <title>Security TODO List - ${todoList.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .item { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
              .completed { background-color: #f8f9fa; text-decoration: line-through; }
              .priority-high { border-left: 4px solid #dc3545; }
              .priority-medium { border-left: 4px solid #ffc107; }
              .priority-low { border-left: 4px solid #28a745; }
              .risk-critical { background-color: #f8d7da; }
              .risk-high { background-color: #fff3cd; }
              .risk-medium { background-color: #d1ecf1; }
              .risk-low { background-color: #d4edda; }
              .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin: 2px; }
              .cvss-score { font-weight: bold; color: #dc3545; }
              .confidence { color: #6c757d; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${todoList.title}</h1>
              <p>${todoList.description}</p>
              <p>Generated on: ${new Date(todoList.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div class="summary">
              <h3>Summary</h3>
              <p>Total Items: ${todoList.items.length}</p>
              <p>Completed: ${todoList.items.filter(item => item.completed).length}</p>
              <p>High Priority: ${todoList.items.filter(item => item.priority === 'high').length}</p>
              <p>Critical Risk: ${todoList.items.filter(item => item.riskLevel === 'critical').length}</p>
            </div>
            
            <h3>Action Items</h3>
            ${todoList.items.map((item, index) => `
              <div class="item ${item.completed ? 'completed' : ''} priority-${item.priority} risk-${item.riskLevel}">
                <h4>${index + 1}. ${item.task}</h4>
                <p><strong>Priority:</strong> <span class="badge priority-${item.priority}">${item.priority.toUpperCase()}</span></p>
                <p><strong>Category:</strong> <span class="badge">${item.category}</span></p>
                <p><strong>Risk Level:</strong> <span class="badge risk-${item.riskLevel}">${item.riskLevel.toUpperCase()}</span></p>
                <p><strong>CVSS Score:</strong> <span class="cvss-score">${item.cvssScore.toFixed(1)}</span></p>
                <p><strong>Confidence:</strong> <span class="confidence">${(item.confidence * 100).toFixed(0)}%</span></p>
                ${item.cveIds && item.cveIds.length > 0 ? `<p><strong>CVE IDs:</strong> ${item.cveIds.join(', ')}</p>` : ''}
                ${item.affectedSystems && item.affectedSystems.length > 0 ? `<p><strong>Affected Systems:</strong> ${item.affectedSystems.join(', ')}</p>` : ''}
                ${item.description ? `<p><strong>Description:</strong> ${item.description}</p>` : ''}

              </div>
            `).join('')}
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `security-todo-list-${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('[TodoListButton] Error downloading PDF:', err);
      setError('Failed to download TODO list');
    } finally {
      setIsDownloading(false);
    }
  };

  // Update color utility functions to use theme tokens
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border border-destructive/20';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800';
      case 'low': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-800';
      default: return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Security': return 'bg-primary/10 text-primary border border-primary/20';
      case 'Updates': return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800';
      case 'Configuration': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-800';
      case 'Monitoring': return 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800';
      case 'Testing': return 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 border border-pink-300 dark:border-pink-800';
      default: return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-destructive/10 text-destructive border border-destructive/20';
      case 'high': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-800';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800';
      case 'low': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-800';
      default: return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getCVSSColor = (score: number) => {
    if (score >= 9.0) return 'text-destructive';
    if (score >= 7.0) return 'text-orange-600 dark:text-orange-400';
    if (score >= 4.0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Only show for AI messages
  if (message.sender !== 'ai') {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* TODO List Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              toggleTodoList();
            }}
            disabled={isGenerating}
            className={`h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full transition-all duration-200 touch-manipulation ${
              showTodoList 
                ? 'bg-sidebar-accent text-sidebar-primary hover:bg-sidebar-accent/80' 
                : 'hover:bg-sidebar-accent'
            }`}
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : showTodoList ? (
              <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isGenerating 
            ? 'Generating TODO list...' 
            : showTodoList 
              ? 'Hide TODO list' 
              : 'Generate TODO list'
          }
        </TooltipContent>
      </Tooltip>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-xs text-red-600 dark:text-red-400 max-w-xs z-50"
          >
            <div className="mb-2">{error}</div>
            <Button
              onClick={() => {
                setError(null);
                generateTodoList();
              }}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              Retry
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TODO List Modal */}
      <Dialog open={showTodoList} onOpenChange={setShowTodoList}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl w-full h-[95vh] sm:h-[85vh] md:h-[80vh] p-0 bg-background text-foreground border border-border rounded-lg overflow-hidden flex flex-col">
          {todoList && (
            <>
              <DialogHeader className="p-3 sm:p-4 md:p-6 border-b border-border bg-card flex-shrink-0 relative">
                {/* Title and Close Button Row */}
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 pr-8 sm:pr-4"
                  >
                    <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <DialogTitle className="truncate text-sm sm:text-base md:text-lg font-semibold">{todoList.title}</DialogTitle>
                  </motion.div>
                </div>
                
                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 md:mb-4 line-clamp-2 sm:line-clamp-none">
                  {todoList.description}
                </p>
                
                {/* Status and Action Buttons Row */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center justify-between">
                  {/* Status indicators */}
                  <div className="flex items-center gap-2 flex-shrink-0 order-2 sm:order-1">
                    {isSaving && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="hidden xs:inline">Saving...</span>
                      </div>
                    )}
                    {showSaveSuccess && (
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        <span className="hidden xs:inline">Saved!</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
                    <Button
                      onClick={() => {
                        setShowMoveDialog(true);
                      }}
                      disabled={false} // Temporarily enable for debugging
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 flex-1 sm:flex-initial sm:w-auto justify-center text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="hidden sm:inline whitespace-nowrap">Move to My Space</span>
                      <span className="sm:hidden whitespace-nowrap">Move</span>
                      {!user && <span className="text-xs hidden md:inline">(No User)</span>}
                    </Button>
                    <Button
                      onClick={downloadAsPDF}
                      disabled={isDownloading}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 flex-1 sm:flex-initial sm:w-auto justify-center text-xs sm:text-sm px-2 sm:px-3"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                      ) : (
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      )}
                      <span className="whitespace-nowrap">{isDownloading ? 'Generating...' : 'Download'}</span>
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              
              <ScrollArea className="flex-1 p-2 sm:p-3 md:p-6 bg-background min-h-0 scroll-smooth overscroll-contain">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={todoList.items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <AnimatePresence>
                      <motion.div
                        className="space-y-2 sm:space-y-3 pt-2 pb-2 sm:pt-4 sm:pb-4"
                        variants={listVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      >
                        {todoList.items.map((item, index) => (
                          <React.Fragment key={item.id}>
                            <DropIndicator id={`drop-${item.id}-before`} />
                            <motion.div variants={itemVariants}>
                              <SortableTodoItem
                                item={item}
                                index={index}
                                onToggle={handleToggleItem}
                                getPriorityColor={getPriorityColor}
                                getCategoryColor={getCategoryColor}
                                getRiskColor={getRiskColor}
                                getCVSSColor={getCVSSColor}
                              />
                            </motion.div>
                          </React.Fragment>
                        ))}
                        <DropIndicator id={`drop-end`} />
                      </motion.div>
                    </AnimatePresence>
                  </SortableContext>
                </DndContext>
              </ScrollArea>
              
              <div className="p-2 sm:p-3 md:p-6 border-t border-border bg-sidebar flex-shrink-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs sm:text-sm gap-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-sidebar-foreground font-medium text-xs sm:text-sm">
                        {todoList.items.filter(item => item.completed).length} of {todoList.items.length} completed
                      </span>
                    </div>
                    <div className="hidden sm:block h-1 w-1 rounded-full bg-sidebar-foreground/30" />
                    <span className="text-sidebar-foreground/70 text-xs sm:text-sm">
                      {Math.round((todoList.items.filter(item => item.completed).length / todoList.items.length) * 100)}% done
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sidebar-foreground/60 text-xs">
                    <span>Created</span>
                    <span className="text-sidebar-foreground font-medium">
                      {new Date(todoList.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Move to My Space Dialog */}
      {user && (
        <MoveTodoToSpaceDialog
          open={showMoveDialog}
          onOpenChange={setShowMoveDialog}
          todoList={todoList}
          userId={user.id}
          chatId={chatId}
          messageId={message.humanInTheLoopId || message.id}
          onSuccess={() => {
            // Toast notification is handled by MoveTodoToSpaceDialog component
          }}
        />
      )}

      {/* TODO List Generation Modal */}
      <TodoListGenerationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onCancel={cancelGeneration}
        progress={progress}
        currentStep={currentStep}
      />
    </div>
  );
};

export default TodoListButton; 