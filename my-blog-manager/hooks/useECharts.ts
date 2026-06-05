"use client";

import { useEffect, useRef, useCallback } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 按需注册 ECharts 组件
echarts.use([
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
]);

export type EChartsOption = echarts.EChartsOption;

/**
 * 自定义 Hook：封装 ECharts 实例的生命周期管理
 * - 自动初始化和销毁
 * - 窗口 resize 自适应
 * - setOption 方法
 */
export function useECharts() {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  // 初始化图表实例
  useEffect(() => {
    if (!chartRef.current) return;

    const instance = echarts.init(chartRef.current);
    instanceRef.current = instance;

    const handleResize = () => instance.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      instance.dispose();
      instanceRef.current = null;
    };
  }, []);

  // 设置图表配置
  const setOption = useCallback((option: EChartsOption) => {
    if (instanceRef.current) {
      instanceRef.current.setOption(option, true);
    }
  }, []);

  return { chartRef, setOption };
}
