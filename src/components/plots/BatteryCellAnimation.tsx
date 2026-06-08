// src/components/plots/BatteryCellAnimation.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Play, Pause, Square, Info } from 'lucide-react';

export const BatteryCellAnimation: React.FC = () => {
  const { results, activeTimeIndex, setActiveTimeIndex, theme } = useSimulationStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5x, 1x, 2x
  const timerRef = useRef<number | null>(null);

  // Extract variables
  const timeData = results?.['Time [s]'] as number[];
  const currentData = results?.['Current [A]'] as number[];
  const negConcData = results?.['X-averaged negative particle concentration [mol.m-3]'] as number[][];
  const posConcData = results?.['X-averaged positive particle concentration [mol.m-3]'] as number[][];

  const hasData = timeData && negConcData && posConcData;
  const N = timeData?.length || 0;

  // Calculate concentration limits for color scales
  const negLimits = useMemo(() => {
    if (!negConcData) return { min: 0, max: 1 };
    const flat = negConcData.flat();
    return { min: d3.min(flat) || 0, max: d3.max(flat) || 1 };
  }, [negConcData]);

  const posLimits = useMemo(() => {
    if (!posConcData) return { min: 0, max: 1 };
    const flat = posConcData.flat();
    return { min: d3.min(flat) || 0, max: d3.max(flat) || 1 };
  }, [posConcData]);

  // Colormaps for negative electrode (Anode - Graphite) and positive electrode (Cathode - NMC/LFP)
  const negColorScale = useMemo(() => {
    // Graphite empties of lithium during discharge (Yellow/Orange -> Blue)
    return d3.scaleSequential(d3.interpolateViridis).domain([negLimits.min, negLimits.max]);
  }, [negLimits]);

  const posColorScale = useMemo(() => {
    // NMC fills with lithium during discharge (Purple -> Orange/Red)
    return d3.scaleSequential(d3.interpolateWarm).domain([posLimits.min, posLimits.max]);
  }, [posLimits]);

  // Current values
  const currentVal = currentData ? currentData[activeTimeIndex] : 0;
  const isDischarging = currentVal >= 0; // standard sign: current > 0 is discharge

  // Playback timer
  useEffect(() => {
    if (isPlaying && hasData) {
      const intervalMs = Math.round(150 / playbackSpeed);
      timerRef.current = window.setInterval(() => {
        setActiveTimeIndex((activeTimeIndex + 1) % N);
      }, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeTimeIndex, N, playbackSpeed, hasData, setActiveTimeIndex]);

  // Render battery schematic and particle circles using D3
  useEffect(() => {
    if (!svgRef.current || !hasData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const isDark = theme === 'dark';
    const textColor = isDark ? '#E2E8F0' : '#334155';
    const borderColor = isDark ? '#475569' : '#CBD5E1';
    const separatorColor = isDark ? 'rgba(71, 85, 105, 0.4)' : 'rgba(203, 213, 225, 0.5)';

    const width = svgRef.current.clientWidth || 800;

    // ── 1. Battery Schematic (Anode, Separator, Cathode) ──
    const schematicY = 40;
    const schematicHeight = 110;
    const electrodeWidth = (width - 120) / 2;
    const separatorWidth = 40;

    const anodeX = 40;
    const separatorX = anodeX + electrodeWidth;
    const cathodeX = separatorX + separatorWidth;

    // Draw Electrode Boundaries
    // Anode Container (Negative)
    svg.append('rect')
      .attr('x', anodeX)
      .attr('y', schematicY)
      .attr('width', electrodeWidth)
      .attr('height', schematicHeight)
      .attr('fill', isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.6)')
      .attr('stroke', borderColor)
      .attr('stroke-width', 1.5)
      .attr('rx', 6);

    // Separator Container
    svg.append('rect')
      .attr('x', separatorX)
      .attr('y', schematicY)
      .attr('width', separatorWidth)
      .attr('height', schematicHeight)
      .attr('fill', separatorColor)
      .attr('stroke', borderColor)
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1);

    // Cathode Container (Positive)
    svg.append('rect')
      .attr('x', cathodeX)
      .attr('y', schematicY)
      .attr('width', electrodeWidth)
      .attr('height', schematicHeight)
      .attr('fill', isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.6)')
      .attr('stroke', borderColor)
      .attr('stroke-width', 1.5)
      .attr('rx', 6);

    // Labels
    svg.append('text')
      .attr('x', anodeX + electrodeWidth / 2)
      .attr('y', schematicY - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Anode (-) Negative Electrode');

    svg.append('text')
      .attr('x', separatorX + separatorWidth / 2)
      .attr('y', schematicY - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', isDark ? '#94A3B8' : '#64748B')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text('Separator');

    svg.append('text')
      .attr('x', cathodeX + electrodeWidth / 2)
      .attr('y', schematicY - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Cathode (+) Positive Electrode');

    // Draw little active material circles inside anode/cathode
    const drawParticles = (startX: number, colorScaleFn: any, dataGrid: number[][]) => {
      const radius = 9;
      const rows = 3;
      const cols = 4;
      const paddingX = (electrodeWidth - cols * radius * 2) / (cols + 1);
      const paddingY = (schematicHeight - rows * radius * 2) / (rows + 1);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = startX + paddingX + radius + c * (radius * 2 + paddingX);
          const py = schematicY + paddingY + radius + r * (radius * 2 + paddingY);

          // Get surface concentration index (last radial node) to color particle
          const surfaceIdx = dataGrid.length - 1;
          const concVal = dataGrid[surfaceIdx][activeTimeIndex];
          const color = colorScaleFn(concVal);

          svg.append('circle')
            .attr('cx', px)
            .attr('cy', py)
            .attr('r', radius)
            .attr('fill', color)
            .attr('stroke', isDark ? '#1E293B' : '#FFFFFF')
            .attr('stroke-width', 1);
        }
      }
    };

    drawParticles(anodeX, negColorScale, negConcData);
    drawParticles(cathodeX, posColorScale, posConcData);

    // ── 2. Ion Flow Animation ──
    const ionsCount = 14;
    // Animate moving lithium ions flowing through electrolyte
    if (Math.abs(currentVal) > 1e-3) {
      const ionGroup = svg.append('g').attr('class', 'ion-group');
      for (let i = 0; i < ionsCount; i++) {
        const startXVal = anodeX + 15 + Math.random() * (width - 110);
        const startYVal = schematicY + 10 + Math.random() * (schematicHeight - 20);

        const ion = ionGroup.append('circle')
          .attr('r', 3)
          .attr('fill', '#22C55E') // Lithium green glow
          .attr('opacity', 0.8)
          .attr('stroke', '#FFFFFF')
          .attr('stroke-width', 0.5);

        // Define linear translation animation path depending on current direction
        const animateIon = (el: d3.Selection<SVGCircleElement, unknown, null, undefined>) => {
          const currentX = startXVal;
          // Discharge: anode to cathode (left-to-right). Charge: cathode to anode (right-to-left)
          const targetX = isDischarging 
            ? (currentX + 100 > cathodeX + electrodeWidth - 15 ? anodeX + 15 : currentX + 100)
            : (currentX - 100 < anodeX + 15 ? cathodeX + electrodeWidth - 15 : currentX - 100);

          el.attr('cx', currentX).attr('cy', startYVal);
          
          el.transition()
            .duration(3000 / playbackSpeed)
            .ease(d3.easeLinear)
            .attr('cx', targetX)
            .on('end', () => animateIon(el));
        };

        animateIon(ion);
      }
    }

    // ── 3. Zoomed Particle Detail (Anode vs Cathode) ──
    const detailY = 285;
    const detailRadius = 80;
    const negDetailCenterX = width / 4 + 15;
    const posDetailCenterX = (3 * width) / 4 - 15;

    // Draw Zoom details container outlines
    svg.append('circle')
      .attr('cx', negDetailCenterX)
      .attr('cy', detailY)
      .attr('r', detailRadius + 10)
      .attr('fill', 'transparent')
      .attr('stroke', borderColor)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    svg.append('circle')
      .attr('cx', posDetailCenterX)
      .attr('cy', detailY)
      .attr('r', detailRadius + 10)
      .attr('fill', 'transparent')
      .attr('stroke', borderColor)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    // Section Titles
    svg.append('text')
      .attr('x', negDetailCenterX)
      .attr('y', detailY - detailRadius - 20)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Anode Particle Zoom (Graphite)');

    svg.append('text')
      .attr('x', posDetailCenterX)
      .attr('y', detailY - detailRadius - 20)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Cathode Particle Zoom (NMC/LFP)');

    // Tooltip elements
    const tooltip = d3.select(svgRef.current?.parentNode as HTMLElement)
      .select('.particle-tooltip') as d3.Selection<HTMLDivElement, unknown, null, undefined>;

    // Draw Concentric Rings (Radial nodes 0 to R-1)
    const drawConcentricRings = (cx: number, cy: number, dataGrid: number[][], colorScaleFn: any, isNeg: boolean) => {
      const ringGroup = svg.append('g');
      const totalRings = dataGrid.length;
      const ringWidth = detailRadius / totalRings;

      for (let r = totalRings - 1; r >= 0; r--) {
        const ringRadius = (r + 1) * ringWidth;
        const val = dataGrid[r][activeTimeIndex];
        const color = colorScaleFn(val);

        ringGroup.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', ringRadius)
          .attr('fill', color)
          .attr('stroke', isDark ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)')
          .attr('stroke-width', 0.5)
          .style('cursor', 'pointer')
          .on('mouseover', function (event) {
            d3.select(this).attr('stroke', '#06B6D4').attr('stroke-width', 1.5);
            const relativeRadiusPercent = Math.round((r / (totalRings - 1)) * 100);
            
            let label = 'Mid-Radius';
            if (r === 0) label = 'Center Core';
            else if (r < Math.round(totalRings * 0.25)) label = 'Inner Core';
            else if (r > Math.round(totalRings * 0.85)) label = 'Surface Boundary';
            else if (r > Math.round(totalRings * 0.7)) label = 'Outer Shell';

            tooltip.style('opacity', 1)
              .html(`
                <div class="font-bold border-b pb-0.5 mb-1 text-[11px] border-slate-700">Radial Concentration</div>
                Electrode: <b>${isNeg ? 'Graphite Anode' : 'NMC Cathode'}</b><br/>
                Position: <b>Index ${r} (${label})</b><br/>
                Radius Ratio: <b>r/R = ${relativeRadiusPercent}%</b><br/>
                Concentration: <b class="text-cyan-400">${val.toFixed(1)} mol/m³</b>
              `)
              .style('left', `${event.clientX - (svgRef.current?.getBoundingClientRect().left || 0) + 15}px`)
              .style('top', `${event.clientY - (svgRef.current?.getBoundingClientRect().top || 0) - 75}px`);
          })
          .on('mouseleave', function () {
            d3.select(this)
              .attr('stroke', isDark ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)')
              .attr('stroke-width', 0.5);
            tooltip.style('opacity', 0);
          });
      }

      // Add center dot indicator
      ringGroup.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 1.5)
        .attr('fill', isDark ? '#FFFFFF' : '#000000')
        .attr('opacity', 0.5);
    };

    drawConcentricRings(negDetailCenterX, detailY, negConcData, negColorScale, true);
    drawConcentricRings(posDetailCenterX, detailY, posConcData, posColorScale, false);

  }, [hasData, activeTimeIndex, theme, currentVal, isDischarging, negColorScale, posColorScale, negConcData, posConcData, playbackSpeed]);

  if (!hasData) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/40">
        <div className="text-center max-w-sm">
          <Info className="w-10 h-10 text-cyan-500 mx-auto mb-3 animate-pulse" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100">No Concentration Data</h3>
          <p className="text-xs text-slate-400 mt-2">
            Please run the simulation with "Neg Particle Concentration" or "Pos Particle Concentration" selected in output selection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[520px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col justify-between overflow-hidden">
      
      {/* Simulation Info Header */}
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">Microscopic Particle Diffusion Animation</h3>
          <p className="text-[10px] text-slate-400 font-medium">
            Time: <span className="text-cyan-500 font-bold">{timeData[activeTimeIndex].toFixed(2)} s</span> of {timeData[N-1].toFixed(1)}s (Step {activeTimeIndex + 1}/{N})
          </p>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            Current: {currentVal.toFixed(3)} A
          </span>
        </div>
      </div>

      {/* Main SVG Render Area */}
      <div className="relative flex-1 bg-white dark:bg-slate-950/20">
        <svg ref={svgRef} className="w-full h-full" />
        
        {/* Tooltip Overlay inside SVG Container */}
        <div
          className="particle-tooltip absolute opacity-0 pointer-events-none p-2.5 bg-slate-900/95 text-white text-[10px] rounded border border-slate-700 shadow-xl z-30 font-sans transition-opacity duration-150"
        />

        {/* Dynamic legends inside canvas */}
        <div className="absolute bottom-4 left-6 flex flex-col gap-1 pointer-events-none select-none text-[8px] font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-2 bg-gradient-to-r from-blue-900 to-emerald-400 rounded"></span>
            Anode: Lithium concentration
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-2 bg-gradient-to-r from-purple-800 to-amber-500 rounded"></span>
            Cathode: Lithium concentration
          </div>
        </div>
      </div>

      {/* Bottom Timeline & Media Playback Control Bar */}
      <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          
          {/* Timeline slider */}
          <input
            type="range"
            min={0}
            max={N - 1}
            value={activeTimeIndex}
            onChange={(e) => setActiveTimeIndex(parseInt(e.target.value))}
            className="flex-1 accent-cyan-500 cursor-pointer h-1.5 rounded-lg bg-slate-200 dark:bg-slate-800"
          />
        </div>

        <div className="flex items-center justify-between">
          
          {/* Play/Pause controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-bold transition-all shadow shadow-cyan-500/20 hover:scale-105"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setActiveTimeIndex(0);
              }}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all"
              title="Reset to Start"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          {/* Speed settings */}
          <div className="flex bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
            {([0.5, 1, 2.5] as number[]).map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${
                  playbackSpeed === speed
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-cyan-500 dark:text-cyan-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {speed === 2.5 ? '2x' : `${speed}x`}
              </button>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
};

export default BatteryCellAnimation;
