import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useVitals } from '../../../../contexts/VitalsContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const OxygenChart: React.FC = () => {
  const { vitalsHistory } = useVitals();

  const chartData = useMemo(() => {
    if (!vitalsHistory?.data.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    const last24Hours = vitalsHistory.data.slice(-24);
    
    return {
      labels: last24Hours.map(d => new Date(d.timestamp).toLocaleTimeString()),
      datasets: [
        {
          label: 'O₂ Saturation',
          data: last24Hours.map(d => d.oxygenSaturaon),
          borderColor: '#2BB673',
          backgroundColor: 'rgba(43, 182, 115, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [vitalsHistory]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#718096',
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          color: '#E2E8F0',
        },
        ticks: {
          color: '#4A5568',
        },
        min: 85,
        max: 100,
      },
    },
  };

  return (
    <div className="h-48 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};
