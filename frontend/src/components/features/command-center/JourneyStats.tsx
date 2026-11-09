/**
 * JourneyStats Component
 * Analytics dashboard for patient journey metrics and bottlenecks
 */

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Activity,
  Heart,
  Users,
  BedDouble,
  Stethoscope,
  Pill,
  Truck,
  Calendar,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';
import type { JourneyStats as JourneyStatsType } from '../../../types/journey.types';
import { GlassCard } from '../../layout/GlassCard';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface JourneyStatsProps {
  stats: JourneyStatsType;
  timeRange: 'today' | 'week' | 'month' | 'custom';
  onTimeRangeChange: (range: 'today' | 'week' | 'month' | 'custom') => void;
  onRefresh: () => void;
  onExport: () => void;
}

export const JourneyStats: React.FC<JourneyStatsProps> = ({
  stats,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  onExport,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('all');

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'triage': return AlertTriangle;
      case 'bed': return BedDouble;
      case 'doctor': return Stethoscope;
      case 'treatment': return Activity;
      case 'pharmacy': return Pill;
      case 'ambulance': return Truck;
      default: return Clock;
    }
  };

  const getMetricColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.8) return 'text-medical-green';
    if (value <= threshold) return 'text-medical-yellow';
    return 'text-medical-red';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-medical-red" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-medical-green" />;
    return null;
  };

  const timeRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom' },
  ] as const;

  // Mock trends data (would come from API)
  const trends = {
    triageTime: +5.2,
    bedTime: -2.1,
    doctorTime: -1.5,
    treatmentTime: +3.8,
    stayDuration: -1.2,
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-medical-cyan/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-medical-cyan" />
          </div>
          <h2 className="text-xl font-bold font-heading text-neutral-900 dark:text-white">
            Journey Analytics
          </h2>
          <Badge variant="info" size="sm">LIVE</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => onTimeRangeChange(range.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  timeRange === range.value
                    ? 'bg-white dark:bg-neutral-700 text-medical-cyan shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={onExport}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Average Triage Time */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-medical-orange/10 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-medical-orange" />
            </div>
            {getTrendIcon(trends.triageTime)}
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {stats.averageTriageTime.toFixed(1)} <span className="text-sm font-normal text-neutral-500">min</span>
          </p>
          <p className="text-sm text-neutral-500">Avg. Triage Time</p>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={getMetricColor(stats.averageTriageTime, 5)}>
              Target: 5 min
            </span>
            <span className="text-neutral-400">•</span>
            <span className={trends.triageTime > 0 ? 'text-medical-red' : 'text-medical-green'}>
              {trends.triageTime > 0 ? '+' : ''}{trends.triageTime}%
            </span>
          </div>
        </GlassCard>

        {/* Bed Allocation Time */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-medical-cyan/10 rounded-lg">
              <BedDouble className="w-4 h-4 text-medical-cyan" />
            </div>
            {getTrendIcon(trends.bedTime)}
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {stats.averageBedAllocationTime.toFixed(1)} <span className="text-sm font-normal text-neutral-500">min</span>
          </p>
          <p className="text-sm text-neutral-500">Bed Allocation</p>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={getMetricColor(stats.averageBedAllocationTime, 4)}>
              Target: 4 min
            </span>
            <span className="text-neutral-400">•</span>
            <span className={trends.bedTime > 0 ? 'text-medical-red' : 'text-medical-green'}>
              {trends.bedTime > 0 ? '+' : ''}{trends.bedTime}%
            </span>
          </div>
        </GlassCard>

        {/* Doctor Response Time */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-medical-green/10 rounded-lg">
              <Stethoscope className="w-4 h-4 text-medical-green" />
            </div>
            {getTrendIcon(trends.doctorTime)}
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {stats.averageDoctorResponseTime.toFixed(1)} <span className="text-sm font-normal text-neutral-500">min</span>
          </p>
          <p className="text-sm text-neutral-500">Doctor Response</p>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={getMetricColor(stats.averageDoctorResponseTime, 3)}>
              Target: 3 min
            </span>
            <span className="text-neutral-400">•</span>
            <span className={trends.doctorTime > 0 ? 'text-medical-red' : 'text-medical-green'}>
              {trends.doctorTime > 0 ? '+' : ''}{trends.doctorTime}%
            </span>
          </div>
        </GlassCard>

        {/* Treatment Time */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-medical-purple/10 rounded-lg">
              <Activity className="w-4 h-4 text-medical-purple" />
            </div>
            {getTrendIcon(trends.treatmentTime)}
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {stats.averageTreatmentTime} <span className="text-sm font-normal text-neutral-500">min</span>
          </p>
          <p className="text-sm text-neutral-500">Treatment Duration</p>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={getMetricColor(stats.averageTreatmentTime, 90)}>
              Target: 90 min
            </span>
            <span className="text-neutral-400">•</span>
            <span className={trends.treatmentTime > 0 ? 'text-medical-red' : 'text-medical-green'}>
              {trends.treatmentTime > 0 ? '+' : ''}{trends.treatmentTime}%
            </span>
          </div>
        </GlassCard>

        {/* Length of Stay */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-medical-yellow/10 rounded-lg">
              <Clock className="w-4 h-4 text-medical-yellow" />
            </div>
            {getTrendIcon(trends.stayDuration)}
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {stats.averageLengthOfStay.toFixed(1)} <span className="text-sm font-normal text-neutral-500">hrs</span>
          </p>
          <p className="text-sm text-neutral-500">Length of Stay</p>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={getMetricColor(stats.averageLengthOfStay, 24)}>
              Target: 24 hrs
            </span>
            <span className="text-neutral-400">•</span>
            <span className={trends.stayDuration > 0 ? 'text-medical-red' : 'text-medical-green'}>
              {trends.stayDuration > 0 ? '+' : ''}{trends.stayDuration}%
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Bottlenecks Section */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-medical-orange" />
            <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">
              Current Bottlenecks
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm bg-transparent border-none focus:ring-0 text-neutral-600 dark:text-neutral-400"
            >
              <option value="all">All Metrics</option>
              <option value="triage">Triage</option>
              <option value="bed">Bed Allocation</option>
              <option value="doctor">Doctor Response</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {stats.bottlenecks
            .filter(b => selectedMetric === 'all' || b.step.includes(selectedMetric))
            .map((bottleneck, index) => {
              const Icon = getMetricIcon(bottleneck.step.split('-')[0]);
              const severity = bottleneck.averageDelay > 15 ? 'high' : bottleneck.averageDelay > 8 ? 'medium' : 'low';
              
              return (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        severity === 'high' ? 'bg-medical-red/10' :
                        severity === 'medium' ? 'bg-medical-orange/10' :
                        'bg-medical-yellow/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          severity === 'high' ? 'text-medical-red' :
                          severity === 'medium' ? 'text-medical-orange' :
                          'text-medical-yellow'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-white">
                          {bottleneck.step.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </h4>
                        <p className="text-sm text-neutral-500">
                          {bottleneck.occurrences} occurrences
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        severity === 'high' ? 'danger' :
                        severity === 'medium' ? 'warning' :
                        'info'
                      }
                    >
                      {bottleneck.averageDelay} min delay
                    </Badge>
                  </div>

                  {/* Progress bar for delay impact */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Impact on patient flow</span>
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {Math.min(Math.round((bottleneck.averageDelay / 20) * 100), 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          severity === 'high' ? 'bg-medical-red' :
                          severity === 'medium' ? 'bg-medical-orange' :
                          'bg-medical-yellow'
                        }`}
                        style={{ width: `${Math.min((bottleneck.averageDelay / 20) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Suggested Action */}
                  <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">Suggestion: </span>
                      {bottleneck.step === 'bed-allocation' && 'Increase cleaning staff during peak hours'}
                      {bottleneck.step === 'doctor-assignment' && 'Implement emergency override protocol'}
                      {bottleneck.step === 'pharmacy' && 'Add evening pharmacy shift'}
                      {bottleneck.step === 'triage' && 'Add triage nurse during peak hours'}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </GlassCard>

      {/* Performance Trends */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
          Performance Trends
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Triage Time Trend */}
          <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-500">Triage Time</span>
              <span className="text-sm font-medium text-medical-green">-12% vs last week</span>
            </div>
            <div className="h-16 flex items-end gap-1">
              {[65, 70, 58, 62, 55, 48, 45].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-medical-cyan/20 rounded-t"
                    style={{ height: `${height}%` }}
                  >
                    <div
                      className="w-full bg-medical-cyan rounded-t"
                      style={{ height: `${height * 0.7}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-neutral-500">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

          {/* Bed Allocation Trend */}
          <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-500">Bed Allocation</span>
              <span className="text-sm font-medium text-medical-red">+5% vs last week</span>
            </div>
            <div className="h-16 flex items-end gap-1">
              {[45, 52, 48, 55, 58, 62, 60].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-medical-orange/20 rounded-t"
                    style={{ height: `${height}%` }}
                  >
                    <div
                      className="w-full bg-medical-orange rounded-t"
                      style={{ height: `${height * 0.8}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-neutral-500">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

// Add medical-purple to tailwind config if not present
// In tailwind.config.ts, add to colors:
// purple: {
//   medical: '#8B5CF6',
// },