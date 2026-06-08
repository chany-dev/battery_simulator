// src/components/plots/ParticleConcentrationPlot.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import * as d3 from 'd3';
import type { Theme } from '../../types';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Maximize2, Minimize2, Download, RotateCcw } from 'lucide-react';

interface Trace2D {
  xData: number[];
  yData: number[][]; // (R, N) where R = radial nodes, N = time steps
  name: string;
  color?: string;
}

interface ParticleConcentrationPlotProps {
  title: string;
  traces: Trace2D[];
  xLabel: string;
  yLabel: string;
  theme: Theme;
}

type ViewMode = 'heatmap' | 'contour' | 'surface3d';

export const ParticleConcentrationPlot: React.FC<ParticleConcentrationPlotProps> = ({
  title, traces, xLabel, yLabel, theme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<HTMLDivElement>(null);
  const d3ContourRef = useRef<SVGSVGElement>(null);
  const canvas3dRef = useRef<HTMLCanvasElement>(null);

  const [activeTraceIdx, setActiveTraceIdx] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { activeTimeIndex, setActiveTimeIndex } = useSimulationStore();

  // 3D rotation and scale states
  const [yaw, setYaw] = useState(-0.8); // radians
  const [pitch, setPitch] = useState(0.8); // radians
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, yaw: 0, pitch: 0 });

  const activeTrace = traces[activeTraceIdx] || traces[0];

  // Compute min/max of active trace concentration for absolute color mapping
  const { minVal, maxVal } = useMemo(() => {
    if (!activeTrace || !activeTrace.yData || activeTrace.yData.length === 0) {
      return { minVal: 0, maxVal: 1 };
    }
    const flat = activeTrace.yData.flat();
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < flat.length; i++) {
      if (flat[i] < min) min = flat[i];
      if (flat[i] > max) max = flat[i];
    }
    // Prevent min === max error
    if (min === max) {
      min -= 1;
      max += 1;
    }
    return { minVal: min, maxVal: max };
  }, [activeTrace]);

  // Plasma Colormap helper for D3 & Canvas rendering
  const colorScale = useMemo(() => {
    return d3.scaleSequential(d3.interpolatePlasma).domain([minVal, maxVal]);
  }, [minVal, maxVal]);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  // ── VIEW 1: HEATMAP (Apache ECharts) ──────────────────────────────────────
  useEffect(() => {
    if (viewMode !== 'heatmap' || !echartsRef.current || !activeTrace) return;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#E2E8F0' : '#334155';
    const gridColor = isDark ? '#334155' : '#E2E8F0';

    const myChart = echarts.init(echartsRef.current);

    // Format data for heatmap: [[xIndex, yIndex, value], ...]
    const heatmapData: [number, number, number][] = [];
    const radialLength = activeTrace.yData.length;
    const timeLength = activeTrace.xData.length;

    for (let r = 0; r < radialLength; r++) {
      for (let t = 0; t < timeLength; t++) {
        heatmapData.push([t, r, activeTrace.yData[r][t]]);
      }
    }

    const option: echarts.EChartsOption = {
      title: {
        text: `${title} - Heatmap View`,
        textStyle: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          color: textColor,
          fontWeight: 'bold'
        },
        left: '2%',
        top: '2%'
      },
      tooltip: {
        position: 'top',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: gridColor,
        borderWidth: 1,
        textStyle: {
          fontFamily: 'Inter, system-ui, sans-serif',
          color: textColor,
          fontSize: 11
        },
        formatter: (params: any) => {
          const tIdx = params.value[0];
          const rIdx = params.value[1];
          const val = params.value[2];
          const time = activeTrace.xData[tIdx];
          return `
            <div class="font-bold border-b pb-0.5 mb-1 border-slate-300 dark:border-slate-700">
              Concentration Detail
            </div>
            Time: <b>${time.toFixed(1)} s</b> (Step ${tIdx})<br/>
            Radial Position: <b>Index ${rIdx}</b> (0:Center, ${radialLength - 1}:Surface)<br/>
            Value: <b>${val.toFixed(2)} mol/m³</b>
          `;
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        top: '15%',
        bottom: '22%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: activeTrace.xData.map(t => t.toFixed(1)),
        name: xLabel,
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: {
          color: textColor,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 11
        },
        axisLabel: {
          color: textColor,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 10,
          interval: Math.floor(timeLength / 8) // prevent overlap
        },
        axisLine: { lineStyle: { color: gridColor } }
      },
      yAxis: {
        type: 'category',
        data: Array.from({ length: radialLength }, (_, i) => {
          if (i === 0) return '0 (Center)';
          if (i === radialLength - 1) return `${i} (Surface)`;
          return i.toString();
        }),
        name: yLabel,
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: {
          color: textColor,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 11
        },
        axisLabel: {
          color: textColor,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 10
        },
        axisLine: { lineStyle: { color: gridColor } }
      },
      visualMap: {
        min: minVal,
        max: maxVal,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '8%',
        text: ['High Conc', 'Low Conc'],
        textStyle: { color: textColor, fontSize: 10 },
        inRange: {
          color: ['#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fb9f3a', '#fdca26', '#f0f921'] // Plasma
        }
      },
      // Synced axisPointer indicator
      axisPointer: {
        show: true,
        type: 'line',
        lineStyle: {
          color: isDark ? '#06B6D4' : '#0284C7',
          width: 1.5,
          type: 'dashed'
        }
      },
      dataZoom: [{ type: 'inside', xAxisIndex: 0 }],
      series: [
        {
          name: 'Concentration',
          type: 'heatmap',
          data: heatmapData,
          label: { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };

    myChart.setOption(option);

    // Sync hover event to update store's activeTimeIndex
    myChart.on('updateAxisPointer', (params: any) => {
      const axesInfo = params.axesInfo;
      if (axesInfo && axesInfo.length > 0) {
        const xInfo = axesInfo.find((info: any) => info.axisDim === 'x');
        if (xInfo && xInfo.value !== undefined) {
          const index = Math.round(xInfo.value);
          if (index >= 0 && index < timeLength && index !== activeTimeIndex) {
            setActiveTimeIndex(index);
          }
        }
      }
    });

    const handleResize = () => myChart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [viewMode, activeTrace, theme, title, xLabel, yLabel, minVal, maxVal, activeTimeIndex, setActiveTimeIndex]);

  // Sync ECharts Heatmap indicator to external activeTimeIndex
  useEffect(() => {
    if (viewMode !== 'heatmap' || !echartsRef.current) return;
    const chart = echarts.getInstanceByDom(echartsRef.current);
    if (!chart || activeTimeIndex === undefined) return;

    chart.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: activeTimeIndex
    });
  }, [activeTimeIndex, viewMode]);

  // ── VIEW 2: CONTOUR PLOT (D3.js SVG) ──────────────────────────────────────
  useEffect(() => {
    if (viewMode !== 'contour' || !d3ContourRef.current || !activeTrace) return;

    const svg = d3.select(d3ContourRef.current);
    svg.selectAll('*').remove();

    const isDark = theme === 'dark';
    const textColor = isDark ? '#E2E8F0' : '#334155';
    const gridColor = isDark ? '#334155' : '#E2E8F0';

    const width = d3ContourRef.current.clientWidth || 800;
    const height = d3ContourRef.current.clientHeight || 500;
    const margin = { top: 50, right: 60, bottom: 65, left: 70 };

    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const radialLength = activeTrace.yData.length; // 20
    const timeLength = activeTrace.xData.length;

    // Create Scales
    const xScale = d3.scaleLinear().domain([0, timeLength - 1]).range([0, plotWidth]);
    const yScale = d3.scaleLinear().domain([0, radialLength - 1]).range([plotHeight, 0]);

    // Flat array of data: grid[r * timeLength + t] = value
    const grid: number[] = new Array(radialLength * timeLength);
    for (let r = 0; r < radialLength; r++) {
      for (let t = 0; t < timeLength; t++) {
        grid[r * timeLength + t] = activeTrace.yData[r][t];
      }
    }

    // Generate Contours
    const thresholdCount = 12;
    const thresholds = d3.range(minVal, maxVal, (maxVal - minVal) / thresholdCount);
    const contourGenerator = d3.contours().size([timeLength, radialLength]).thresholds(thresholds);
    const contours = contourGenerator(grid);

    // Path generator that scales the grid indices to SVG coordinate space
    const pathGenerator = d3.geoPath(
      d3.geoTransform({
        point: function (x, y) {
          this.stream.point(xScale(x), yScale(y));
        },
      })
    );

    // Draw contours
    g.selectAll('.contour-path')
      .data(contours)
      .enter()
      .append('path')
      .attr('class', 'contour-path')
      .attr('d', pathGenerator)
      .attr('fill', (d) => colorScale(d.value) || 'none')
      .attr('stroke', isDark ? '#1E293B' : '#E2E8F0')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.9);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat((d) => {
      const idx = Math.round(d.valueOf());
      return activeTrace.xData[idx] !== undefined ? `${activeTrace.xData[idx].toFixed(1)}s` : '';
    });

    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat((d) => {
      const idx = Math.round(d.valueOf());
      if (idx === 0) return '0 (Center)';
      if (idx === radialLength - 1) return `${idx} (Surface)`;
      return idx.toString();
    });

    // Add x-axis
    g.append('g')
      .attr('transform', `translate(0, ${plotHeight})`)
      .call(xAxis)
      .attr('color', gridColor)
      .selectAll('text')
      .attr('color', textColor)
      .attr('font-size', '10px');

    // Add y-axis
    g.append('g')
      .call(yAxis)
      .attr('color', gridColor)
      .selectAll('text')
      .attr('color', textColor)
      .attr('font-size', '10px');

    // X-Axis Label
    g.append('text')
      .attr('x', plotWidth / 2)
      .attr('y', plotHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .attr('font-size', '11px')
      .attr('font-weight', 'semibold')
      .text(xLabel);

    // Y-Axis Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -plotHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .attr('font-size', '11px')
      .attr('font-weight', 'semibold')
      .text(yLabel);

    // Active Time Indicator Line
    const indicatorGroup = g.append('g').attr('class', 'indicator-group');
    const indicatorLine = indicatorGroup.append('line')
      .attr('y1', 0)
      .attr('y2', plotHeight)
      .attr('stroke', isDark ? '#06B6D4' : '#0284C7')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .style('pointer-events', 'none');

    // Sync line to initial activeTimeIndex
    const currentX = xScale(activeTimeIndex);
    indicatorLine.attr('x1', currentX).attr('x2', currentX);

    // Interactive Hover overlay
    const hoverRect = g.append('rect')
      .attr('width', plotWidth)
      .attr('height', plotHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    // Tooltip elements
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .attr('class', 'absolute hidden pointer-events-none p-2 bg-slate-900/90 text-white text-[11px] rounded border border-slate-700 shadow shadow-slate-950/40 z-30 font-sans');

    hoverRect.on('mousemove', function (event) {
      const [mx, my] = d3.pointer(event);
      const tIdx = Math.max(0, Math.min(timeLength - 1, Math.round(xScale.invert(mx))));
      const rIdx = Math.max(0, Math.min(radialLength - 1, Math.round(yScale.invert(my))));
      const val = activeTrace.yData[rIdx][tIdx];
      const time = activeTrace.xData[tIdx];

      // Update indicator line
      const newX = xScale(tIdx);
      indicatorLine.attr('x1', newX).attr('x2', newX);

      // Trigger store update
      if (tIdx !== activeTimeIndex) {
        setActiveTimeIndex(tIdx);
      }

      // Position and content for tooltip
      tooltip.style('display', 'block')
        .html(`
          <div class="font-bold border-b pb-0.5 mb-1 border-slate-700">Contour Detail</div>
          Time: <b>${time.toFixed(1)} s</b> (Step ${tIdx})<br/>
          Radial: <b>Index ${rIdx}</b><br/>
          Conc: <b>${val.toFixed(2)} mol/m³</b>
        `)
        .style('left', `${event.offsetX + 15}px`)
        .style('top', `${event.offsetY - 45}px`);
    });

    hoverRect.on('mouseleave', function () {
      tooltip.style('display', 'none');
      tooltip.remove();
    });

    return () => {
      tooltip.remove();
    };
  }, [viewMode, activeTrace, theme, xLabel, yLabel, minVal, maxVal, colorScale, activeTimeIndex, setActiveTimeIndex]);

  // Sync Contour vertical line to external activeTimeIndex changes
  useEffect(() => {
    if (viewMode !== 'contour' || !d3ContourRef.current || !activeTrace) return;
    const width = d3ContourRef.current.clientWidth || 800;
    const margin = { left: 70, right: 60 };
    const plotWidth = width - margin.left - margin.right;
    const timeLength = activeTrace.xData.length;

    const xScale = d3.scaleLinear().domain([0, timeLength - 1]).range([0, plotWidth]);
    const xPos = xScale(activeTimeIndex);

    d3.select(d3ContourRef.current)
      .select('.indicator-group line')
      .attr('x1', xPos)
      .attr('x2', xPos);
  }, [activeTimeIndex, viewMode, activeTrace]);

  // ── VIEW 3: 3D SURFACE PLOT (Custom D3 Wireframe in Canvas) ────────────────
  // Mouse dragging handlers to rotate the 3D projection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      yaw: yaw,
      pitch: pitch
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    // Scale drag coordinates to radians
    setYaw(dragStartRef.current.yaw + dx * 0.007);
    setPitch(Math.max(0.1, Math.min(Math.PI / 2 - 0.1, dragStartRef.current.pitch + dy * 0.007)));
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const resetRotation = () => {
    setYaw(-0.8);
    setPitch(0.8);
  };

  useEffect(() => {
    if (viewMode !== 'surface3d' || !canvas3dRef.current || !activeTrace) return;

    const canvas = canvas3dRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#E2E8F0' : '#334155';
    const gridLineColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.6)';

    // Dimensions
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Downsample the time dimension to keep wireframe mesh sparse and readable
    const maxSamples = 50;
    const timeLength = activeTrace.xData.length;
    const sampleStep = Math.max(1, Math.floor(timeLength / maxSamples));
    
    // Build array of sampled indices
    const tIndices: number[] = [];
    for (let t = 0; t < timeLength; t += sampleStep) {
      tIndices.push(t);
    }
    if (tIndices[tIndices.length - 1] !== timeLength - 1) {
      tIndices.push(timeLength - 1);
    }

    const radialLength = activeTrace.yData.length; // 20

    // Coordinates mapping config
    const boxWidth = 320;
    const boxDepth = 220;
    const boxHeight = 160;

    const centerX = width / 2;
    const centerY = height / 2 + 30;

    // Helper: Project 3D normalized coordinates onto 2D canvas screen coordinates
    // tx: [0, tIndices.length - 1] -> normalized to [-0.5, 0.5]
    // ry: [0, radialLength - 1]   -> normalized to [-0.5, 0.5]
    // val: [minVal, maxVal]       -> normalized to [-0.5, 0.5]
    const project = (txIdx: number, ryIdx: number, val: number) => {
      const tNorm = txIdx / (tIndices.length - 1) - 0.5;
      const rNorm = ryIdx / (radialLength - 1) - 0.5;
      const vNorm = (val - minVal) / (maxVal - minVal) - 0.5;

      const x3d = tNorm * boxWidth;
      const y3d = rNorm * boxDepth;
      const z3d = vNorm * boxHeight;

      // Z-rotation (Yaw)
      const x1 = x3d * Math.cos(yaw) - y3d * Math.sin(yaw);
      const y1 = x3d * Math.sin(yaw) + y3d * Math.cos(yaw);
      const z1 = z3d;

      // X-rotation (Pitch)
      const x2 = x1;
      const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch);
      const z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch);

      return {
        x: centerX + x2,
        y: centerY - y2, // Canvas Y is inverted
        depth: z2
      };
    };

    // Pre-calculate projections
    const projGrid: { x: number; y: number; depth: number }[][] = [];
    for (let r = 0; r < radialLength; r++) {
      projGrid[r] = [];
      for (let sIdx = 0; sIdx < tIndices.length; sIdx++) {
        const tVal = tIndices[sIdx];
        projGrid[r][sIdx] = project(sIdx, r, activeTrace.yData[r][tVal]);
      }
    }

    // Build Polygons for Painter's depth sorting algorithm
    interface Poly {
      points: { x: number; y: number }[];
      depth: number;
      value: number;
      isHighlighted: boolean;
    }

    const polygons: Poly[] = [];

    // Find if any index falls inside highlighted time slice
    let activeSampledTimeIdx = -1;
    let minDiff = Infinity;
    for (let i = 0; i < tIndices.length; i++) {
      const diff = Math.abs(tIndices[i] - activeTimeIndex);
      if (diff < minDiff) {
        minDiff = diff;
        activeSampledTimeIdx = i;
      }
    }

    for (let r = 0; r < radialLength - 1; r++) {
      for (let sIdx = 0; sIdx < tIndices.length - 1; sIdx++) {
        const p1 = projGrid[r][sIdx];
        const p2 = projGrid[r][sIdx + 1];
        const p3 = projGrid[r + 1][sIdx + 1];
        const p4 = projGrid[r + 1][sIdx];

        // Average depth of the 4 points
        const avgDepth = (p1.depth + p2.depth + p3.depth + p4.depth) / 4;

        // Average value for colormapping
        const tVal = tIndices[sIdx];
        const avgVal = (
          activeTrace.yData[r][tVal] +
          activeTrace.yData[r][tIndices[sIdx + 1]] +
          activeTrace.yData[r + 1][tIndices[sIdx + 1]] +
          activeTrace.yData[r + 1][tVal]
        ) / 4;

        // Check if this slice is the hovered timeline slice
        const isHighlighted = sIdx === activeSampledTimeIdx;

        polygons.push({
          points: [p1, p2, p3, p4],
          depth: avgDepth,
          value: avgVal,
          isHighlighted
        });
      }
    }

    // Sort polygons from back to front (Painter's Algorithm)
    polygons.sort((a, b) => a.depth - b.depth);

    // Draw coordinate axes
    const drawAxis = (xNorm: number, yNorm: number, zNorm: number) => {
      const proj = project(
        (xNorm + 0.5) * (tIndices.length - 1),
        (yNorm + 0.5) * (radialLength - 1),
        (zNorm + 0.5) * (maxVal - minVal) + minVal
      );
      return proj;
    };

    const origin = drawAxis(-0.5, -0.5, -0.5);
    const xAxisEnd = drawAxis(0.5, -0.5, -0.5);
    const yAxisEnd = drawAxis(-0.5, 0.5, -0.5);
    const zAxisEnd = drawAxis(-0.5, -0.5, 0.5);

    // Draw grid base boundary lines
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(xAxisEnd.x, xAxisEnd.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(yAxisEnd.x, yAxisEnd.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(zAxisEnd.x, zAxisEnd.y);
    ctx.stroke();

    // Label Axes
    ctx.fillStyle = textColor;
    ctx.font = 'semibold 10px sans-serif';
    ctx.fillText('Time', xAxisEnd.x + 5, xAxisEnd.y + 2);
    ctx.fillText('Radial (r)', yAxisEnd.x - 35, yAxisEnd.y + 10);
    ctx.fillText('Conc', zAxisEnd.x - 10, zAxisEnd.y - 8);

    // Draw Sorted Grid Polygons
    polygons.forEach((poly) => {
      ctx.beginPath();
      ctx.moveTo(poly.points[0].x, poly.points[0].y);
      for (let i = 1; i < poly.points.length; i++) {
        ctx.lineTo(poly.points[i].x, poly.points[i].y);
      }
      ctx.closePath();

      // Colormap fill
      const color = colorScale(poly.value) || '#313695';
      ctx.fillStyle = poly.isHighlighted ? 'rgba(6, 182, 212, 0.8)' : color;
      ctx.fill();

      // Thin mesh outline
      ctx.strokeStyle = poly.isHighlighted ? '#06B6D4' : isDark ? 'rgba(15, 23, 42, 0.35)' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = poly.isHighlighted ? 1.5 : 0.4;
      ctx.stroke();
    });

  }, [viewMode, activeTrace, theme, yaw, pitch, minVal, maxVal, colorScale, activeTimeIndex]);

  // ── EXPORT FUNCTIONALITY ──────────────────────────────────────────────────
  const handleExportData = () => {
    if (viewMode === 'heatmap') {
      if (!echartsRef.current) return;
      const chart = echarts.getInstanceByDom(echartsRef.current);
      if (!chart) return;
      const url = chart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF'
      });
      const link = document.createElement('a');
      link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_heatmap.png`;
      link.href = url;
      link.click();
    } else if (viewMode === 'surface3d') {
      if (!canvas3dRef.current) return;
      const url = canvas3dRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_surface3d.png`;
      link.href = url;
      link.click();
    } else if (viewMode === 'contour') {
      if (!d3ContourRef.current) return;
      // Convert SVG node to string and download
      const svgEl = d3ContourRef.current;
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svgEl);
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
      const link = document.createElement('a');
      link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_contour.svg`;
      link.href = url;
      link.click();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`
        relative w-full rounded-xl overflow-hidden
        border border-slate-200 dark:border-slate-800
        bg-white dark:bg-slate-900/60 shadow-sm transition-all duration-200
        ${isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen p-4 bg-slate-50 dark:bg-slate-950' : 'h-[520px]'}
      `}
    >
      {/* Premium Visualization Header Controls Toolbar */}
      <div className="absolute left-4 top-3 z-20 flex flex-wrap gap-2 items-center justify-between w-[92%]">
        
        {/* Toggle Electrode Trace */}
        {traces.length > 1 && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
            {traces.map((trace, idx) => (
              <button
                key={trace.name}
                onClick={() => setActiveTraceIdx(idx)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeTraceIdx === idx
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-cyan-500 dark:text-cyan-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {trace.name.includes('negative') ? 'Anode' : trace.name.includes('positive') ? 'Cathode' : trace.name}
              </button>
            ))}
          </div>
        )}

        {/* Swap Visualization Mode */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
          {(['heatmap', 'contour', 'surface3d'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                viewMode === mode
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-cyan-500 dark:text-cyan-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              {mode === 'heatmap' ? 'Heatmap' : mode === 'contour' ? 'Contour' : '3D Surface'}
            </button>
          ))}
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {viewMode === 'surface3d' && (
            <button
              onClick={resetRotation}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Reset 3D Rotation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleExportData}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title={viewMode === 'contour' ? 'Export Vector SVG' : 'Export PNG'}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Render selected Plot view mode */}
      <div className="w-full h-full pt-12">
        {viewMode === 'heatmap' && (
          <div ref={echartsRef} className="w-full h-full" />
        )}

        {viewMode === 'contour' && (
          <svg ref={d3ContourRef} className="w-full h-full bg-white dark:bg-slate-900/60" />
        )}

        {viewMode === 'surface3d' && (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900/60 select-none">
            <canvas
              ref={canvas3dRef}
              width={800}
              height={500}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className="cursor-grab active:cursor-grabbing w-full h-full max-w-[800px] max-h-[500px]"
            />
            {/* 3D rotation hint */}
            <div className="absolute bottom-4 left-4 text-[9px] font-semibold text-slate-400 bg-slate-100/50 dark:bg-slate-800/40 px-2 py-1 rounded pointer-events-none select-none">
              Drag mouse to rotate surface • Scrub plots to slice Time
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticleConcentrationPlot;
