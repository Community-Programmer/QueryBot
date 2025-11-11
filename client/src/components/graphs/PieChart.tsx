import React from 'react'
import { PieChart } from '@mui/x-charts/PieChart'

export interface PieChartProps {
  data: {
    id: number
    value: number
    label: string
  }[]
}

export const exampleData: PieChartProps = {
  data: [
    { id: 0, value: 10, label: '' },
    { id: 1, value: 15, label: '' },
    { id: 2, value: 20, label: '' },
  ],
}

const PieChartComponent: React.FC<PieChartProps> = ({ data }) => {
  console.log('PieChart received data:', data);
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No data available for pie chart</p>
      </div>
    );
  }

  try {
    return (
      <PieChart
        series={[
          {
            data: data,
            highlightScope: { faded: 'global', highlighted: 'item' },
            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
          },
        ]}
        height={300}
        width={400}
      />
    );
  } catch (error) {
    console.error('PieChart rendering error:', error);
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <p>Error rendering pie chart: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}

export default PieChartComponent
