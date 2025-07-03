import { type ComponentData } from '@/lib/component-data';
import ComponentCard from './component-card';

interface ComponentGridProps {
  components: ComponentData[];
}

export default function ComponentGrid({ components }: ComponentGridProps) {
  if (components.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 py-20 text-center">
        <h3 className="text-lg font-semibold text-muted-foreground">No Components Found</h3>
        <p className="text-sm text-muted-foreground">Try selecting another category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {components.map(component => (
        <ComponentCard key={component.name} component={component} />
      ))}
    </div>
  );
}
