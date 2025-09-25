import { classificationSystems } from '@/data/classification-systems';
import type { ClassificationSystem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export function ClassificationInfo() {
  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {classificationSystems.map((system: ClassificationSystem) => (
        <Card key={system.id} className="flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out rounded-lg overflow-hidden">
          <CardHeader className="bg-secondary/30 p-4">
            <div className="flex items-center space-x-3">
              {system.icon && <system.icon className="h-7 w-7 text-primary flex-shrink-0" />}
              <CardTitle className="text-lg font-semibold leading-tight">{system.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex-grow flex flex-col">
            <p className="text-sm text-muted-foreground mb-4 flex-grow">{system.description}</p>
            <Button asChild variant="outline" className="mt-auto w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors group">
              <Link href={system.link} target="_blank" rel="noopener noreferrer" aria-label={`Learn more about ${system.name}`}>
                Learn More
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
