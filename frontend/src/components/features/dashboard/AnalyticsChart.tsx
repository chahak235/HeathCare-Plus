import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface AnalyticsChartProps {
  type: 'line' | 'bar' | 'pie';
  title?: string;
  data: any;
  options?: any;
  height?: number;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  type,
  title,
  data,
  options,
  height = 300,
}) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#6b7280',
        },
      },
      title: title
        ? {
            display: true,
            text: title,
            color: '#111827',
            font: {
              size: 16,
              weight: '600',
            },
          }
        : undefined,
    },
    scales: type !== 'pie' ? {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6b7280',
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6b7280',
        },
      },
    } : undefined,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={mergedOptions} />;
      case 'bar':
        return <Bar data={data} options={mergedOptions} />;
      case 'pie':
        return <Pie data={data} options={mergedOptions} />;
      default:
        return <Line data={data} options={mergedOptions} />;
    }
  };

  return (
    <div style={{ height: `${height}px` }}>
      {renderChart()}
    </div>
  );
};