import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import * as turf from '@turf/turf';
import type { CellState } from '../hooks/useGame';

const getNumberColor = (num: number) => {
  if (num >= 1 && num <= 8) return `var(--theme-num-${num})`;
  return 'var(--theme-ink)';
};

interface MapBoardProps {
  geoJson: any;
  adjacency: Record<string, string[]>;
  cells: Record<string, CellState>;
  status: string;
  onOpen: (code: string) => void;
  onChord: (code: string) => void;
  onToggleFlag: (code: string) => void;
  highlightedCode: string | null;
  setHighlightedCode: (code: string | null) => void;
  mode: 'open' | 'flag';
  isLongPressEnabled?: boolean;
  showAdjacency: boolean;
  setShowAdjacency: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MapBoard({ geoJson, adjacency, cells, status, onOpen, onChord, onToggleFlag, highlightedCode, setHighlightedCode, mode, isLongPressEnabled = true, showAdjacency, setShowAdjacency }: MapBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 560 });

  // Track whether the user is currently dragging/zooming to suppress click events
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef<{ x: number, y: number } | null>(null);

  // Long press tracking
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H' || e.key === 'a' || e.key === 'A') {
        setShowAdjacency(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const handleResize = () => {
      setDimensions({
        width: wrapperRef.current?.clientWidth || 700,
        height: wrapperRef.current?.clientHeight || 560
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const rewoundGeoJson = useMemo(() => {
    if (!geoJson) return null;
    try {
      return turf.rewind(geoJson as any, { reverse: true });
    } catch {
      return geoJson;
    }
  }, [geoJson]);

  const pathGenerator = useMemo(() => {
    if (!rewoundGeoJson || !dimensions.width || !dimensions.height) return null;
    
    // For projection fitting, exclude specific regions to prevent extreme zooming out
    let fittingGeoJson = rewoundGeoJson;
    
    if (geoJson?.pref_name === 'Europe') {
      fittingGeoJson = {
        type: "FeatureCollection",
        features: (rewoundGeoJson as any).features.filter((f: any) => f.properties.code !== 'RUS')
      };
    } else if (geoJson?.pref_name === 'USA') {
      fittingGeoJson = {
        type: "FeatureCollection",
        // Exclude Alaska (02), Hawaii (15), Puerto Rico (72) from fitting bounds
        features: (rewoundGeoJson as any).features.filter((f: any) => !['02', '15', '72'].includes(f.properties.code))
      };
    }

    const projection = d3.geoMercator()
      .fitSize([dimensions.width, dimensions.height], fittingGeoJson as any);
    return d3.geoPath().projection(projection);
  }, [rewoundGeoJson, dimensions, geoJson]);

  // Initialize d3-zoom with proper constraints
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const { width, height } = dimensions;
    const padding = 200;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([
        [-padding, -padding],
        [width + padding, height + padding]
      ])
      .on('start', (event) => {
        if (event.sourceEvent) {
          dragStartPosRef.current = { x: event.sourceEvent.clientX || 0, y: event.sourceEvent.clientY || 0 };
          isDraggingRef.current = false;
        }
      })
      .on('zoom', (event) => {
        d3.select(gRef.current).attr('transform', event.transform);
        if (wrapperRef.current) {
          wrapperRef.current.style.setProperty('--zoom-scale', event.transform.k.toString());
        }
        // Mark as dragging if the pointer moved significantly
        if (event.sourceEvent && dragStartPosRef.current) {
          const dx = (event.sourceEvent.clientX || 0) - dragStartPosRef.current.x;
          const dy = (event.sourceEvent.clientY || 0) - dragStartPosRef.current.y;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            isDraggingRef.current = true;
          }
        }
      })
      .on('end', () => {
        // Reset drag state after a short delay to let click fire first
        setTimeout(() => {
          isDraggingRef.current = false;
          dragStartPosRef.current = null;
        }, 50);
      });

    zoomBehaviorRef.current = zoom;
    const svgSelection = d3.select(svgRef.current);
    svgSelection.call(zoom).on('dblclick.zoom', null);

    return () => {
      svgSelection.on('.zoom', null);
    };
  }, [dimensions, geoJson]);

  // Reset zoom when map data changes (user switches map)
  useEffect(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  }, [geoJson]);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltipRef.current) {
      tooltipRef.current.style.left = `${e.clientX + 15}px`;
      tooltipRef.current.style.top = `${e.clientY + 15}px`;
    }
  };

  const handleZoomIn = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (svgRef.current && zoomBehaviorRef.current) {
      zoomBehaviorRef.current.scaleBy(d3.select(svgRef.current).transition().duration(250), 1.5);
    }
  }, []);

  const handleZoomOut = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (svgRef.current && zoomBehaviorRef.current) {
      zoomBehaviorRef.current.scaleBy(d3.select(svgRef.current).transition().duration(250), 0.67);
    }
  }, []);

  const handleZoomReset = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (svgRef.current && zoomBehaviorRef.current) {
      zoomBehaviorRef.current.transform(d3.select(svgRef.current).transition().duration(250), d3.zoomIdentity);
    }
  }, []);

  if (!pathGenerator || !geoJson) {
    return <div ref={wrapperRef} className="w-full h-full min-h-[350px] md:min-h-[560px] flex items-center justify-center text-ink-soft">Loading Map...</div>;
  }

  const features = rewoundGeoJson?.features || [];

  return (
    <div ref={wrapperRef} className="relative w-full h-full min-h-[350px] md:min-h-[560px]" onMouseMove={handleMouseMove} style={{ '--zoom-scale': '1', touchAction: 'none' } as React.CSSProperties}>
      <svg ref={svgRef} className="select-none w-full h-[350px] md:h-[560px]" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} style={{ touchAction: 'none' }}>
        {/* Transparent background to capture all mouse/wheel events even on empty spaces (sea) */}
        <rect width="100%" height="100%" fill="none" pointerEvents="all" />
        <g ref={gRef}>
          {/* Target Prefecture Cells */}
          {features.map((feature: any) => {
            const code = feature.properties.code;
            const cell = cells[code];
            if (!cell) return null;

            const isCenter = highlightedCode === code;
            const isAdjacent = showAdjacency && highlightedCode && adjacency[highlightedCode]?.includes(code);
            
            let fill = 'var(--theme-map-unopened)'; // default
            if (cell.isOpen) {
              if (cell.isMine) fill = 'var(--theme-danger)'; // danger
              else fill = 'var(--theme-map-opened)';
            } else if (cell.isFlagged) {
              fill = 'var(--theme-map-flagged)';
            }
            
            // Highlight overrides
            if (isCenter) {
              if (!cell.isOpen || cell.isMine) fill = 'var(--theme-amber)'; // center unopened highlight
              else fill = 'var(--theme-map-opened-hover)'; // center opened highlight
            } else if (isAdjacent) {
              if (!cell.isOpen || cell.isMine) fill = 'var(--theme-map-adjacent)'; // adjacent unopened highlight
            } else if (status === 'gameover' && cell.isMine) {
               fill = 'var(--theme-map-revealed-mine)'; // revealed mine
            }

            let stroke = 'var(--theme-ink-soft)';
            let strokeWidth = 1.2;
            
            if (cell.isOpen && !cell.isMine) {
              stroke = 'var(--theme-line)'; // Subtler border
              strokeWidth = 1.0;
            }
            if (cell.isMine && (cell.isOpen || status === 'gameover')) stroke = 'var(--theme-danger)';
            if (cell.isFlagged && !cell.isOpen) stroke = 'var(--theme-danger)';
            
            // Unified hover highlight borders
            if (isCenter) {
              stroke = 'var(--theme-amber)';
              strokeWidth = 2.5; // Thicker for center
            } else if (isAdjacent) {
              stroke = 'var(--theme-amber)';
              strokeWidth = 1.8; // Moderate for adjacent
            }

            const handleClick = () => {
               // Suppress click if user was dragging/panning
               if (isDraggingRef.current) return;
               
               if (cell.isOpen) {
                 onChord(code);
               } else if (mode === 'flag') {
                 onToggleFlag(code);
               } else {
                 onOpen(code);
               }
            };

            const handleContextMenu = (e: React.MouseEvent) => {
               e.preventDefault();
               onToggleFlag(code);
            };

            const handleTouchStart = (e: React.TouchEvent) => {
              // Only handle long press for single-finger touch
              if (e.touches.length >= 2) return;
              if (!isLongPressEnabled) return;
              const touch = e.touches[0];
              touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
              
              if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = setTimeout(() => {
                onToggleFlag(code);
                longPressTimerRef.current = null;
                // Vibrate if supported
                if (navigator.vibrate) navigator.vibrate(50);
              }, 500);
            };

            const handleTouchMove = (e: React.TouchEvent) => {
              if (!isLongPressEnabled || !longPressTimerRef.current || !touchStartPosRef.current) return;
              const touch = e.touches[0];
              const dx = touch.clientX - touchStartPosRef.current.x;
              const dy = touch.clientY - touchStartPosRef.current.y;
              // If moved more than 10px, cancel long press
              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
              }
            };

            const handleTouchEnd = () => {
              if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
              }
            };

            return (
              <path
                key={code}
                d={pathGenerator(feature) || ''}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer transition-all duration-150"
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onMouseEnter={() => setHighlightedCode(code)}
                onMouseLeave={() => setHighlightedCode(null)}
              />
            );
          })}

          {/* 2. Text Indicators (Flags, Names, Numbers) on top of all paths */}
          {features.map((feature: any) => {
            const code = feature.properties.code;
            const cell = cells[code];
            if (!cell) return null;

            const centroid = pathGenerator.centroid(feature);

            return (
              <g key={`${code}-text`} className="pointer-events-none">
                {/* Flag Icon */}
                {cell.isFlagged && !cell.isOpen && (
                  <text
                    x={centroid[0]}
                    y={centroid[1]}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="font-mono pointer-events-none"
                    fill="var(--theme-danger)"
                    style={{
                      fontSize: 'calc(16px / var(--zoom-scale, 1))'
                    }}
                  >
                    ⚑
                  </text>
                )}

                {/* Place Name Text (Visible when opened and zoomed in) */}
                {cell.isOpen && !cell.isMine && (
                  <text
                    x={centroid[0]}
                    y={centroid[1]}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="font-bold pointer-events-none transition-opacity duration-300"
                    fill="var(--theme-ink)"
                    style={{ 
                      fontSize: 'calc(10px / var(--zoom-scale, 1))',
                      opacity: 'calc((var(--zoom-scale, 1) - 1.1) * 2.5)',
                      textShadow: '0px 0px 3px var(--theme-surface), 0px 0px 3px var(--theme-surface), 0px 0px 3px var(--theme-surface)',
                      transform: cell.neighborMines > 0 ? 'translateY(calc(-5px / var(--zoom-scale, 1)))' : 'none'
                    }}
                  >
                    {feature.properties.name}
                  </text>
                )}

                {/* Number */}
                {cell.isOpen && !cell.isMine && cell.neighborMines > 0 && (
                  <text
                    x={centroid[0]}
                    y={centroid[1]}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="font-mono font-bold pointer-events-none"
                    fill={getNumberColor(cell.neighborMines)}
                    style={{ 
                      fontSize: 'calc(14px / var(--zoom-scale, 1))',
                      textShadow: '0px 0px 3px var(--theme-surface), 0px 0px 3px var(--theme-surface)',
                      transform: 'translateY(calc(5px / var(--zoom-scale, 1)))'
                    }}
                  >
                    {cell.neighborMines}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      
      {/* Tooltip */}
      <div 
        ref={tooltipRef}
        className={`fixed pointer-events-none z-50 bg-surface/95 px-3 py-1.5 rounded-lg shadow-md border border-line text-ink font-bold text-sm transition-opacity duration-150 ${highlightedCode ? 'opacity-100' : 'opacity-0'}`}
        style={{ top: 0, left: 0 }}
      >
        {highlightedCode && features.find((f: any) => f.properties.code === highlightedCode)?.properties.name}
      </div>
        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowAdjacency(!showAdjacency); }} 
            className="w-10 h-10 bg-surface rounded shadow border border-line text-ink text-xl font-bold flex items-center justify-center hover:bg-paper" 
            title="隣接ハイライト切替 (H / Aキー)"
          >
            {showAdjacency ? '🎯' : '⭕'}
          </button>
          <button onClick={handleZoomIn} className="w-10 h-10 bg-surface rounded shadow border border-line text-ink text-xl font-bold flex items-center justify-center hover:bg-paper" title="拡大">+</button>
          <button onClick={handleZoomOut} className="w-10 h-10 bg-surface rounded shadow border border-line text-ink text-xl font-bold flex items-center justify-center hover:bg-paper" title="縮小">−</button>
          <button onClick={handleZoomReset} className="w-10 h-10 bg-surface rounded shadow border border-line text-ink text-lg font-bold flex items-center justify-center hover:bg-paper" title="ズームリセット">⟲</button>
        </div>
    </div>
  );
}
