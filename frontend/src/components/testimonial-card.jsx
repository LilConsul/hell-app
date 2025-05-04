import { Quote } from "lucide-react";

export function TestimonialCard({quote, name, role, initial}) {
  return (
    <div className="bg-white dark:bg-muted rounded-2xl shadow p-6 border hover:border-primary/50 hover:shadow-md transition-all flex flex-col h-full">
      <div className="mb-4 text-primary">
        <Quote className="h-8 w-8 opacity-80" />
      </div>
      <p className="text-muted-foreground flex-grow text-sm md:text-base leading-relaxed">{quote}</p>
      <div className="flex items-center pt-6 mt-2 border-t border-muted">
        <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center text-primary font-bold mr-3 flex-shrink-0">
          {initial}
        </div>
        <div>
          <span className="block font-semibold text-sm md:text-base">{name}</span>
          <span className="text-xs md:text-sm text-muted-foreground">{role}</span>
        </div>
      </div>
    </div>
  );
}