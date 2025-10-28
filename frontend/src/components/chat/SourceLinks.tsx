import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, ExternalLink, Shield, BookOpen, Database, Link } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface SourceLink {
  title: string;
  url: string;
  type: 'official' | 'reference' | 'framework';
}

interface SourceLinksProps {
  sourceLinks: SourceLink[];
  className?: string;
  autoExpand?: boolean;
}

const getSourceIcon = (type: string) => {
  switch (type) {
    case 'official':
      return <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" strokeWidth={2.5} />;
    case 'reference':
      return <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" strokeWidth={2.5} />;
    case 'framework':
      return <Database className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" strokeWidth={2.5} />;
    default:
      return <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" strokeWidth={2.5} />;
  }
};

export const SourceLinks: React.FC<SourceLinksProps> = ({ sourceLinks, className = '', autoExpand }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  React.useEffect(() => {
    if (autoExpand) {
      const timer = setTimeout(() => setIsExpanded(true), 200);
      return () => clearTimeout(timer);
    }
  }, [autoExpand]);

  if (!sourceLinks || sourceLinks.length === 0) {
    return null;
  }

  // Group sources by type
  const groupedSources = sourceLinks.reduce((acc, source) => {
    if (!acc[source.type]) {
      acc[source.type] = [];
    }
    acc[source.type].push(source);
    return acc;
  }, {} as Record<string, SourceLink[]>);

  const typeOrder = ['official', 'reference', 'framework'];
  const sortedTypes = typeOrder.filter(type => groupedSources[type]);

  return (
    <div className={`mt-2 sm:mt-3 ${className}`}>
      <div className="border border-sidebar-border rounded-lg bg-sidebar text-sidebar-foreground overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-2 sm:px-3 py-2 flex items-center justify-between hover:bg-accent/60 transition-colors touch-manipulation"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Link className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" strokeWidth={2.5} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                Show all sources
              </TooltipContent>
            </Tooltip>
            <span className="text-xs sm:text-sm font-medium text-sidebar-foreground">
              Sources ({sourceLinks.length})
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" strokeWidth={2.5} />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" strokeWidth={2.5} />
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-sidebar-border"
            >
              <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                {sortedTypes.map((type) => (
                  <div key={type} className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {getSourceIcon(type)}
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-sidebar-border bg-muted text-muted-foreground">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    </div>
                    <div className="space-y-1 ml-4 sm:ml-5">
                      {groupedSources[type].map((source, index) => (
                        <a
                          key={index}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-blue-600 dark:text-white hover:text-blue-800 dark:hover:text-primary-300 hover:underline group transition-colors touch-manipulation py-0.5"
                        >
                          <span className="truncate">{source.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Footer */}
                <div className="pt-1.5 sm:pt-2 border-t border-sidebar-border">
                  <p className="text-[10px] sm:text-xs text-muted-foreground italic">
                    Click any link to verify information from trusted cybersecurity sources
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}; 