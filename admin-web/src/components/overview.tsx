'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

interface OverviewProps {
  data?: {
    day: number
    week: number
    month: number
  }
}

export function Overview({ data }: OverviewProps) {
  const chartData = [
    { name: '일간', total: data?.day || 0 },
    { name: '주간', total: data?.week || 0 },
    { name: '월간', total: data?.month || 0 },
  ]

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="total" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  )
}