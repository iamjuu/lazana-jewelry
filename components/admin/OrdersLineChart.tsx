// @ts-nocheck
"use client";

import { LineChart } from '@mui/x-charts/LineChart';

interface OrdersLineChartProps {
  data: { date: string; paid: number; pending: number; cancelled: number }[];
}

export default function OrdersLineChart({ data }: OrdersLineChartProps) {
  // Transform data to date labels and separate series
  const xLabels = data.map((item, index) => {
    const date = new Date(item.date);
    // Format: show month and day for better readability
    // Only show year when it changes or on first entry
    if (index === 0 || date.getMonth() === 0 && new Date(data[index - 1].date).getFullYear() !== date.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const paidData = data.map(item => item.paid);
  const pendingData = data.map(item => item.pending);
  const cancelledData = data.map(item => item.cancelled);

  return (
    <div className="w-full" style={{ height: '300px' }}>
      <LineChart
        width={undefined}
        height={300}
        series={[
          {
            data: paidData,
            label: 'Paid',
            color: '#10b981',
            curve: 'natural',
          },
          {
            data: pendingData,
            label: 'Pending',
            color: '#f59e0b',
            curve: 'natural',
          },
          {
            data: cancelledData,
            label: 'Cancelled',
            color: '#ef4444',
            curve: 'natural',
          },
        ]}
        xAxis={[
          {
            scaleType: 'point',
            data: xLabels,
            tickLabelStyle: {
              fontSize: 12,
              fill: 'white',
            },
          },
        ]}
        yAxis={[
          {
            label: 'Orders Count',
            tickLabelStyle: {
              fontSize: 12,
              fill: 'white',
            },
          },
        ]}
        margin={{ left: 60, right: 30, top: 20, bottom: 40 }}
        sx={{
          '& .MuiChartsLegend-series text': {
            fill: 'white !important',
          },
          '& .MuiChartsAxis-tickLabel': {
            fill: 'white !important',
          },
          '& .MuiChartsAxis-label': {
            fill: 'white !important',
          },
          '& text': {
            fill: 'white !important',
          },
          '& .MuiChartsAxis-line': {
            stroke: '#52525b',
          },
          '& .MuiChartsAxis-tick': {
            stroke: '#52525b',
          },
        }}
      />
    </div>
  );
}



