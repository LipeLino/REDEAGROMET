import { LucideIcon } from "lucide-react";

interface DataParameterProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  unit?: string;
}

export function DataParameter({ icon, label, value, unit }: DataParameterProps) {
  return (
    <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
      <div className="text-[#003366] mb-3">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 text-center">{label}</h3>
      {value && (
        <p className="mt-2 text-xl font-bold text-[#003366]">
          {value}
          {unit && <span className="text-sm ml-1">{unit}</span>}
        </p>
      )}
    </div>
  );
}