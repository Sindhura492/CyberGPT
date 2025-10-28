import React, { useState } from 'react';
import { chatWithJargon } from '../../api/chat';
import { ReasoningTrace } from './ReasoningTrace';

export const GraphRAGTest: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [reasoningTrace, setReasoningTrace] = useState<Array<{ step: string; message: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setAnswer('');
    setReasoningTrace([]);

    try {
      const response = await chatWithJargon({ message: question, agentPersonality: 'tutor' });
      setAnswer(response.answer);
      setReasoningTrace(response.reasoningTrace);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testQuestions = [
    "What is SQL injection?",
    "How to prevent XSS attacks?",
    "What is CVE-2021-44228?",
    "How to secure API endpoints?",
    "What are the risks of using weak passwords?"
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">GraphRAG Integration Test</h2>
        <p className="text-blue-700 text-sm">
          This component tests the GraphRAG functionality. Ask cybersecurity questions and see the reasoning trace.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Questions (click to use):
          </label>
          <div className="flex flex-wrap gap-2">
            {testQuestions.map((q, index) => (
              <button
                key={index}
                onClick={() => setQuestion(q)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question:
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Ask a cybersecurity question..."
          />
        </div>

        <button
          onClick={handleTest}
          disabled={isLoading || !question.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Test GraphRAG'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-900 font-medium">Error:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {answer && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-900 font-medium mb-2">Answer:</h3>
            <div className="text-green-800 whitespace-pre-wrap">{answer}</div>
          </div>

          {reasoningTrace.length > 0 && (
            <ReasoningTrace trace={reasoningTrace} />
          )}
        </div>
      )}
    </div>
  );
}; 