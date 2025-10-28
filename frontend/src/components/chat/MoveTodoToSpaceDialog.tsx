import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Folder, Plus, Save } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { TodoList, TodoItem } from './TodoListButton';
import { showSuccessToast, showErrorToast } from '../toaster';

interface Folder {
  id: string;
  name: string;
  files: any[];
  createdAt: Date;
}

interface MoveTodoToSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todoList: TodoList | null;
  userId: string;
  onSuccess: () => void;
  chatId?: string;
  messageId?: string;
}

export function MoveTodoToSpaceDialog({
  open,
  onOpenChange,
  todoList,
  userId,
  onSuccess,
  chatId,
  messageId,
}: MoveTodoToSpaceDialogProps) {
  const [todoListName, setTodoListName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Convex mutations and queries
  const folderData = useQuery(api.reports.getReportFoldersByUser, { userId: String(userId) });
  const createFolder = useMutation(api.reports.createReportFolder);
  const saveTodoListToFolder = useMutation(api.reports.saveTodoListToFolder);

  // Convert folder data to Folder interface
  const folders: Folder[] = folderData ? folderData.map((item: any) => ({
    id: item._id,
    name: item.folderName,
    files: [],
    createdAt: new Date(item.createdAt),
  })) : [];

  const handleSave = async () => {
    if (!todoList || !todoListName.trim()) {
      showErrorToast('❌ Please enter a name for your TODO list');
      return;
    }

    if (!selectedFolderId && !newFolderName.trim()) {
      showErrorToast('❌ Please select a folder or create a new one');
      return;
    }

    if (showNewFolderInput && !newFolderName.trim()) {
      showErrorToast('❌ Please enter a name for the new folder');
      return;
    }

    // Check if folder name already exists
    if (showNewFolderInput && folders?.some(f => f.name.toLowerCase() === newFolderName.trim().toLowerCase())) {
      showErrorToast('❌ A folder with this name already exists');
      return;
    }

    setIsSaving(true);
    try {
      let targetFolderId = selectedFolderId;

      // Create new folder if needed
      if (showNewFolderInput && newFolderName.trim()) {
        const newFolderId = await createFolder({
          userId: String(userId),
          folderName: newFolderName.trim(),
        });
        targetFolderId = newFolderId;
      }

      if (!targetFolderId) {
        throw new Error('Please select or create a folder');
      }

      // Convert TODO list to markdown content
      const markdownContent = generateMarkdownContent(todoList, todoListName);

      // Save TODO list to folder
      await saveTodoListToFolder({
        folderId: targetFolderId as any,
        todoListName: todoListName.trim(),
        todoListData: todoList,
        markdownContent,
        chatId: chatId,
        messageId: messageId,
      });

      // Show success toast
      showSuccessToast(`✅ TODO list "${todoListName.trim()}" saved to My Space successfully!`);

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setTodoListName('');
      setSelectedFolderId('');
      setNewFolderName('');
      setShowNewFolderInput(false);
    } catch (error) {// Show error toast
      const errorMessage = error instanceof Error ? error.message : 'Failed to save TODO list';
      showErrorToast(`❌ Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const generateMarkdownContent = (todoList: TodoList, title: string): string => {
    const completedCount = todoList.items.filter((item: TodoItem) => item.completed).length;
    const totalCount = todoList.items.length;
    const progressPercentage = Math.round((completedCount / totalCount) * 100);

    let markdown = `# ${title}\n\n`;
    markdown += `**Description:** ${todoList.description}\n\n`;
    markdown += `**Progress:** ${completedCount}/${totalCount} tasks completed (${progressPercentage}%)\n\n`;
    markdown += `**Created:** ${new Date(todoList.createdAt).toLocaleDateString()}\n\n`;
    
    if (todoList.lastModified) {
      markdown += `**Last Modified:** ${new Date(todoList.lastModified).toLocaleDateString()}\n\n`;
    }

    markdown += `## Action Items\n\n`;

    todoList.items.forEach((item: TodoItem, index: number) => {
      const status = item.completed ? '✅' : '⏳';
      const priority = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      const risk = item.riskLevel === 'critical' ? '🚨' : item.riskLevel === 'high' ? '⚠️' : item.riskLevel === 'medium' ? '⚡' : 'ℹ️';
      
      markdown += `### ${index + 1}. ${status} ${item.task}\n\n`;
      markdown += `- **Priority:** ${priority} ${item.priority.toUpperCase()}\n`;
      markdown += `- **Category:** ${item.category}\n`;
      markdown += `- **Risk Level:** ${risk} ${item.riskLevel.toUpperCase()}\n`;
      markdown += `- **CVSS Score:** ${item.cvssScore.toFixed(1)}/10\n`;
      markdown += `- **Confidence:** ${Math.round(item.confidence * 100)}%\n`;
      
      if (item.cveIds && item.cveIds.length > 0) {
        markdown += `- **CVE IDs:** ${item.cveIds.join(', ')}\n`;
      }
      
      if (item.affectedSystems && item.affectedSystems.length > 0) {
        markdown += `- **Affected Systems:** ${item.affectedSystems.join(', ')}\n`;
      }
      
      if (item.description) {
        markdown += `- **Description:** ${item.description}\n`;
      }
      
      markdown += `\n`;
    });

    return markdown;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Move TODO List to My Space
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* TODO List Name */}
          <div className="grid gap-2">
            <Label htmlFor="todoListName">TODO List Name</Label>
            <Input
              id="todoListName"
              value={todoListName}
              onChange={(e) => setTodoListName(e.target.value)}
              placeholder="Enter a name for your TODO list"
            />
          </div>

          {/* Folder Selection */}
          <div className="grid gap-2">
            <Label>Save to Folder</Label>
            <div className="space-y-2">
              {/* Existing folders */}
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`p-2 border rounded-md cursor-pointer transition-colors ${
                    selectedFolderId === folder.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setSelectedFolderId(folder.id);
                    setShowNewFolderInput(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {folder.name}
                  </div>
                </div>
              ))}
              
              {/* Create new folder option */}
              <div
                className={`p-2 border rounded-md cursor-pointer transition-colors ${
                  showNewFolderInput
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => {
                  setShowNewFolderInput(true);
                  setSelectedFolderId('');
                }}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Folder
                </div>
              </div>
            </div>
          </div>

          {/* New Folder Input */}
          {showNewFolderInput && (
            <div className="grid gap-2">
              <Label htmlFor="newFolderName">New Folder Name</Label>
              <Input
                id="newFolderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter new folder name"
              />
            </div>
          )}

          {/* Preview */}
          {todoList && (
            <div className="grid gap-2">
              <Label>Preview</Label>
              <div className="p-3 bg-muted rounded-md text-sm">
                <div className="font-medium">{todoListName || 'Untitled TODO List'}</div>
                <div className="text-muted-foreground">
                  {todoList.items.length} tasks • {todoList.items.filter((item: TodoItem) => item.completed).length} completed
                </div>
                <div className="text-muted-foreground">
                  Folder: {showNewFolderInput ? newFolderName || 'New Folder' : folders.find(f => f.id === selectedFolderId)?.name || 'Select folder'}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !todoListName.trim() || (!selectedFolderId && !newFolderName.trim())}
          >
            {isSaving ? 'Saving...' : 'Save to My Space'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
