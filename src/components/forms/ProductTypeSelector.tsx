import { Package, FileDigit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProductTypeSelectorProps {
  onSelect: (type: 'digital' | 'physical') => void;
}

const ProductTypeSelector = ({ onSelect }: ProductTypeSelectorProps) => {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-center">
        What type of product will you be selling with this form?
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
          onClick={() => onSelect('digital')}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
              <FileDigit className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-lg">Digital Product</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              E-books, courses, software, music, templates, or any downloadable content
            </CardDescription>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
          onClick={() => onSelect('physical')}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-lg">Physical Product</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Merchandise, clothing, accessories, or any tangible items that require shipping
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductTypeSelector;
