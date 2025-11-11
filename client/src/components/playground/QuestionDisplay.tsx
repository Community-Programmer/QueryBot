import React from 'react';
import { Button } from '@/components/ui/button';

interface QuestionDisplayProps {
  displayedQuestions: string[];
  handleQuestionClick: (question: string) => void;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ 
  displayedQuestions, 
  handleQuestionClick 
}) => {
  return (
    <div className="w-full max-w-4xl mb-8">
      <h3 className="text-white text-lg font-semibold mb-4 text-center">
        Try these sample questions:
      </h3>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {displayedQuestions.map((question, index) => (
          <Button
            key={index}
            onClick={() => handleQuestionClick(question)}
            variant="outline"
            className="p-4 h-auto text-left bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300"
          >
            <span className="text-sm leading-relaxed">{question}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};