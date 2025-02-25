import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: "primary" | "green" | "purple" | string;
}

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  // Map color to Tailwind classes
  const colorMap = {
    primary: "bg-primary text-primary-foreground",
    green: "bg-green-500 text-white",
    purple: "bg-purple-500 text-white",
    gray: "bg-gray-500 text-white",
  };

  const bgColorClass = colorMap[color as keyof typeof colorMap] || colorMap.primary;

  return (
    <Card className="p-6 bg-card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${bgColorClass}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
        </div>
      </div>
    </Card>
  );
}
