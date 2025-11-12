import React from 'react';
import { Loader2, Brain, Database, BarChart3, FileText } from 'lucide-react';

interface ProcessingLoaderProps {
  currentStep?: string;
  message?: string;
}

const ProcessingLoader: React.FC<ProcessingLoaderProps> = ({ 
  currentStep = 'Processing', 
  message = 'Analyzing your question...' 
}) => {
  const stepOrder = [
    'classify_question',
    'parse_question', 
    'generate_sql',
    'validate_and_fix_sql',
    'execute_sql',
    'format_results',
    'choose_visualization',
    'generate_chart',
    'generate_insights',
    'finalize_response'
  ];

  const getCurrentStepIndex = () => {
    const index = stepOrder.indexOf(currentStep.toLowerCase());
    return index === -1 ? 0 : index;
  };

  const getStepIcon = (step: string) => {
    switch (step.toLowerCase()) {
      case 'classify_question':
      case 'classification':
        return <Brain className="w-6 h-6 text-blue-500" />;
      case 'parse_question':
      case 'generate_sql':
      case 'validate_and_fix_sql':
      case 'execute_sql':
        return <Database className="w-6 h-6 text-green-500" />;
      case 'choose_visualization':
      case 'generate_chart':
        return <BarChart3 className="w-6 h-6 text-purple-500" />;
      case 'format_results':
      case 'generate_insights':
      case 'finalize_response':
        return <FileText className="w-6 h-6 text-orange-500" />;
      default:
        return <Loader2 className="w-6 h-6 text-[#009B72] animate-spin" />;
    }
  };

  const formatStepName = (step: string) => {
    return step
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const currentStepIndex = getCurrentStepIndex();
  const progressPercentage = Math.round(((currentStepIndex + 1) / stepOrder.length) * 100);

  return (
    <div className="flex flex-col items-center justify-center flex-1 text-[#333A3F] py-12">
      <div className="flex flex-col items-center space-y-6 max-w-md mx-auto">
        {/* Main loader */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#DDF7E3] border-t-[#009B72] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            {getStepIcon(currentStep)}
          </div>
        </div>

        {/* Status text */}
        <div className="text-center space-y-3">
          <h3 className="text-lg font-semibold text-[#009B72]">
            {formatStepName(currentStep)}
          </h3>
          <p className="text-sm text-gray-600 max-w-xs">
            {message}
          </p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mt-2">
            <span className="text-xs text-gray-500">Step {currentStepIndex + 1} of {stepOrder.length}</span>
            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#009B72] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{progressPercentage}%</span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex space-x-2">
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              className="w-2 h-2 bg-[#009B72] rounded-full animate-pulse"
              style={{
                animationDelay: `${dot * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>

        {/* Tips */}
        <div className="bg-[#DDF7E3] rounded-lg p-4 text-center max-w-sm">
          <p className="text-xs text-[#333A3F] opacity-75">
            💡 <strong>Tip:</strong> The more specific your question, the better insights I can provide!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingLoader;