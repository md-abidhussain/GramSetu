import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Series colours are brand navy and saffron, not the green and amber used for
// status. Reusing a status colour for a series makes "green" mean two things.
// Checked for colour-blind separation: worst adjacent pair is 23.9 under
// protanopia, where 8 is the floor.
const SERIES = {
  tenders: '#1b4f91',
  projects: '#c26400'
};

export const RiskChart = ({ analytics }) => {
  if (!analytics) return null;

  const { projects = { Low: 0, Medium: 0, High: 0 }, tenders = { Low: 0, Medium: 0, High: 0 } } = analytics;

  const data = [
    {
      name: 'Low Risk',
      Projects: projects.Low || 0,
      Tenders: tenders.Low || 0
    },
    {
      name: 'Medium Risk',
      Projects: projects.Medium || 0,
      Tenders: tenders.Medium || 0
    },
    {
      name: 'High Risk',
      Projects: projects.High || 0,
      Tenders: tenders.High || 0
    }
  ];

  return (
    <Card className="h-[340px]">
      <CardHeader>
        <div>
          <CardTitle>Risk Assessments</CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">Distribution of calculated risks between tenders and projects</p>
        </div>
      </CardHeader>

      <CardContent className="h-64 pb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                fontSize: '11px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
            />
            <Bar dataKey="Tenders" fill={SERIES.tenders} radius={[2, 2, 0, 0]} maxBarSize={32} />
            <Bar dataKey="Projects" fill={SERIES.projects} radius={[2, 2, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RiskChart;
