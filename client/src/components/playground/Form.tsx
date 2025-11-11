import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FormProps {
  selectedQuestion: string;
  setSelectedQuestion: (question: string) => void;
  onFormSubmit: () => void;
  disabled?: boolean;
}

export const Form: React.FC<FormProps> = ({ 
  selectedQuestion, 
  setSelectedQuestion, 
  onFormSubmit, 
  disabled = false 
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestion.trim() && !disabled) {
      onFormSubmit();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8">
      <div className="flex gap-3">
        <Input
          value={selectedQuestion}
          onChange={(e) => setSelectedQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about your data..."
          disabled={disabled}
          className="flex-1 h-12 bg-white border border-gray-300 rounded-xl px-4 text-black placeholder-gray-500 focus:border-[#009B72] focus:ring-2 focus:ring-[#009B72]/20"
        />
        <Button 
          type="submit"
          disabled={!selectedQuestion.trim() || disabled}
          className="h-12 px-6 bg-[#009B72] text-white rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 hover:bg-[#007d5c] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {disabled ? 'Running...' : 'Ask'}
        </Button>
      </div>
    </form>
  );
};