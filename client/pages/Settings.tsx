import { useState } from "react";
import { WhatsAppStatus } from "@/components/WhatsAppStatus";
import { GroupSelection } from "@/components/GroupSelection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings2, 
  Smartphone, 
  Users, 
  Bell, 
  Clock, 
  Filter,
  Save,
  RefreshCw
} from "lucide-react";

export default function Settings() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [phoneNumber] = useState("+1 (555) 123-4567");
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("5");
  const [soldItemDelay, setSoldItemDelay] = useState("24");
  const [keywordFilters, setKeywordFilters] = useState("drone, quad, fpv, goggles, controller");

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 3000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const handleSaveSettings = () => {
    // Save settings logic here
    console.log("Settings saved");
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your WhatsApp integration and monitoring preferences
        </p>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="whatsapp" className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Groups</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-6">
          <WhatsAppStatus
            isConnected={isConnected}
            isConnecting={isConnecting}
            phoneNumber={phoneNumber}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />

          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5" />
                  <span>Sync Status</span>
                </CardTitle>
                <CardDescription>Monitor your WhatsApp data synchronization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-fpv-success/5 rounded-lg border border-fpv-success/20">
                    <div className="text-2xl font-bold text-fpv-success">247</div>
                    <div className="text-sm text-muted-foreground">Messages scanned today</div>
                  </div>
                  <div className="text-center p-4 bg-fpv-blue/5 rounded-lg border border-fpv-blue/20">
                    <div className="text-2xl font-bold text-fpv-blue">31</div>
                    <div className="text-sm text-muted-foreground">Items detected</div>
                  </div>
                  <div className="text-center p-4 bg-fpv-orange/5 rounded-lg border border-fpv-orange/20">
                    <div className="text-2xl font-bold text-fpv-orange">12</div>
                    <div className="text-sm text-muted-foreground">Items marked sold</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Force Sync Now
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <GroupSelection isConnected={isConnected} />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>Configure when and how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Get notified when new items are detected
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <Label className="text-base">Notification Filters</Label>
                <div className="space-y-2">
                  <Label htmlFor="keywords" className="text-sm">Keywords to monitor</Label>
                  <Input
                    id="keywords"
                    value={keywordFilters}
                    onChange={(e) => setKeywordFilters(e.target.value)}
                    placeholder="drone, quad, fpv, goggles..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated keywords to look for in messages
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Automation</span>
              </CardTitle>
              <CardDescription>Configure automatic scanning and cleanup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto Refresh</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically scan for new messages
                  </div>
                </div>
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>

              {autoRefresh && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="refresh-interval" className="text-sm">Refresh interval (minutes)</Label>
                    <Input
                      id="refresh-interval"
                      type="number"
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(e.target.value)}
                      min="1"
                      max="60"
                      className="w-32"
                    />
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="sold-delay" className="text-sm">Remove sold items after (hours)</Label>
                <Input
                  id="sold-delay"
                  type="number"
                  value={soldItemDelay}
                  onChange={(e) => setSoldItemDelay(e.target.value)}
                  min="1"
                  max="168"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Items marked as sold will be removed after this time
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} className="bg-fpv-blue hover:bg-fpv-blue/90">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
