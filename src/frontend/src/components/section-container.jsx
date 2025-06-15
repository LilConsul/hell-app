export function SectionContainer({children, className = "", withBackground = false}) {
  return (
    <section className={`py-20 ${withBackground ? 'bg-muted/50' : ''} ${className}`}>
      <div className="container px-4 sm:px-6 mx-auto max-w-6xl">
        {children}
      </div>
    </section>
  );
}