import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Clock, MapPin, User } from "lucide-react";

interface ProductCardProps {
  id: string;
  title: string;
  price: string;
  description: string;
  image?: string;
  seller: string;
  location: string;
  timePosted: string;
  isSold?: boolean;
  category?: string;
}

export function ProductCard({
  title,
  price,
  description,
  image,
  seller,
  location,
  timePosted,
  isSold = false,
  category
}: ProductCardProps) {
  return (
    <Card className={`group transition-all duration-300 hover:shadow-lg ${isSold ? 'opacity-60' : 'hover:-translate-y-1'} overflow-hidden`}>
      <CardHeader className="p-0">
        <div className="relative">
          {image ? (
            <img 
              src={image} 
              alt={title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-fpv-blue/20 to-fpv-orange/20 flex items-center justify-center">
              <div className="text-fpv-gray text-sm">No Image</div>
            </div>
          )}
          {isSold && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg px-4 py-2">
                SOLD
              </Badge>
            </div>
          )}
          {category && !isSold && (
            <Badge className="absolute top-3 left-3 bg-fpv-blue text-white">
              {category}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">{title}</h3>
          <span className="text-xl font-bold text-fpv-blue ml-2 flex-shrink-0">{price}</span>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="w-4 h-4 mr-2" />
            <span>{seller}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{location}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-2" />
            <span>{timePosted}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
