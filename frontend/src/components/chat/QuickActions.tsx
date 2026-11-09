import React from 'react';
import { 
  Heart, 
  Pill, 
  Stethoscope, 
  Thermometer, 
  AlertTriangle,
  Brain,
  Baby,
  Activity,
  Bug,
  Bone
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink';
}

interface QuickActionsProps {
  onActionSelect: (prompt: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionSelect }) => {
  const actions: QuickAction[] = [
    {
      id: 'symptom-checker',
      title: 'Symptom Checker',
      description: 'Describe your symptoms',
      icon: <Stethoscope className="w-5 h-5" />,
      prompt: 'I have these symptoms: [describe your symptoms]. What could it be and what should I do?',
      color: 'blue'
    },
    {
      id: 'medicine-info',
      title: 'Medicine Info',
      description: 'Learn about medications',
      icon: <Pill className="w-5 h-5" />,
      prompt: 'Tell me about this medicine: [medicine name]. What is it used for and what are the side effects?',
      color: 'green'
    },
    {
      id: 'first-aid',
      title: 'First Aid Guide',
      description: 'Emergency procedures',
      icon: <AlertTriangle className="w-5 h-5" />,
      prompt: 'What should I do in this emergency situation: [describe situation]?',
      color: 'red'
    },
    {
      id: 'fever',
      title: 'Fever & Cold',
      description: 'Fever management',
      icon: <Thermometer className="w-5 h-5" />,
      prompt: 'I have fever and cold symptoms. What home remedies and medications are recommended?',
      color: 'orange'
    },
    {
      id: 'mental-health',
      title: 'Mental Health',
      description: 'Stress & anxiety',
      icon: <Brain className="w-5 h-5" />,
      prompt: 'I am experiencing stress and anxiety. What coping strategies and professional help options are available?',
      color: 'purple'
    },
    {
      id: 'child-health',
      title: 'Child Health',
      description: 'Pediatric care',
      icon: <Baby className="w-5 h-5" />,
      prompt: 'My child has these symptoms: [describe symptoms]. What should I do and when to see a doctor?',
      color: 'pink'
    },
    {
      id: 'chronic-conditions',
      title: 'Chronic Conditions',
      description: 'Diabetes, BP, etc.',
      icon: <Activity className="w-5 h-5" />,
      prompt: 'I have [condition name]. What lifestyle changes and medications are recommended for management?',
      color: 'green'
    },
    {
      id: 'infections',
      title: 'Infections',
      description: 'Viral & bacterial',
      icon: <Bug className="w-5 h-5" />,
      prompt: 'I think I have an infection. What are the signs, treatments, and when to seek medical help?',
      color: 'red'
    },
    {
      id: 'bone-joint',
      title: 'Bone & Joint',
      description: 'Pain & injuries',
      icon: <Bone className="w-5 h-5" />,
      prompt: 'I have joint/bone pain. What could be the causes and what treatments are available?',
      color: 'orange'
    },
    {
      id: 'heart-health',
      title: 'Heart Health',
      description: 'Cardiac care',
      icon: <Heart className="w-5 h-5" />,
      prompt: 'What are the signs of heart problems and how to maintain heart health?',
      color: 'blue'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40',
    pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/40',
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Quick Health Assistance
        </h3>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          Click to get instant help
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionSelect(action.prompt)}
            className={`
              flex flex-col items-center p-4 rounded-xl border-2
              transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
              ${colorClasses[action.color]}
            `}
          >
            <div className={`p-3 rounded-lg mb-3 ${action.color.replace(/\d+$/, '')}-100 dark:${action.color.replace(/\d+$/, '')}-900/30`}>
              {action.icon}
            </div>
            <span className="font-medium text-sm mb-1">{action.title}</span>
            <span className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
              {action.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};