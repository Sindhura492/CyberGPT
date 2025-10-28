import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight,
  CheckCircle, 
} from 'lucide-react';

interface ReasoningStep {
  step: string;
  message: string;
}

interface ReasoningTraceProps {
  trace: ReasoningStep[];
  className?: string;
  durationSec?: number;
}

const createNarrativeMessage = (step: ReasoningStep, _idx?: number, _trace?: ReasoningStep[]) => {
  const { step: stepType, message } = step;
  const stepLower = (stepType || '').toLowerCase();
  const msgLower = (message || '').toLowerCase();
  
  // Create narrative messages that tell a story
  if (stepLower.includes('userintent')) {
    return `Explaining the concept and vulnerabilities of ${msgLower} to provide a detailed overview.`;
  }
  
  if (stepLower.includes('nvd')) {
    if ((message || '').includes('Found CVE')) {
      return `Found vulnerability ${(message || '').split('CVE')[1]?.split(' ')[0] || 'CVE'} in the National Vulnerability Database.`;
    }
    if ((message || '').includes('Searching')) {
      return `Searching for known security vulnerabilities related to this topic.`;
    }
    return message;
  }
  
  if (stepLower.includes('circl')) {
    if ((message || '').includes('No CVEs found')) {
      return `Checked CIRCL database for additional vulnerability information.`;
    }
    return `Searching CIRCL database for more comprehensive vulnerability data.`;
  }
  
  if (stepLower.includes('osv')) {
    if ((message || '').includes('No CVEs found')) {
      return `Checked OSV database for additional vulnerability information.`;
    }
    return `Searching OSV database for more comprehensive vulnerability data.`;
  }
  
  if (stepLower.includes('llm fallback')) {
    if ((message || '').includes('Inserted')) {
      return `Used AI to suggest relevant vulnerabilities and mitigation strategies.`;
    }
    return `Enhancing search results with AI-powered analysis.`;
  }
  
  if (stepLower.includes('enrich')) {
    return `Gathered comprehensive information including vulnerability IDs, risk levels, and prevention strategies.`;
  }
  
  if (stepLower.includes('llm')) {
    return `Using AI to enhance the search and find the most relevant security information.`;
  }
  
  return message;
};

// Add a function to create a narrative from the trace
function createNarrativeFromTrace(trace: ReasoningStep[]): string {
  if (!trace || trace.length === 0) return '';
  let narrative = '';
  for (const step of trace) {
    const stepLower = (step.step || '').toLowerCase();
    const msgLower = (step.message || '').toLowerCase();
    if (stepLower.includes('userintent')) {
      narrative += `Okay, the user is asking about ${msgLower}. This is a critical topic in cybersecurity. `;
    } else if (stepLower.includes('nvd')) {
      if ((step.message || '').includes('Found CVE')) {
        narrative += `I found a relevant vulnerability in the National Vulnerability Database. `;
      } else if ((step.message || '').includes('Searching')) {
        narrative += `I'm searching the NVD for known security vulnerabilities. `;
      }
    } else if (stepLower.includes('circl')) {
      narrative += `I also checked the CIRCL database for more information. `;
    } else if (stepLower.includes('osv')) {
      narrative += `I checked the OSV database for open source vulnerabilities. `;
    } else if (stepLower.includes('llm fallback')) {
      narrative += `I used AI to suggest additional vulnerabilities and mitigation strategies. `;
    } else if (stepLower.includes('enrich')) {
      narrative += `I'm gathering comprehensive information, including risk levels and prevention strategies. `;
    } else if (stepLower.includes('llm')) {
      narrative += `I'm using AI to enhance the search and find the most relevant security information. `;
    }
  }
  narrative += "Finally, security is a journey, not a one-time project.";
  return narrative;
}

export const ReasoningTrace: React.FC<ReasoningTraceProps> = ({ trace, className, durationSec }) => {
  const [expanded, setExpanded] = useState<boolean>(true);

  // Auto-collapse after 6 seconds like ChatGPT reasoning tab behaviour
  React.useEffect(() => {
    if (!expanded) return;
    const timer = setTimeout(() => setExpanded(false), 6000);
    return () => clearTimeout(timer);
  }, [expanded]);

  if (!trace || trace.length === 0) return null;

  // If the trace is a single narrative string (from LLM), display it directly
  // (Assume trace.narrative or trace[0].narrative holds the narrative string if present)
  const narrative = (trace as any).narrative || (trace[0] && (trace[0] as any).narrative) || createNarrativeFromTrace(trace);

  return (
    <div className={`w-full ${className ?? ""}`}>
      {/* Toggle Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-gray-700 dark:text-gray-200 text-sm font-medium mb-2 focus:outline-none"
      >
        <span>
          Thought for {durationSec !== undefined ? `${durationSec.toFixed(1)}s` : 'a moment'}
        </span>
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Show narrative at the top */}
      {expanded && narrative && (
        <div className="mb-2 text-gray-800 dark:text-gray-100 text-[13px] italic">
          {narrative}
        </div>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ol
            key="timeline"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="relative border-l border-gray-200 dark:border-gray-700 ml-4 pl-6 space-y-3 sm:space-y-4 text-[13px] leading-relaxed"
          >
            {trace.map((step, idx) => (
              <li key={idx} className="relative">
                <span className="absolute -left-[18px] top-1.5 w-2 h-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-primary-950" />
                <span className="text-gray-700 dark:text-gray-300">
                  {createNarrativeMessage(step, idx, trace)}
                </span>
              </li>
            ))}

            {/* Done item */}
            <li className="relative flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="absolute -left-[18px] top-1.5 w-2 h-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-primary-950" />
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Done</span>
            </li>
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}; 