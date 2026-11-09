import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Brain, 
  Download,
  Share2,
  TrendingUp,
  Shield,
  FileText,
  Activity
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { AnalysisResult, Finding, Recommendation } from '../../../types/medical-images';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onDownloadReport?: () => void;
  onShare?: () => void;
  isLoading?: boolean;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  onDownloadReport,
  onShare,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <Brain className="w-10 h-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-300">
          AI is analyzing your image...
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          This may take a few moments
        </p>
      </div>
    );
  }

  const severityColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const typeColors = {
    doctor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    medication: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    lifestyle: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    monitoring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    emergency: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <Activity className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Analysis Results
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Powered by {result.aiModel}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {onDownloadReport && (
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={onDownloadReport}
            >
              Download PDF
            </Button>
          )}
          {onShare && (
            <Button
              variant="secondary"
              leftIcon={<Share2 className="w-4 h-4" />}
              onClick={onShare}
            >
              Share
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Confidence Score */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Confidence Score</h3>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-center">
            <div className="inline-flex items-baseline">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">
                {(result.confidence * 100).toFixed(1)}
              </span>
              <span className="text-xl text-gray-500 dark:text-gray-400 ml-1">%</span>
            </div>
            <div className="mt-4">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${result.confidence * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                AI confidence in analysis
              </p>
            </div>
          </div>
        </div>

        {/* Severity Level */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Severity Level</h3>
            {getSeverityIcon(result.severity)}
          </div>
          <div className="text-center">
            <div className={`inline-block px-6 py-3 rounded-full text-xl font-bold ${severityColors[result.severity]}`}>
              {result.severity.toUpperCase()}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              {result.severity === 'low' && 'No immediate concern detected'}
              {result.severity === 'medium' && 'Monitor and consult if symptoms persist'}
              {result.severity === 'high' && 'Consider consulting a healthcare professional'}
            </p>
          </div>
        </div>

        {/* Processing Info */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Processing Info</h3>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Processing Time</span>
              <span className="font-medium">{formatTime(result.processingTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">AI Model</span>
              <span className="font-medium">{result.aiModel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Analysis Date</span>
              <span className="font-medium">
                {result.timestamp.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Findings Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Key Findings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI-detected features in your image
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {result.findings.map((finding, index) => (
              <div
                key={finding.id}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: finding.color + '20' }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: finding.color }}
                    ></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {finding.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {(finding.confidence * 100).toFixed(1)}% confidence
                      </span>
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${finding.confidence * 100}%`,
                            backgroundColor: finding.color
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {finding.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recommendations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on AI analysis findings
              </p>
            </div>
            <Shield className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {result.recommendations.map((recommendation, index) => (
              <div
                key={recommendation.id}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${typeColors[recommendation.type]}`}>
                  {recommendation.type.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {recommendation.title}
                    </h4>
                    {recommendation.priority <= 1 && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs font-medium rounded-full">
                        PRIORITY
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {recommendation.description}
                  </p>
                  {recommendation.actionUrl && (
                    <div className="mt-3">
                      <a
                        href={recommendation.actionUrl}
                        className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Take action →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
              Important Medical Disclaimer
            </h4>
            <p className="text-yellow-700 dark:text-yellow-400/80 text-sm">
              This AI analysis is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. 
              Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              Never disregard professional medical advice or delay in seeking it because of something you have read in this analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;