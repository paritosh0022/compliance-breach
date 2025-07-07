
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as icons from 'lucide-react';

export default function ComponentCard({ component }) {
  const { name, description, category, icon } = component;
  const Icon = (icons)[icon] || icons.AlertCircle;
  return (
    <Card className="flex h-full transform-gpu flex-col transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex-1">
        <div className="mb-4 flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
            </div>
            <Badge variant="outline">{category}</Badge>
        </div>
        <CardTitle className="text-lg font-semibold">{name}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
