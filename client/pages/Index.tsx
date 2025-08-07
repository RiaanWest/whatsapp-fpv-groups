import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, Package, Clock } from "lucide-react";

const mockProducts = [
  {
    id: "1",
    title: "DJI FPV Drone with Controller",
    price: "$899",
    description: "Excellent condition DJI FPV drone with original controller and goggles. Barely used, includes all original accessories and packaging.",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    seller: "Mike_FPV",
    location: "Los Angeles, CA",
    timePosted: "2 hours ago",
    category: "Complete Setup"
  },
  {
    id: "2",
    title: "Custom 5-inch Racing Quad",
    price: "$450",
    description: "Hand-built racing quad with premium components. T-Motor F60 Pro motors, Crossfire receiver, and RunCam Phoenix camera.",
    image: "https://images.unsplash.com/photo-1551731409-43eb3e517a1a?w=400&h=300&fit=crop",
    seller: "QuadBuilder_99",
    location: "Austin, TX",
    timePosted: "4 hours ago",
    category: "Racing"
  },
  {
    id: "3",
    title: "Fat Shark HDO2 FPV Goggles",
    price: "$320",
    description: "Fat Shark HDO2 goggles in great condition. Clear OLED display, comfortable fit. Includes diversity module.",
    seller: "FPVPilot_Jane",
    location: "Denver, CO",
    timePosted: "6 hours ago",
    category: "Goggles"
  },
  {
    id: "4",
    title: "TBS Crossfire Micro TX",
    price: "$89",
    description: "TBS Crossfire Micro transmitter module. Perfect for long range flying. Includes original antenna.",
    seller: "LongRange_Dave",
    location: "Seattle, WA",
    timePosted: "8 hours ago",
    category: "Electronics",
    isSold: true
  },
  {
    id: "5",
    title: "Betaflight F4 Flight Controller",
    price: "$35",
    description: "Brand new Betaflight F4 flight controller. Still in original packaging, perfect for your next build.",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
    seller: "TechBuilder",
    location: "Miami, FL",
    timePosted: "1 day ago",
    category: "Electronics"
  },
  {
    id: "6",
    title: "4S 1500mAh LiPo Battery Pack",
    price: "$45",
    description: "High-quality 4S 1500mAh 100C LiPo battery. Only 3 cycles, excellent condition. Perfect for 5-inch quads.",
    seller: "PowerUser_FPV",
    location: "Phoenix, AZ",
    timePosted: "1 day ago",
    category: "Batteries"
  }
];

const stats = [
  {
    title: "Active Listings",
    value: "1,247",
    icon: Package,
    change: "+12%"
  },
  {
    title: "Items Sold Today",
    value: "89",
    icon: TrendingUp,
    change: "+5%"
  },
  {
    title: "Active Groups",
    value: "23",
    icon: Activity,
    change: "+2%"
  },
  {
    title: "Avg. Response Time",
    value: "2.4h",
    icon: Clock,
    change: "-8%"
  }
];

export default function Index() {
  const [availableProducts, setAvailableProducts] = useState(mockProducts.filter(p => !p.isSold));
  const [soldProducts, setSoldProducts] = useState(mockProducts.filter(p => p.isSold));
  const [isLoading, setIsLoading] = useState(false);

  // Load real detected items
  useEffect(() => {
    loadItems();
    const interval = setInterval(loadItems, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const [availableResponse, soldResponse] = await Promise.all([
        fetch('/api/whatsapp/items'),
        fetch('/api/whatsapp/items/sold')
      ]);

      if (availableResponse.ok) {
        const available = await availableResponse.json();
        if (available.length > 0) {
          setAvailableProducts(available);
        }
      }

      if (soldResponse.ok) {
        const sold = await soldResponse.json();
        if (sold.length > 0) {
          setSoldProducts(sold);
        }
      }
    } catch (error) {
      console.error('Failed to load items:', error);
      // Keep using mock data on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto py-8 space-y-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-0 shadow-sm bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-fpv-success">{stat.change}</span> from last week
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">FPV Marketplace</h2>
              <p className="text-muted-foreground">
                Latest items from your WhatsApp groups
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-fpv-success/10 text-fpv-success border-fpv-success/20">
                {availableProducts.length} Available
              </Badge>
              <Badge variant="outline" className="bg-fpv-gray/10 text-fpv-gray border-fpv-gray/20">
                {soldProducts.length} Sold Today
              </Badge>
            </div>
          </div>

          <Tabs defaultValue="available" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="available">Available Items</TabsTrigger>
              <TabsTrigger value="sold">Recently Sold</TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
              
              {availableProducts.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No items available</h3>
                    <p className="text-muted-foreground">Check back later for new listings from your groups!</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sold" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {soldProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
              
              {soldProducts.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No recent sales</h3>
                    <p className="text-muted-foreground">Sold items will appear here and be removed after 24 hours.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
