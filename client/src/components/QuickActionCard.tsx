import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: "primary" | "green" | "purple" | "gray" | string;
  onClick: () => void;
}

export default function QuickActionCard({ title, description, icon, color, onClick }: QuickActionCardProps) {
  // Map color to Tailwind classes
  const colorMap = {
    primary: "bg-primary text-primary-foreground",
    green: "bg-green-500 text-white",
    purple: "bg-purple-500 text-white",
    gray: "bg-gray-500 text-white",
  };

  const bgColorClass = colorMap[color as keyof typeof colorMap] || colorMap.primary;

  return (
    <Card 
      className="flex flex-col items-center p-6 transition-all bg-card hover:shadow hover:bg-muted/50 cursor-pointer"
      onClick={onClick}
    >
      <div className={`p-3 mb-3 rounded-full ${bgColorClass}`}>
        {icon}
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground text-center">{description}</p>
    </Card>
  );
}
