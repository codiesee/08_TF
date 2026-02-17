import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { AthleteRecord } from '../types';
import { useHighlight, useHover } from '../context/AppContext';
import './ZoomableHistogram.css';

interface TooltipData {
  record: AthleteRecord;
  x: number;
  y: number;
}

interface ZoomableHistogramProps {
  title: string;
  bars: {
    record: AthleteRecord;
    index: number;
    heightPercent: number;
    leftPercent: number;
    value: number;
  }[];
  labels: { value: number; position: number; label: string }[];
  className?: string;
  xDomain?: [number, number]; // Optional domain for x-axis
  xTickFormat?: (value: number) => string; // Custom tick formatter
}

/**
 * Calculate optimal bar width based on data density to prevent overlap
 * Uses the minimum gap between adjacent values to determine width
 */
function calculateBarWidth(
  sortedBars: { value: number }[],
  xScale: d3.ScaleLinear<number, number>,
  innerWidth: number,
  scaleFactor: number = 1
): number {
  if (sortedBars.length === 0) return 2;
  if (sortedBars.length === 1) return Math.max(2, innerWidth * 0.1 * scaleFactor);

  // Find minimum gap between adjacent bars in pixel space
  let minGap = Infinity;
  for (let i = 1; i < sortedBars.length; i++) {
    const gap = Math.abs(xScale(sortedBars[i].value) - xScale(sortedBars[i - 1].value));
    if (gap > 0 && gap < minGap) {
      minGap = gap;
    }
  }

  // If bars have same values, use a fraction of inner width
  if (minGap === Infinity || minGap === 0) {
    minGap = innerWidth / sortedBars.length;
  }

  // Bar width is 80% of the minimum gap to ensure no overlap
  const barWidth = Math.max(1, minGap * 0.8);
  
  // Cap at reasonable max width
  return Math.min(barWidth, innerWidth * 0.05 * scaleFactor);
}

export const ZoomableHistogram: React.FC<ZoomableHistogramProps> = ({
  title,
  bars,
  className = '',
  xDomain,
  xTickFormat,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { highlightedRecordId, highlight } = useHighlight();
  const { hoveredRecordId, hover } = useHover();
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  
  // Store zoom instance to prevent re-creation
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Dimensions - using useMemo to prevent re-renders
  const margin = useMemo(() => ({ top: 10, right: 10, bottom: 30, left: 10 }), []);

  // Find the highlighted athlete's name for secondary highlighting
  const highlightedAthleteName = useMemo(() => {
    if (highlightedRecordId === null) return null;
    const highlightedBar = bars.find(b => b.record.id === highlightedRecordId);
    return highlightedBar?.record.name || null;
  }, [bars, highlightedRecordId]);

  // Click handler
  const handleBarClick = useCallback((recordId: number) => {
    if (highlightedRecordId === recordId) {
      highlight(null);
    } else {
      highlight(recordId);
    }
  }, [highlight, highlightedRecordId]);

  // Hover handlers - now with tooltip support
  const handleBarMouseEnter = useCallback((recordId: number, record: AthleteRecord, event: MouseEvent) => {
    hover(recordId);
    setTooltip({
      record,
      x: event.clientX,
      y: event.clientY,
    });
  }, [hover]);

  const handleBarMouseMove = useCallback((event: MouseEvent) => {
    setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
  }, []);

  const handleBarMouseLeave = useCallback(() => {
    hover(null);
    setTooltip(null);
  }, [hover]);

  // Store the zoom transform ref for dynamic updates
  const zoomTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const xScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);
  
  // Track if this is the initial render (to avoid restoring zoom on data change)
  const isInitialRender = useRef(true);
  const prevBarsLength = useRef(bars.length);

  // D3 rendering effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || bars.length === 0) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 150;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Reset zoom if data changed significantly (different event selected)
    if (prevBarsLength.current !== bars.length) {
      zoomTransformRef.current = d3.zoomIdentity;
      prevBarsLength.current = bars.length;
    }

    // Clear previous content
    svg.selectAll('*').remove();

    // Set SVG dimensions
    svg.attr('width', width).attr('height', height);

    // Create clip path for zooming
    const clipId = `clip-${className.replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
    svg.append('defs')
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', innerWidth)
      .attr('height', innerHeight);

    // Create scales - use xDomain if provided
    const minValue = xDomain ? xDomain[0] : d3.min(bars, d => d.value) || 0;
    const maxValue = xDomain ? xDomain[1] : d3.max(bars, d => d.value) || 100;
    
    // Add small padding to domain to prevent bars from being cut off at edges
    const domainPadding = (maxValue - minValue) * 0.02;
    
    const xScale = d3.scaleLinear()
      .domain([minValue - domainPadding, maxValue + domainPadding])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    // Store for updates
    xScaleRef.current = xScale;

    // Store initial scale for zoom reset
    const xScaleOriginal = xScale.copy();

    // Sort bars by value for proper rendering and gap calculation
    const sortedBars = [...bars].sort((a, b) => a.value - b.value);

    // Calculate initial bar width based on data density
    const initialBarWidth = calculateBarWidth(sortedBars, xScale, innerWidth, 1);

    // Create zoom behavior with better constraints
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 100])
      .filter((event) => {
        // Allow wheel events and drag events, but not double-click (handled separately)
        if (event.type === 'dblclick') return false;
        return true;
      })
      .on('zoom', zoomed)
      .on('end', zoomEnded);
    
    zoomRef.current = zoom;

    // X-axis group
    const xAxisGroup = svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height - margin.bottom})`);

    // Create x-axis with custom or default tick formatter
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.floor(innerWidth / 80))
      .tickSizeOuter(0);

    if (xTickFormat) {
      xAxis.tickFormat((d) => xTickFormat(d as number));
    }

    xAxisGroup.call(xAxis);

    // Bars container with clip path
    const barsGroup = svg.append('g')
      .attr('clip-path', `url(#${clipId})`);

    // Draw bars
    const barsSelection = barsGroup.selectAll('rect.bar')
      .data(sortedBars, (d: any) => d.record.id)
      .enter()
      .append('rect')
      .attr('class', d => {
        const isHighlighted = highlightedRecordId === d.record.id;
        const isHovered = hoveredRecordId === d.record.id;
        const isSecondary = !isHighlighted && 
          highlightedAthleteName !== null && 
          d.record.name === highlightedAthleteName;
        
        let cls = 'bar';
        if (isHighlighted) cls += ' highlighted';
        if (isHovered) cls += ' hovered';
        if (isSecondary) cls += ' secondary-highlight';
        return cls;
      })
      .attr('x', d => xScale(d.value) - initialBarWidth / 2)
      .attr('y', d => yScale(d.heightPercent))
      .attr('width', initialBarWidth)
      .attr('height', d => Math.max(0, height - margin.bottom - yScale(d.heightPercent)))
      .attr('data-id', d => d.record.id)
      .attr('data-name', d => d.record.name)
      .attr('data-time', d => d.record.time)
      .attr('data-rank', d => d.record.rank)
      .style('cursor', 'pointer');

    // Add click handlers
    barsSelection.on('click', function(event, d) {
      event.stopPropagation();
      handleBarClick(d.record.id);
    });

    // Add hover handlers
    barsSelection.on('mouseenter', function(event, d) {
      handleBarMouseEnter(d.record.id, d.record, event);
    });

    barsSelection.on('mousemove', function(event) {
      handleBarMouseMove(event);
    });

    barsSelection.on('mouseleave', function() {
      handleBarMouseLeave();
    });

    // Background click clears selection
    svg.on('click', function(event) {
      if (event.target === svgRef.current) {
        highlight(null);
      }
    });

    // Double-click to reset zoom smoothly
    svg.on('dblclick', function(event) {
      event.preventDefault();
      event.stopPropagation();
      zoomTransformRef.current = d3.zoomIdentity;
      svg.transition()
        .duration(300)
        .call(zoom.transform, d3.zoomIdentity);
    });

    // Apply zoom behavior
    svg.call(zoom);

    // Restore previous zoom transform if this is not a data change
    if (!isInitialRender.current && zoomTransformRef.current !== d3.zoomIdentity) {
      // Apply without transition to avoid flicker
      svg.call(zoom.transform, zoomTransformRef.current);
    }
    isInitialRender.current = false;

    // Zoom handler function
    function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
      const transform = event.transform;
      
      // Constrain panning to data extent
      const newXScale = transform.rescaleX(xScaleOriginal);
      const [newMin, newMax] = newXScale.domain();
      const originalDomain = xScaleOriginal.domain();
      
      // Don't allow panning beyond original data extent
      if (newMin < originalDomain[0] || newMax > originalDomain[1]) {
        // Calculate constrained transform
        let constrainedK = transform.k;
        let constrainedX = transform.x;
        
        const rangeWidth = xScaleOriginal.range()[1] - xScaleOriginal.range()[0];
        const domainWidth = originalDomain[1] - originalDomain[0];
        
        if (newMin < originalDomain[0]) {
          const minX = xScaleOriginal(originalDomain[0]);
          constrainedX = margin.left - minX * constrainedK + margin.left;
        }
        if (newMax > originalDomain[1]) {
          const maxX = xScaleOriginal(originalDomain[1]);
          constrainedX = (width - margin.right) - maxX * constrainedK;
        }
        
        // Apply constrained transform
        const constrainedTransform = d3.zoomIdentity
          .translate(constrainedX, 0)
          .scale(constrainedK);
        
        zoomTransformRef.current = constrainedTransform;
      } else {
        zoomTransformRef.current = transform;
      }
      
      const finalTransform = zoomTransformRef.current;
      const finalXScale = finalTransform.rescaleX(xScaleOriginal);
      
      // Update x-axis
      const newXAxis = d3.axisBottom(finalXScale)
        .ticks(Math.floor(innerWidth / 80))
        .tickSizeOuter(0);
      
      if (xTickFormat) {
        newXAxis.tickFormat((d) => xTickFormat(d as number));
      }
      
      xAxisGroup.call(newXAxis);

      // Recalculate bar width for current zoom level
      const scaleFactor = finalTransform.k;
      const newBarWidth = calculateBarWidth(sortedBars, finalXScale, innerWidth, scaleFactor);
      
      barsSelection
        .attr('x', d => finalXScale(d.value) - newBarWidth / 2)
        .attr('width', newBarWidth);
    }
    
    // Called when zoom gesture ends - validate final state
    function zoomEnded(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
      // Store the final transform
      if (event.transform) {
        zoomTransformRef.current = event.transform;
      }
    }

    // Cleanup
    return () => {
      svg.on('.zoom', null);
    };
  }, [bars, className, xDomain, xTickFormat, margin, handleBarClick, handleBarMouseEnter, handleBarMouseMove, handleBarMouseLeave, highlight, highlightedRecordId, hoveredRecordId, highlightedAthleteName]);

  // Update bar classes when highlight/hover changes (without full re-render)
  useEffect(() => {
    if (!svgRef.current || bars.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('rect.bar')
      .attr('class', function() {
        const el = d3.select(this);
        const id = parseInt(el.attr('data-id'));
        const name = el.attr('data-name');
        
        const isHighlighted = highlightedRecordId === id;
        const isHovered = hoveredRecordId === id;
        const isSecondary = !isHighlighted && 
          highlightedAthleteName !== null && 
          name === highlightedAthleteName;
        
        let cls = 'bar';
        if (isHighlighted) cls += ' highlighted';
        if (isHovered) cls += ' hovered';
        if (isSecondary) cls += ' secondary-highlight';
        return cls;
      });
  }, [bars.length, highlightedRecordId, hoveredRecordId, highlightedAthleteName]);

  return (
    <div className={`zoomable-histogram-container ${className}`} ref={containerRef}>
      <h3 className="histogram-title">{title}</h3>
      <div className="histogram-instructions">
        <span>Scroll to zoom • Drag to pan • Double-click to reset</span>
      </div>
      <svg ref={svgRef} className="histogram-svg" />
      {tooltip && (
        <div
          className="histogram-tooltip"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
          }}
        >
          <strong>#{tooltip.record.rank} {tooltip.record.name}</strong>
          <span>{tooltip.record.time} | {tooltip.record.date}</span>
          <span>{tooltip.record.city}, {tooltip.record.country}</span>
          <span>Age: {tooltip.record.ageYears}y</span>
        </div>
      )}
    </div>
  );
};

ZoomableHistogram.displayName = 'ZoomableHistogram';
