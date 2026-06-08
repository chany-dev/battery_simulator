// src/components/plots/ScientificPlot.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import type { Theme } from '../../types';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Maximize2, Minimize2, Download } from 'lucide-react';

export interface TraceData {
  xData: number[];
  yData: number[] | number[][];
  name: string;
  color?: string;
  yAxis?: string;
}

interface ScientificPlotProps {
  title: string;
  traces: TraceData[];
  xLabel: string;
  yLabel: string;
  theme: Theme;
  y2Label?: string;
}

export const ScientificPlot: React.FC<ScientificPlotProps> = ({
  title, traces, xLabel, yLabel, theme, y2Label,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { activeTimeIndex, setActiveTimeIndex } = useSimulationStore();
  const localHoveredIndexRef = useRef<number>(-1);

  // Helper to extract hex to transparent rgba fill
  const getGradientFill = (colorStr: string) => {
    let baseColor = colorStr || '#06B6D4';
    if (baseColor.startsWith('#')) {
      const hex = baseColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return {
        type: 'linear' as const,
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: `rgba(${r}, ${g}, ${b}, 0.25)` },
          { offset: 1, color: `rgba(${r}, ${g}, ${b}, 0.01)` }
        ]
      };
    }
    return baseColor;
  };

  const getUnit = (name: string) => {
    if (name.includes('[V]') || name.toLowerCase().includes('voltage')) return ' V';
    if (name.includes('[A]') || name.toLowerCase().includes('current')) return ' A';
    if (name.includes('concentration') || name.toLowerCase().includes('conc')) return ' mol/m³';
    if (name.toLowerCase().includes('time')) return ' s';
    return '';
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Export PNG
  const handleExport = () => {
    if (!chartInstanceRef.current) return;
    const url = chartInstanceRef.current.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF'
    });
    const link = document.createElement('a');
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}.png`;
    link.href = url;
    link.click();
  };

  // Re-initialize and update chart when props change
  useEffect(() => {
    if (!chartRef.current) return;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#E2E8F0' : '#334155';
    const gridColor = isDark ? '#334155' : '#E2E8F0';

    // Initialize ECharts instance if not already done
    let myChart = chartInstanceRef.current;
    if (!myChart) {
      myChart = echarts.init(chartRef.current);
      chartInstanceRef.current = myChart;
    }

    // Prepare series data (ensuring 1D arrays are safely plotted)
    const series = traces.map((t) => {
      const color = t.color ?? (isDark ? '#06B6D4' : '#0284C7');
      
      // Ensure we only plot 1D array data
      const data = Array.isArray(t.yData[0]) 
        ? (t.yData as number[][])[0] // Safeguard fallback if 2D leaks here
        : (t.yData as number[]);

      return {
        name: t.name,
        type: 'line' as const,
        data: data.map((val, idx) => [t.xData[idx], val]),
        smooth: true,
        showSymbol: false,
        lineStyle: {
          color,
          width: 3
        },
        itemStyle: {
          color
        },
        areaStyle: {
          color: getGradientFill(color)
        },
        yAxisIndex: t.yAxis === 'y2' ? 1 : 0
      };
    });

    const option: echarts.EChartsOption = {
      title: {
        text: title,
        textStyle: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          color: textColor,
          fontWeight: 'bold'
        },
        left: '2%',
        top: '2%'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: isDark ? '#06B6D4' : '#0284C7',
            width: 1.5,
            type: 'dashed'
          }
        },
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: gridColor,
        borderWidth: 1,
        textStyle: {
          fontFamily: 'Inter, system-ui, sans-serif',
          color: textColor,
          fontSize: 11
        },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          const xValue = params[0].value[0];
          let html = `<div class="font-bold border-b pb-1 mb-1 border-slate-300 dark:border-slate-700">Time: ${xValue.toFixed(2)}s</div>`;
          params.forEach((p: any) => {
            const unit = getUnit(p.seriesName);
            html += `<div class="flex items-center justify-between gap-4 py-0.5">
              <span class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span class="inline-block w-2.5 h-2.5 rounded-full" style="background-color: ${p.color}"></span>
                ${p.seriesName}:
              </span>
              <span class="font-semibold">${p.value[1].toFixed(4)}${unit}</span>
            </div>`;
          });
          return html;
        }
      },
      legend: {
        data: traces.map(t => t.name),
        textStyle: {
          color: textColor,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 10
        },
        bottom: '2%',
        left: 'center'
      },
      grid: {
        left: '6%',
        right: y2Label ? '6%' : '4%',
        top: '15%',
        bottom: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
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
          fontSize: 10
        },
        axisLine: {
          lineStyle: {
            color: gridColor
          }
        },
        splitLine: {
          lineStyle: {
            color: gridColor
          }
        }
      },
      yAxis: [
        {
          type: 'value',
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
          axisLine: {
            lineStyle: {
              color: gridColor
            }
          },
          splitLine: {
            lineStyle: {
              color: gridColor
            }
          }
        },
        ...(y2Label ? [{
          type: 'value' as const,
          name: y2Label,
          nameLocation: 'middle' as const,
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
          axisLine: {
            lineStyle: {
              color: gridColor
            }
          },
          splitLine: {
            show: false
          }
        }] : [])
      ],
      dataZoom: [
        {
          type: 'inside',
          realtime: true
        }
      ],
      series
    };

    myChart.setOption(option, true);

    // Sync hover event to update store's activeTimeIndex
    myChart.on('updateAxisPointer', (params: any) => {
      const axesInfo = params.axesInfo;
      if (axesInfo && axesInfo.length > 0) {
        const xInfo = axesInfo.find((info: any) => info.axisDim === 'x');
        if (xInfo && xInfo.value !== undefined) {
          // Find the nearest dataIndex in traces
          const hoverX = xInfo.value;
          const xData = traces[0]?.xData;
          if (xData && xData.length > 0) {
            let nearestIdx = 0;
            let minDiff = Math.abs(xData[0] - hoverX);
            for (let i = 1; i < xData.length; i++) {
              const diff = Math.abs(xData[i] - hoverX);
              if (diff < minDiff) {
                minDiff = diff;
                nearestIdx = i;
              }
            }
            if (nearestIdx !== localHoveredIndexRef.current) {
              localHoveredIndexRef.current = nearestIdx;
              setActiveTimeIndex(nearestIdx);
            }
          }
        }
      }
    });

    // Resize handler
    const handleResize = () => {
      myChart?.resize();
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [traces, title, xLabel, yLabel, theme, y2Label, setActiveTimeIndex]);

  // Sync external changes to activeTimeIndex
  useEffect(() => {
    const myChart = chartInstanceRef.current;
    if (!myChart || activeTimeIndex === undefined || traces.length === 0) return;

    if (activeTimeIndex !== localHoveredIndexRef.current) {
      localHoveredIndexRef.current = activeTimeIndex;
      const xData = traces[0]?.xData;
      if (xData && xData[activeTimeIndex] !== undefined) {
        myChart.dispatchAction({
          type: 'showTip',
          seriesIndex: 0,
          dataIndex: activeTimeIndex
        });
      }
    }
  }, [activeTimeIndex, traces]);

  return (
    <div
      ref={containerRef}
      className={`
        relative w-full rounded-xl overflow-hidden
        border border-slate-200 dark:border-slate-800
        bg-white dark:bg-slate-900/60 shadow-sm transition-all duration-200
        ${isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen p-4 bg-slate-50 dark:bg-slate-950' : 'h-[500px]'}
      `}
    >
      {/* Premium Chart Controls toolbar */}
      <div className="absolute right-4 top-3 z-10 flex items-center gap-1">
        <button
          onClick={handleExport}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          title="Export PNG"
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

      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
};

export default ScientificPlot;
