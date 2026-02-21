import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColorClass: string;
  bgColorClass: string;
  subtitle?: string;
  progress?: number;
  progressColorClass?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  iconColorClass,
  bgColorClass,
  subtitle,
  progress,
  progressColorClass = 'bg-blue-600'
}: KpiCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${bgColorClass} ${iconColorClass}`}>
          <Icon size={20} />
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
          <div className={`${progressColorClass} h-2 rounded-full`} style={{ width: `${progress}%` }}></div>
        </div>
      )}
      {subtitle && (
        <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}
