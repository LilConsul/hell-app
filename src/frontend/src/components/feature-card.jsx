export function FeatureCard({icon: Icon, title, description, centered = false}) {
  return (
    <div
      className={`bg-background p-6 rounded-lg border hover:border-primary/50 transition-colors duration-300 ${centered ? 'flex flex-col items-center text-center' : ''}`}>
      <Icon className="h-10 w-10 text-primary mb-4"/>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}