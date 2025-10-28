import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  Zap, 
  Shield, 
  AlertTriangle, 
  Info, 
  Target, 
  X,
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react';
import type { GraphNode, GraphLink, GraphVisualizationProps } from '../../types/graphVisualization';

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  width: propWidth,
  height: propHeight,
  onNodeClick,
  onLinkClick,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<GraphLink | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: propWidth || 800, height: propHeight || 600 });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || propWidth || 800,
          height: rect.height || propHeight || 600
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [propWidth, propHeight]);

  // Get responsive node and link sizes
  const getNodeSize = useCallback((baseSize: number) => {
    return isMobile ? baseSize * 0.7 : baseSize;
  }, [isMobile]);

  const getLinkWidth = useCallback((baseWidth: number) => {
    return isMobile ? baseWidth * 0.7 : baseWidth;
  }, [isMobile]);

  const getFontSize = useCallback((baseSize: number) => {
    return isMobile ? baseSize * 0.8 : baseSize;
  }, [isMobile]);

  // Node type configurations with sidebar color scheme
  const nodeConfig = {
    vulnerability: { color: 'hsl(var(--destructive))', icon: AlertTriangle, size: 20 },
    mitigation: { color: 'hsl(var(--chart-2))', icon: Shield, size: 18 },
    source: { color: 'hsl(var(--sidebar-primary))', icon: Info, size: 16 },
    cve: { color: 'hsl(var(--chart-4))', icon: Target, size: 22 },
    problem: { color: 'hsl(var(--chart-5))', icon: Network, size: 24 },
    affected: { color: 'hsl(var(--chart-1))', icon: Zap, size: 19 },
    risk: { color: 'hsl(var(--destructive))', icon: AlertTriangle, size: 21 }
  };

  // Link type configurations with sidebar color scheme
  const linkConfig = {
    mitigates: { color: 'hsl(var(--chart-2))', width: 3 },
    affects: { color: 'hsl(var(--destructive))', width: 2 },
    references: { color: 'hsl(var(--sidebar-primary))', width: 1 },
    causes: { color: 'hsl(var(--chart-4))', width: 2.5 },
    relates_to: { color: 'hsl(var(--chart-5))', width: 1.5 }
  };

  useEffect(() => {
    if (!data || !svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    setIsLoading(true);
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Adjust force simulation parameters for mobile
    const linkDistance = isMobile ? 60 : 100;
    const chargeStrength = isMobile ? -200 : -300;
    const collisionRadius = isMobile ? 20 : 30;

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links).id((d: any) => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(collisionRadius));

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        setZoomLevel(event.transform.k);
        svg.select('.graph-container')
          .attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Create graph container
    const graphContainer = svg.append('g')
      .attr('class', 'graph-container');

    // Create links
    const links = graphContainer.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', (d) => linkConfig[d.type]?.color || '#666')
      .attr('stroke-width', (d) => getLinkWidth(linkConfig[d.type]?.width || 1))
      .attr('stroke-opacity', 0.6)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedLink(d);
        onLinkClick?.(d);
      })
      .on('mouseover', function(_event, d) {
        d3.select(this)
          .attr('stroke-opacity', 1)
          .attr('stroke-width', getLinkWidth(linkConfig[d.type]?.width || 1) * 1.5);
      })
      .on('mouseout', function(_event, d) {
        d3.select(this)
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', getLinkWidth(linkConfig[d.type]?.width || 1));
      });

    // Create nodes
    const nodes = graphContainer.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        onNodeClick?.(d);
      })
      .call(d3.drag<any, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Add node circles
    nodes.append('circle')
      .attr('r', (d) => getNodeSize(nodeConfig[d.type]?.size || 15))
      .attr('fill', (d) => {
        if (d.severity) {
          const severityColors = {
            Critical: 'hsl(var(--destructive))',
            High: 'hsl(var(--chart-1))',
            Medium: 'hsl(var(--chart-4))',
            Low: 'hsl(var(--chart-2))',
            Info: 'hsl(var(--sidebar-primary))'
          };
          return severityColors[d.severity] || nodeConfig[d.type]?.color;
        }
        return nodeConfig[d.type]?.color || '#666';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', isMobile ? 1.5 : 2)
      .attr('stroke-opacity', 0.8);

    // Add node labels - truncate on mobile
    nodes.append('text')
      .text((d) => {
        const label = d.label;
        return isMobile && label.length > 15 ? `${label.slice(0, 15)}...` : label;
      })
      .attr('text-anchor', 'middle')
      .attr('dy', isMobile ? 25 : 30)
      .attr('font-size', `${getFontSize(12)}px`)
      .attr('font-weight', '500')
      .attr('fill', 'hsl(var(--sidebar-foreground))')
      .style('pointer-events', 'none');

    // Add node type icons
    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .attr('font-size', `${getFontSize(14)}px`)
      .attr('fill', 'hsl(var(--sidebar-primary-foreground))')
      .style('pointer-events', 'none')
      .text((d) => {
        const icons = {
          vulnerability: '⚠️',
          mitigation: '🛡️',
          source: '📚',
          cve: '🎯',
          problem: '🔗',
          affected: '⚡',
          risk: '🚨'
        };
        return icons[d.type] || '●';
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodes
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    setIsLoading(false);

    return () => {
      simulation.stop();
    };
  }, [data, dimensions, isMobile, getNodeSize, getLinkWidth, getFontSize, onNodeClick, onLinkClick]);

  const resetZoom = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(750).call(
        d3.zoom().transform as any,
        d3.zoomIdentity
      );
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const clearSelection = () => {
    setSelectedNode(null);
    setSelectedLink(null);
  };

  return (
    <div className={`relative bg-sidebar border border-sidebar-border rounded-lg ${className} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Network className="w-4 h-4 sm:w-5 sm:h-5 text-sidebar-primary" />
          <h3 className="text-sm sm:text-lg font-semibold text-sidebar-foreground">
            {isMobile ? 'Graph' : 'Knowledge Graph Visualization'}
          </h3>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={resetZoom}
            className="p-1.5 sm:p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors touch-manipulation"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          {!isMobile && (
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors touch-manipulation"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Graph Container */}
      <div ref={containerRef} className="relative flex-1 min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-sidebar bg-opacity-75 z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-sidebar-primary"></div>
              <span className="text-xs sm:text-sm text-sidebar-foreground">Generating graph...</span>
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="w-full h-full"
          style={{ minHeight: isMobile ? '400px' : '500px' }}
        />

        {/* Zoom Level Indicator */}
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-sidebar px-2 py-1 sm:px-3 sm:py-1 rounded-lg shadow-lg border border-sidebar-border">
          <span className="text-xs sm:text-sm text-sidebar-foreground">
            {isMobile ? `${Math.round(zoomLevel * 100)}%` : `Zoom: ${Math.round(zoomLevel * 100)}%`}
          </span>
        </div>

        {/* Legend - Collapsible on mobile */}
        {!isMobile ? (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-sidebar p-2 sm:p-4 rounded-lg shadow-lg border border-sidebar-border max-w-[160px] sm:max-w-xs">
            <h4 className="text-xs sm:text-sm font-semibold text-sidebar-foreground mb-2 sm:mb-3">Node Types</h4>
            <div className="space-y-1 sm:space-y-2">
              {Object.entries(nodeConfig).map(([type, config]) => (
                <div key={type} className="flex items-center space-x-1.5 sm:space-x-2">
                  <div
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-[10px] sm:text-xs text-sidebar-foreground/70 capitalize truncate">
                    {type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-2 left-2 bg-sidebar p-2 rounded-lg shadow-lg border border-sidebar-border touch-manipulation"
            title="Legend"
          >
            <Info className="w-4 h-4 text-sidebar-primary" />
          </button>
        )}
      </div>

      {/* Node Details Panel - Full overlay on mobile, sidebar on desktop */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: isMobile ? 0 : 300, y: isMobile ? 300 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: isMobile ? 0 : 300, y: isMobile ? 300 : 0 }}
            className={`absolute ${
              isMobile 
                ? 'bottom-0 left-0 right-0 max-h-[70vh] rounded-t-xl' 
                : 'top-0 right-0 w-80 h-full'
            } bg-sidebar ${isMobile ? 'border-t' : 'border-l'} border-sidebar-border shadow-lg overflow-y-auto z-20`}
          >
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h4 className="text-base sm:text-lg font-semibold text-sidebar-foreground">
                  Node Details
                </h4>
                <button
                  onClick={clearSelection}
                  className="p-1.5 text-sidebar-foreground/70 hover:text-sidebar-foreground touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-sidebar-foreground/70">Label</label>
                  <p className="text-sm sm:text-base text-sidebar-foreground font-semibold break-words">{selectedNode.label}</p>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-medium text-sidebar-foreground/70">Type</label>
                  <p className="text-sm sm:text-base text-sidebar-foreground capitalize">{selectedNode.type}</p>
                </div>
                
                {selectedNode.severity && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-sidebar-foreground/70">Severity</label>
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        selectedNode.severity === 'Critical' ? 'bg-destructive/20 text-destructive' :
                        selectedNode.severity === 'High' ? 'bg-chart-1/20 text-chart-1' :
                        selectedNode.severity === 'Medium' ? 'bg-chart-4/20 text-chart-4' :
                        selectedNode.severity === 'Low' ? 'bg-chart-2/20 text-chart-2' :
                        'bg-sidebar-primary/20 text-sidebar-primary'
                      }`}>
                        {selectedNode.severity}
                      </span>
                    </div>
                  </div>
                )}
                
                {selectedNode.cvss && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-sidebar-foreground/70">CVSS Score</label>
                    <p className="text-sm sm:text-base text-sidebar-foreground">{selectedNode.cvss}</p>
                  </div>
                )}
                
                {selectedNode.description && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-sidebar-foreground/70">Description</label>
                    <p className="text-xs sm:text-sm text-sidebar-foreground break-words">{selectedNode.description}</p>
                  </div>
                )}
                
                {selectedNode.source && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-sidebar-foreground/70">Source</label>
                    <p className="text-xs sm:text-sm text-sidebar-foreground break-words">{selectedNode.source}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Details Panel - Bottom sheet on both mobile and desktop */}
      <AnimatePresence>
        {selectedLink && (
          <motion.div
            initial={{ opacity: 0, y: 300 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 300 }}
            className={`absolute bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border shadow-lg ${
              isMobile ? 'max-h-[60vh]' : ''
            } overflow-y-auto z-20`}
          >
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h4 className="text-base sm:text-lg font-semibold text-sidebar-foreground">
                  Link Details
                </h4>
                <button
                  onClick={clearSelection}
                  className="p-1.5 text-sidebar-foreground/70 hover:text-sidebar-foreground touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-sidebar-foreground/70">Type</label>
                  <p className="text-sm sm:text-base text-sidebar-foreground capitalize">{selectedLink.type}</p>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-medium text-sidebar-foreground/70">Connection</label>
                  <p className="text-xs sm:text-sm text-sidebar-foreground break-words">
                    {data.nodes.find(n => n.id === selectedLink.source)?.label} → {data.nodes.find(n => n.id === selectedLink.target)?.label}
                  </p>
                </div>
                
                {selectedLink.description && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-sidebar-foreground/70">Description</label>
                    <p className="text-xs sm:text-sm text-sidebar-foreground break-words">{selectedLink.description}</p>
                  </div>
                )}
                
                {selectedLink.strength && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-sidebar-foreground/70">Strength</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-sidebar-accent rounded-full h-2">
                        <div
                          className="bg-sidebar-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(selectedLink.strength / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm text-sidebar-foreground/70 shrink-0">{selectedLink.strength}/10</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GraphVisualization; 