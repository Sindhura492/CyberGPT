import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Square, 
  GripVertical, 
  Loader2,
  FileText
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

interface TodoItem {
  id: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  completed: boolean;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  cvssScore: number;
  confidence: number;
  cveIds: string[];
  affectedSystems: string[];
  emoji: string;
  createdAt: number;
}

interface TodoList {
  id: string;
  title: string;
  description: string;
  items: TodoItem[];
  createdAt: number;
}

interface InteractiveTodoListProps {
  reportId: Id<'reports'>;
  todoListData: TodoList;
  markdownContent: string;
  onUpdate: (updatedTodoList: TodoList, updatedMarkdown: string) => void;
  chatId?: string;
  messageId?: string;
}

// Sortable TODO item component
const SortableTodoItem: React.FC<{
  item: TodoItem;
  onToggle: (id: string) => void;
}> = ({ item, onToggle }) => {
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
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`group relative bg-card border border-border rounded-lg p-2.5 sm:p-3 md:p-4 mb-2 sm:mb-3 transition-all duration-200 hover:shadow-md ${
        item.completed ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 sm:p-1 hover:bg-sidebar-accent rounded touch-none flex-shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sidebar-foreground" />
        </div>

        {/* Checkbox */}
        <button
          onClick={() => onToggle(item.id)}
          className="mt-0.5 sm:mt-1 flex-shrink-0 touch-manipulation"
        >
          {item.completed ? (
            <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          ) : (
            <Square className="h-4 w-4 sm:h-5 sm:w-5 text-sidebar-foreground hover:text-green-600" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium text-xs sm:text-sm leading-relaxed break-words ${
                item.completed ? 'line-through text-muted-foreground' : ''
              }`}>
                <span className="mr-1.5 sm:mr-2">{item.emoji}</span>
                {item.task}
              </h4>
              {item.description && (
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-relaxed break-words">
                  {item.description}
                </p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
            <Badge 
              variant="secondary" 
              className={`text-[10px] sm:text-xs px-1.5 py-0.5 ${getPriorityColor(item.priority)}`}
            >
              {item.priority.toUpperCase()}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`text-[10px] sm:text-xs px-1.5 py-0.5 ${getRiskColor(item.riskLevel)}`}
            >
              {item.riskLevel.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
              CVSS {item.cvssScore.toFixed(1)}
            </Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
              {item.category}
            </Badge>
            {item.cveIds.length > 0 && (
              <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                {item.cveIds.length} CVE{item.cveIds.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* CVE IDs */}
          {item.cveIds.length > 0 && (
            <div className="mt-1.5 sm:mt-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
                <strong>CVE IDs:</strong> {item.cveIds.join(', ')}
              </p>
            </div>
          )}

          {/* Affected Systems */}
          {item.affectedSystems.length > 0 && (
            <div className="mt-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
                <strong>Affected Systems:</strong> {item.affectedSystems.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const InteractiveTodoList: React.FC<InteractiveTodoListProps> = ({
  reportId,
  todoListData,
  markdownContent: _markdownContent,
  onUpdate,
  chatId,
  messageId
}) => {
  const [todoList, setTodoList] = useState<TodoList>(todoListData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastSavedOrder, setLastSavedOrder] = useState<string[]>([]);
  const [lastSavedCompletionStatus, setLastSavedCompletionStatus] = useState<Array<{id: string, completed: boolean}>>([]);

  const updateTodoListMutation = useMutation(api.reports.updateTodoListData);
  const syncToMainChatMutation = useMutation(api.todoApi.syncTodoListFromMySpace);

  // Initialize tracking arrays
  useEffect(() => {
    setLastSavedOrder(todoList.items.map(item => item.id));
    setLastSavedCompletionStatus(todoList.items.map(item => ({ id: item.id, completed: item.completed })));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-save functionality
  const autoSaveTodoList = async (updatedTodoList: TodoList) => {
    const currentOrder = updatedTodoList.items.map(item => item.id);
    const currentCompletionStatus = updatedTodoList.items.map(item => ({ id: item.id, completed: item.completed }));

    // Check if order or completion status has changed
    const orderChanged = JSON.stringify(currentOrder) !== JSON.stringify(lastSavedOrder);
    const completionChanged = JSON.stringify(currentCompletionStatus) !== JSON.stringify(lastSavedCompletionStatus);

    if (orderChanged || completionChanged) {
      setIsSaving(true);

      try {
        // Generate updated markdown content
        const updatedMarkdown = generateMarkdownContent(updatedTodoList);

        // Update in database
        await updateTodoListMutation({
          reportId,
          todoListData: updatedTodoList,
          markdownContent: updatedMarkdown,
        });

        // Sync changes back to main chat if chatId and messageId are available
        if (chatId && messageId) {
          try {
            await syncToMainChatMutation({
              chatId: chatId as any,
              messageId: messageId,
              todoListData: updatedTodoList,
            });
            console.log('✅ Synced TODO list changes back to main chat');
          } catch (syncError) {
            console.warn('⚠️ Failed to sync changes to main chat:', syncError);
            // Don't fail the entire operation if sync fails
          }
        }

        // Update tracking arrays
        setLastSavedOrder(currentOrder);
        setLastSavedCompletionStatus(currentCompletionStatus);

        // Notify parent component
        onUpdate(updatedTodoList, updatedMarkdown);
      } catch (error) {
        console.error('Error saving TODO list:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const generateMarkdownContent = (list: TodoList): string => {
    if (!list) return '';

    let markdown = `# ${list.title}\n\n`;
    markdown += `**Description:** ${list.description}\n\n`;
    markdown += `**Generated On:** ${new Date(list.createdAt).toLocaleDateString()}\n\n`;
    markdown += `## Action Items\n\n`;

    list.items.forEach((item, index) => {
      const status = item.completed ? '✅' : '⬜';
      const priorityEmoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      const riskEmoji = item.riskLevel === 'critical' ? '🚨' : item.riskLevel === 'high' ? '⚠️' : item.riskLevel === 'medium' ? '⚡' : 'ℹ️';

      markdown += `### ${status} ${index + 1}. ${item.task}\n`;
      markdown += `- **Priority:** ${priorityEmoji} ${item.priority.toUpperCase()}\n`;
      markdown += `- **Category:** ${item.category}\n`;
      markdown += `- **Risk Level:** ${riskEmoji} ${item.riskLevel.toUpperCase()}\n`;
      markdown += `- **CVSS Score:** ${item.cvssScore.toFixed(1)}\n`;
      markdown += `- **Confidence:** ${(item.confidence * 100).toFixed(0)}%\n`;
      if (item.cveIds && item.cveIds.length > 0) {
        markdown += `- **CVE IDs:** ${item.cveIds.join(', ')}\n`;
      }
      if (item.affectedSystems && item.affectedSystems.length > 0) {
        markdown += `- **Affected Systems:** ${item.affectedSystems.join(', ')}\n`;
      }
      if (item.description) {
        markdown += `- **Details:** ${item.description}\n`;
      }
      markdown += '\n';
    });

    return markdown;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = todoList.items.findIndex(item => item.id === active.id);
      const newIndex = todoList.items.findIndex(item => item.id === over.id);

      const updatedTodoList = {
        ...todoList,
        items: arrayMove(todoList.items, oldIndex, newIndex)
      };

      setTodoList(updatedTodoList);
      autoSaveTodoList(updatedTodoList);
    }
  };

  const handleToggleItem = (itemId: string) => {
    const updatedTodoList = {
      ...todoList,
      items: todoList.items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    };

    setTodoList(updatedTodoList);
    autoSaveTodoList(updatedTodoList);
  };

  const downloadAsMarkdown = () => {
    setIsDownloading(true);
    
    try {
      // Generate markdown content
      const markdownContent = generateMarkdownContent(todoList);
      
      // Create a blob with the markdown content
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${todoList.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);} catch (error) {} finally {
      setIsDownloading(false);
    }
  };

  const completedCount = todoList.items.filter(item => item.completed).length;
  const totalCount = todoList.items.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2 break-words">
              {todoList.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground break-words">
              {todoList.description}
            </p>
          </div>
          <div className="flex flex-row sm:flex-col md:flex-row gap-2 items-center sm:items-end md:items-center flex-shrink-0">
            {isSaving && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                <span className="hidden xs:inline">Saving...</span>
              </div>
            )}
            <Button
              onClick={downloadAsMarkdown}
              disabled={isDownloading}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
              ) : (
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              )}
              <span className="hidden xs:inline">{isDownloading ? 'Downloading...' : 'Download Markdown'}</span>
              <span className="xs:hidden">{isDownloading ? 'Downloading...' : 'Download'}</span>
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-1.5 sm:h-2 mb-2">
          <div
            className="bg-green-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="flex flex-col xs:flex-row justify-between gap-1 xs:gap-2 text-xs sm:text-sm text-muted-foreground">
          <span>{completedCount} of {totalCount} tasks completed</span>
          <span>{completionPercentage}% complete</span>
        </div>
      </div>

      {/* TODO Items */}
      <div id="interactive-todo-content">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={todoList.items.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <ScrollArea className="h-[50vh] sm:h-[55vh] md:h-[60vh] pr-2 sm:pr-4">
              <AnimatePresence>
                {todoList.items.map((item) => (
                  <SortableTodoItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggleItem}
                  />
                ))}
              </AnimatePresence>
            </ScrollArea>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
