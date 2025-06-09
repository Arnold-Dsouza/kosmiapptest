import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureCardProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  imageUrl?: string;
  imageHint?: string;
}

export default function FeatureCard({ icon: Icon, title, description, imageUrl, imageHint }: FeatureCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {imageUrl && (
        <div className="aspect-video overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            width={600}
            height={400}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={imageHint || "abstract technology"}
          />
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-xl font-headline">
          {Icon && <Icon className="mr-3 h-6 w-6 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
