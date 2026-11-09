/**
 * Analytics Tab Component
 * Displays journey statistics and performance metrics
 */

import React, { useState } from 'react';
import { JourneyStats } from '../../components/features/command-center/JourneyStats';
import { MOCK_JOURNEY_STATS } from '../../mocks/journey';
import { GlassCard } from '../../components/layout/GlassCard';
import { Button } from '../../components/ui/Button';
import { Download, RefreshCw } from 'lucide-react';

interface AnalyticsTabProps {
  // Add props if needed for real data later
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = () => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
    console.log('Refreshing analytics...');
  };

  const handleExport = () => {
    console.log('Exporting analytics report...');
    // In real implementation, this would generate CSV/PDF
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          Refresh
        </Button>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExport}
        >
          Export Report
        </Button>
      </div>

      {/* Journey Stats Component */}
      <JourneyStats
        stats={MOCK_JOURNEY_STATS}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {/* Additional analytics sections can be added here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
            Department Performance
          </h3>
          <p className="text-neutral-500">Coming soon: Detailed department-wise metrics</p>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
            Staff Utilization
          </h3>
          <p className="text-neutral-500">Coming soon: Doctor and nurse workload analytics</p>
        </GlassCard>
      </div>
    </div>
  );
};