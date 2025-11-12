import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stream } from './Stream';
import WorkflowStates from './WorkflowStates';
import type { GraphState } from '@/types/playground';

interface SidebarProps {
  graphState: GraphState;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ graphState, onClose }) => {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg border-l border-gray-200 z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Process Details</h2>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Tabs defaultValue="workflow" className="flex-1">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="traces">Raw Traces</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workflow" className="p-4 mt-4">
          <WorkflowStates graphState={graphState} />
        </TabsContent>
        
        <TabsContent value="traces" className="p-4 mt-4">
          <Stream graphState={graphState} />
        </TabsContent>
      </Tabs>
    </div>
  );
};