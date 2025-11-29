import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

export default function Analytics() {
  const weeklyTrends = [
    { week: 'Week 1', ppe: 45, spill: 12, pest: 3, fire: 0 },
    { week: 'Week 2', ppe: 38, spill: 15, pest: 2, fire: 1 },
    { week: 'Week 3', ppe: 42, spill: 10, pest: 4, fire: 0 },
    { week: 'Week 4', ppe: 24, spill: 8, pest: 3, fire: 0 },
  ];

  const branchComparison = [
    { branch: 'Downtown', violations: 85 },
    { branch: 'Westside', violations: 62 },
    { branch: 'Eastside', violations: 48 },
    { branch: 'Northside', violations: 71 },
  ];

  const hourlyHeatmap = [
    { hour: '6 AM', violations: 2 },
    { hour: '7 AM', violations: 5 },
    { hour: '8 AM', violations: 8 },
    { hour: '9 AM', violations: 12 },
    { hour: '10 AM', violations: 15 },
    { hour: '11 AM', violations: 18 },
    { hour: '12 PM', violations: 22 },
    { hour: '1 PM', violations: 20 },
    { hour: '2 PM', violations: 16 },
    { hour: '3 PM', violations: 12 },
    { hour: '4 PM', violations: 10 },
    { hour: '5 PM', violations: 14 },
    { hour: '6 PM', violations: 16 },
    { hour: '7 PM', violations: 19 },
    { hour: '8 PM', violations: 15 },
    { hour: '9 PM', violations: 8 },
    { hour: '10 PM', violations: 5 },
  ];

  const violationCategories = [
    { name: 'PPE Violations', value: 149, color: '#f97316' },
    { name: 'Spill Detection', value: 45, color: '#3b82f6' },
    { name: 'Pest Detection', value: 12, color: '#ef4444' },
    { name: 'Fire/Smoke', value: 1, color: '#a855f7' },
  ];

  const kpiData = [
    {
      title: 'Avg Daily Violations',
      value: '12.3',
      change: '-18%',
      trend: 'down',
      period: 'vs last month'
    },
    {
      title: 'Resolution Time',
      value: '2.4h',
      change: '-32%',
      trend: 'down',
      period: 'average time'
    },
    {
      title: 'Compliance Rate',
      value: '87%',
      change: '+5%',
      trend: 'up',
      period: 'this month'
    },
    {
      title: 'Critical Alerts',
      value: '4',
      change: '-60%',
      trend: 'down',
      period: 'this month'
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Analytics & Trends</h1>
          <p className="text-slate-600">Comprehensive insights into hygiene compliance and violations</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="30days">
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm text-slate-600">{kpi.title}</p>
              <div className={`flex items-center gap-1 text-sm ${
                kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpi.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{kpi.change}</span>
              </div>
            </div>
            <div>
              <div className="text-3xl mb-1">{kpi.value}</div>
              <p className="text-xs text-slate-500">{kpi.period}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Weekly Trends */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl mb-1">Weekly Violation Trends</h2>
          <p className="text-sm text-slate-600">Violation patterns over the last 4 weeks</p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={weeklyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" tick={{ fill: '#64748b' }} />
            <YAxis tick={{ fill: '#64748b' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} 
            />
            <Legend />
            <Line type="monotone" dataKey="ppe" stroke="#f97316" strokeWidth={2} name="PPE Violations" />
            <Line type="monotone" dataKey="spill" stroke="#3b82f6" strokeWidth={2} name="Spill Violations" />
            <Line type="monotone" dataKey="pest" stroke="#ef4444" strokeWidth={2} name="Pest Detections" />
            <Line type="monotone" dataKey="fire" stroke="#a855f7" strokeWidth={2} name="Fire Alerts" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Multi-Branch Comparison & Violation Categories */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl mb-1">Multi-Branch Comparison</h2>
            <p className="text-sm text-slate-600">Total violations by location</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={branchComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fill: '#64748b' }} />
              <YAxis dataKey="branch" type="category" tick={{ fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Bar dataKey="violations" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl mb-1">Violation Categories</h2>
            <p className="text-sm text-slate-600">Distribution by type</p>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={violationCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {violationCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {violationCategories.map((category, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                <div className="text-sm">
                  <p className="text-slate-600">{category.name}</p>
                  <p>{category.value} total</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hourly Heatmap */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl mb-1">High-Risk Hours Heatmap</h2>
          <p className="text-sm text-slate-600">Violation frequency by time of day</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyHeatmap}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tick={{ fill: '#64748b' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} 
            />
            <Bar dataKey="violations" fill="#10b981" radius={[8, 8, 0, 0]}>
              {hourlyHeatmap.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    entry.violations > 18 ? '#ef4444' : 
                    entry.violations > 12 ? '#f97316' : 
                    entry.violations > 6 ? '#fbbf24' : 
                    '#10b981'
                  } 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-slate-600">Low (0-6)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-yellow-400 rounded" />
            <span className="text-slate-600">Medium (7-12)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span className="text-slate-600">High (13-18)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-slate-600">Critical (19+)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
