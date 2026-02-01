"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Bar,
} from "recharts";

interface MonthlyReview {
  month: string;
  label: string;
  count: number;
  avgRating: number;
}

interface ReviewsChartProps {
  data: MonthlyReview[];
  translations: {
    title: string;
    reviews: string;
    avgRating: string;
    noData: string;
  };
}

export function ReviewsChart({ data, translations }: ReviewsChartProps) {
  if (data.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            {translations.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center">
            <p className="text-white/40">{translations.noData}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">
          {translations.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 5]}
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number, name: string) => {
                  if (name === translations.avgRating) {
                    return [value.toFixed(1) + "/5", name];
                  }
                  return [value, name];
                }}
                labelStyle={{ color: "rgba(255,255,255,0.7)" }}
              />
              <Bar
                yAxisId="left"
                dataKey="count"
                name={translations.reviews}
                fill="#06b6d4"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgRating"
                name={translations.avgRating}
                stroke="#fbbf24"
                strokeWidth={2}
                dot={{ fill: "#fbbf24", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
