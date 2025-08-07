import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Settings2, AlertCircle, TrendingUp } from "lucide-react";

interface WhatsAppGroup {
  id: string;
  name: string;
  memberCount: number;
  isActive: boolean;
  lastActivity: string;
  description?: string;
  messagesPerDay?: number;
  itemsFound?: number;
}


interface GroupSelectionProps {
  isConnected?: boolean;
}

export function GroupSelection({ isConnected = false }: GroupSelectionProps) {
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch groups when connected
  useEffect(() => {
    if (isConnected) {
      loadGroups();
    } else {
      setGroups([]);
    }
  }, [isConnected]);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/groups');
      if (response.ok) {
        const groupsData = await response.json();
        setGroups(groupsData);
      } else {
        console.error('Failed to load groups');
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const newActiveState = !group.isActive;

    try {
      const response = await fetch(`/api/whatsapp/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newActiveState }),
      });

      if (response.ok) {
        setGroups(groups.map(g =>
          g.id === groupId ? { ...g, isActive: newActiveState } : g
        ));
      } else {
        console.error('Failed to update group status');
      }
    } catch (error) {
      console.error('Failed to update group status:', error);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeGroups = filteredGroups.filter(g => g.isActive);
  const inactiveGroups = filteredGroups.filter(g => !g.isActive);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>WhatsApp Groups</span>
          </CardTitle>
          <CardDescription>Select which groups to monitor for FPV items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold mb-2">WhatsApp Not Connected</h3>
              <p className="text-sm text-muted-foreground">
                Connect your WhatsApp account above to view and select groups
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>WhatsApp Groups</span>
            </CardTitle>
            <CardDescription>
              {activeGroups.length} of {groups.length} groups selected for monitoring
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-fpv-blue/10 text-fpv-blue border-fpv-blue/20">
            {groups.reduce((sum, g) => sum + (g.itemsFound || 0), 0)} items found today
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Groups ({groups.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeGroups.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveGroups.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-fpv-blue border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading groups...</p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <GroupCard key={group.id} group={group} onToggle={() => toggleGroup(group.id)} />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-fpv-blue border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading groups...</p>
              </div>
            ) : (
              activeGroups.map((group) => (
                <GroupCard key={group.id} group={group} onToggle={() => toggleGroup(group.id)} />
              ))
            )}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-fpv-blue border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading groups...</p>
              </div>
            ) : (
              inactiveGroups.map((group) => (
                <GroupCard key={group.id} group={group} onToggle={() => toggleGroup(group.id)} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {filteredGroups.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No groups found matching your search</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GroupCard({ group, onToggle }: { group: WhatsAppGroup; onToggle: () => void }) {
  return (
    <div className={`border rounded-lg p-4 transition-all ${group.isActive ? 'bg-fpv-blue/5 border-fpv-blue/20' : 'bg-muted/30'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-3">
            <h4 className="font-semibold">{group.name}</h4>
            <Badge variant="outline" className="text-xs">
              {group.memberCount.toLocaleString()} members
            </Badge>
            {group.itemsFound && group.itemsFound > 0 && (
              <Badge variant="outline" className="text-xs bg-fpv-success/10 text-fpv-success border-fpv-success/20">
                <TrendingUp className="w-3 h-3 mr-1" />
                {group.itemsFound} items today
              </Badge>
            )}
          </div>
          
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>Last activity: {group.lastActivity}</span>
            <span>~{group.messagesPerDay} msgs/day</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Switch
            checked={group.isActive}
            onCheckedChange={onToggle}
          />
        </div>
      </div>
    </div>
  );
}
