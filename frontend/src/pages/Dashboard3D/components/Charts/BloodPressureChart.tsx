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

export const BloodPressureChart: React.FC = () => {
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
          label: 'Systolic',
          data: last24Hours.map(d => d.bloodPressureSystolic),
          borderColor: '#1E3556',
          backgroundColor: 'rgba(30, 53, 86, 0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: 'Diastolic',
          data: last24Hours.map(d => d.bloodPressureDiastolic),
          borderColor: '#2F5F90',
          backgroundColor: 'rgba(47, 95, 144, 0.1)',
          fill: false,
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
        display: true,
        position: 'top' as const,
        labels: {
          color: '#2D3748',
          font: {
            size: 11
          }
        }
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
        min: 40,
        max: 160,
      },
    },
  };

  return (
    <div className="h-48 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};
