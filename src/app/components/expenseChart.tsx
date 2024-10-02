// ExpenseChart.tsx
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpenseChartProps {
  categoryTotals: Record<string, number>;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ categoryTotals }) => {
  const data = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: 'Expenses by Category',
        data: Object.values(categoryTotals),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
      },
    ],
  };

  return (
    <div style={{ width: '300px', height: '300px' }}> 
      <h2>Expenses Breakdown by Category</h2>
      <Pie data={data} />
    </div>
  );
};

export default ExpenseChart;
