interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow">
      <div className="flex justify-center mb-6">{icon}</div>
      <h3 className="text-xl font-semibold mb-4 text-[#003366]">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}