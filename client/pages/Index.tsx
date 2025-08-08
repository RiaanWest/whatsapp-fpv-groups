import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, Package, Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [soldProducts, setSoldProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false, isConnecting: false });

  // Load real detected items and connection status
  useEffect(() => {
    loadItems();
    checkConnectionStatus();
    const interval = setInterval(() => {
      loadItems();
      checkConnectionStatus();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const [availableResponse, soldResponse] = await Promise.all([
        fetch('/api/whatsapp/items/14days'),
        fetch('/api/whatsapp/items/sold/14days')
      ]);

      if (availableResponse.ok) {
        const available = await availableResponse.json();
        setAvailableProducts(available);
      }

      if (soldResponse.ok) {
        const sold = await soldResponse.json();
        setSoldProducts(sold);
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status');
      if (response.ok) {
        const status = await response.json();
        setConnectionStatus(status);
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
    }
  };

  const getStats = () => {
    const activeGroups = connectionStatus.isConnected ? "Connected" : "Not Connected";
    const itemsFound = availableProducts.length + soldProducts.length;
    
    return [
      {
        title: "WhatsApp Status",
        value: activeGroups,
        icon: Activity,
        change: connectionStatus.isConnected ? "Connected" : "Disconnected"
      },
      {
        title: "Items Found",
        value: itemsFound.toString(),
        icon: Package,
        change: itemsFound > 0 ? `+${itemsFound}` : "0"
      },
      {
        title: "Available Items",
        value: availableProducts.length.toString(),
        icon: Package,
        change: availableProducts.length > 0 ? `+${availableProducts.length}` : "0"
      },
      {
        title: "Recently Sold",
        value: soldProducts.length.toString(),
        icon: TrendingUp,
        change: soldProducts.length > 0 ? `+${soldProducts.length}` : "0"
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto py-8 space-y-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getStats().map((stat) => (
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
                  {stat.change}
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
                {connectionStatus.isConnected 
                  ? "FPV items from your WhatsApp groups (last 14 days)" 
                  : "Connect WhatsApp to start monitoring groups"}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-fpv-success/10 text-fpv-success border-fpv-success/20">
                {availableProducts.length} Available
              </Badge>
              <Badge variant="outline" className="bg-fpv-gray/10 text-fpv-gray border-fpv-gray/20">
                {soldProducts.length} Sold
              </Badge>
              {!connectionStatus.isConnected && (
                <Button asChild size="sm">
                  <a href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Setup
                  </a>
                </Button>
              )}
            </div>
          </div>

          {!connectionStatus.isConnected ? (
            <Card className="text-center py-12">
              <CardContent>
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">WhatsApp Not Connected</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your WhatsApp account to start monitoring FPV groups for items.
                </p>
                <Button asChild>
                  <a href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Go to Settings
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="available" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="available">Available Items</TabsTrigger>
                <TabsTrigger value="sold">Recently Sold</TabsTrigger>
              </TabsList>

              <TabsContent value="available" className="space-y-6">
                {isLoading ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading items...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {availableProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableProducts.map((product) => (
                          <ProductCard key={product.id} {...product} />
                        ))}
                      </div>
                    ) : (
                      <Card className="text-center py-12">
                        <CardContent>
                          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-semibold mb-2">No items available</h3>
                          <p className="text-muted-foreground">
                            No FPV items have been detected in your monitored groups in the last 14 days.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="sold" className="space-y-6">
                {isLoading ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading items...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {soldProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {soldProducts.map((product) => (
                          <ProductCard key={product.id} {...product} />
                        ))}
                      </div>
                    ) : (
                      <Card className="text-center py-12">
                        <CardContent>
                          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-semibold mb-2">No recent sales</h3>
                          <p className="text-muted-foreground">
                            No sold items have been detected in your monitored groups in the last 14 days.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
