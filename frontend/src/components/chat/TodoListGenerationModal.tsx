import React, { useState, useEffect } from 'react';
import { ListTodo, Sparkles, CheckCircle, Brain } from 'lucide-react';

interface TodoListGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  progress?: number; // Progress from 0 to 100
  currentStep?: number; // Current step index (0-6)
}

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  emoji: string;
  completed: boolean;
  active: boolean;
}

const TodoListGenerationModal: React.FC<TodoListGenerationModalProps> = ({
  isOpen,
  onClose,
  onCancel,
  progress: externalProgress,
  currentStep: externalCurrentStep,
}) => {
  const [currentStep, setCurrentStep] = useState(externalCurrentStep || 0);
  const [progress, setProgress] = useState(externalProgress || 0);

  const steps: ProgressStep[] = [
    {
      id: 'analyzing',
      title: 'Analyzing Response',
      description: 'Extracting security insights',
      icon: <Brain className="w-5 h-5" />,
      emoji: '🧠',
      completed: false,
      active: false,
    },
    {
      id: 'generating',
      title: 'Generating Tasks',
      description: 'Creating actionable security tasks',
      icon: <ListTodo className="w-5 h-5" />,
      emoji: '📝',
      completed: false,
      active: false,
    },
    {
      id: 'finalizing',
      title: 'Finalizing',
      description: 'Preparing your action plan',
      icon: <CheckCircle className="w-5 h-5" />,
      emoji: '🎉',
      completed: false,
      active: false,
    },
  ];

  // Update local state when external props change
  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
    }
  }, [externalProgress]);

  useEffect(() => {
    if (externalCurrentStep !== undefined) {
      setCurrentStep(externalCurrentStep);
    }
  }, [externalCurrentStep]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    // If external progress is provided, don't use internal timer
    if (externalProgress !== undefined || externalCurrentStep !== undefined) {
      return;
    }

    // Fallback to internal timer if no external progress provided
    const stepDuration = 6000; // 6 seconds per step
    const totalDuration = stepDuration * steps.length;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / totalDuration) * 100;
        return Math.min(newProgress, 100);
      });
    }, 100);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = prev + 1;
        if (nextStep >= steps.length) {
          clearInterval(stepInterval);
          clearInterval(progressInterval);
          // Auto-close after completion
          setTimeout(() => {
            onClose();
          }, 2000);
          return prev;
        }
        return nextStep;
      });
    }, stepDuration);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isOpen, onClose, steps.length, externalProgress, externalCurrentStep]);

  const getCurrentStep = () => {
    return steps[currentStep] || steps[0];
  };

  const getCompletedSteps = () => {
    return steps.slice(0, currentStep);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl transform transition-all duration-300 ease-out scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
            <ListTodo className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Generating TODO List
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Creating security tasks for your response
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="mb-4">
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <div className="text-2xl animate-bounce">
              {getCurrentStep().emoji}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center text-sm">
                {getCurrentStep().icon}
                <span className="ml-2">{getCurrentStep().title}</span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                {getCurrentStep().description}
              </p>
            </div>
          </div>
        </div>

        {/* Completed Steps - Compact */}
        {getCompletedSteps().length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {getCompletedSteps().map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center space-x-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-700 text-xs"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-green-800 dark:text-green-200 font-medium">
                    {step.emoji} {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fun Fact - Compact */}
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center space-x-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
              Security Insight:
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-300">
            {currentStep === 0 && "🧠 Analyzing security concepts in your response"}
            {currentStep === 1 && "📝 Creating actionable security tasks"}
            {currentStep === 2 && "🎉 Your personalized action plan is ready!"}
          </p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={() => {
            if (onCancel) {
              onCancel();
            } else {
              onClose();
            }
          }}
          className="w-full px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200"
        >
          Cancel Generation
        </button>
      </div>
    </div>
  );
};

export default TodoListGenerationModal;
