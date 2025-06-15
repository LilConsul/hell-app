export function SectionHeader({ title, description }) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">{title}</h2>
      <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
        {description}
      </p>
    </div>
  );
}