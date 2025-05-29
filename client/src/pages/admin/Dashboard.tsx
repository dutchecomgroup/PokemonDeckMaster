import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Loader2, 
  Users, 
  Database, 
  FileStack, 
  Settings, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  Star, 
  MoreHorizontal 
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

// Helper function to get color for Pokémon card types
const getTypeColor = (type: string, isBackground = false): string => {
  const colors: Record<string, { bg: string, text: string }> = {
    'Grass': { bg: 'rgba(122, 199, 76, 0.2)', text: 'rgb(91, 186, 71)' },
    'Fire': { bg: 'rgba(253, 125, 36, 0.2)', text: 'rgb(253, 125, 36)' },
    'Water': { bg: 'rgba(69, 146, 196, 0.2)', text: 'rgb(69, 146, 196)' },
    'Lightning': { bg: 'rgba(238, 213, 53, 0.2)', text: 'rgb(238, 213, 53)' },
    'Psychic': { bg: 'rgba(149, 99, 171, 0.2)', text: 'rgb(149, 99, 171)' },
    'Fighting': { bg: 'rgba(213, 103, 35, 0.2)', text: 'rgb(213, 103, 35)' },
    'Darkness': { bg: 'rgba(89, 87, 97, 0.2)', text: 'rgb(89, 87, 97)' },
    'Metal': { bg: 'rgba(170, 170, 170, 0.2)', text: 'rgb(170, 170, 170)' },
    'Fairy': { bg: 'rgba(249, 173, 255, 0.2)', text: 'rgb(249, 173, 255)' },
    'Dragon': { bg: 'rgba(118, 111, 218, 0.2)', text: 'rgb(118, 111, 218)' },
    'Colorless': { bg: 'rgba(200, 200, 200, 0.2)', text: 'rgb(170, 170, 170)' },
    'Rock': { bg: 'rgba(163, 140, 33, 0.2)', text: 'rgb(163, 140, 33)' },
  };

  const defaultColor = { bg: 'rgba(180, 180, 180, 0.2)', text: 'rgb(180, 180, 180)' };
  const typeColor = colors[type] || defaultColor;
  
  return isBackground ? typeColor.bg : typeColor.text;
};

interface RecentUser {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  role: string;
  registeredAt: string;
  lastLogin: string;
}

interface PopularCard {
  id: string;
  name: string;
  imageUrl: string;
  rarity: string;
  type: string;
  set: string;
  count: number;
  collectionCount?: number; // From backend response
  setName?: string; // From backend response
}

const AdminDashboard: React.FC = () => {
  const [statsSummary, setStatsSummary] = useState({
    totalUsers: 0,
    totalCollections: 0,
    totalCards: 0,
    activeUsers: 0
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/statistics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/statistics');
      if (!res.ok) throw new Error('Failed to fetch admin statistics');
      return res.json();
    },
  });
  
  const { data: recentUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/recent-users'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/recent-users');
        if (!res.ok) throw new Error('Failed to fetch recent users');
        const data = await res.json();
        
        // Map the API response to our expected format
        return data.map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email || 'No email provided',
          avatarUrl: user.displayName ? 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=6d28d9&color=fff` : 
            undefined,
          role: user.role,
          registeredAt: user.createdAt,
          lastLogin: user.lastLogin
        }));
      } catch (error) {
        console.error('Error fetching recent users:', error);
        return [];
      }
    },
  });
  
  const { data: popularCards, isLoading: isLoadingCards } = useQuery({
    queryKey: ['/api/admin/popular-cards'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/popular-cards');
        if (!res.ok) throw new Error('Failed to fetch popular cards');
        const data = await res.json();
        
        // Map the API response to our expected format
        return data.map((card: any) => ({
          id: card.id,
          name: card.name,
          imageUrl: card.imageUrl || `https://via.placeholder.com/150x210?text=${encodeURIComponent(card.name)}`,
          rarity: card.rarity,
          type: card.type,
          set: card.setName || card.set,
          count: card.collectionCount || 0
        }));
      } catch (error) {
        console.error('Error fetching popular cards:', error);
        return [];
      }
    },
  });

  useEffect(() => {
    if (stats) {
      setStatsSummary(stats);
    }
  }, [stats]);

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard 
          title="Users" 
          value={statsSummary.totalUsers}
          description="Total registered users"
          icon={<Users className="h-6 w-6" />}
          change={5}
          isLoading={isLoading}
        />
        <StatCard 
          title="Collections" 
          value={statsSummary.totalCollections}
          description="Total created collections"
          icon={<FileStack className="h-6 w-6" />}
          change={12}
          isLoading={isLoading}
        />
        <StatCard 
          title="Stored Cards" 
          value={statsSummary.totalCards}
          description="Cards in collections"
          icon={<Database className="h-6 w-6" />}
          change={32}
          isLoading={isLoading}
        />
        <StatCard 
          title="Active Users" 
          value={statsSummary.activeUsers}
          description="Last 30 days"
          icon={<Users className="h-6 w-6" />}
          change={-3}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-purple-600">Recent Users</CardTitle>
            <CardDescription>Latest registered users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : recentUsers && recentUsers.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Last Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.slice(0, 5).map((user: RecentUser) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {user.avatarUrl ? (
                                <AvatarImage src={user.avatarUrl} alt={user.username} />
                              ) : (
                                <AvatarFallback className="bg-purple-100 text-purple-600">
                                  {user.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{user.username}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'} className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(user.registeredAt), 'MMM d, yyyy')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {format(new Date(user.lastLogin), 'MMM d, h:mm a')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-center">
                <div className="space-y-2">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p className="text-sm text-muted-foreground">No users found</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-purple-600">Popular Cards</CardTitle>
            <CardDescription>Most collected cards across all collections</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCards ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : popularCards && popularCards.length > 0 ? (
              <div className="space-y-4">
                {popularCards && popularCards.slice(0, 5).map((card: PopularCard) => (
                  <div key={card.id} className="flex items-center gap-4 rounded-lg border p-3 hover:bg-accent/40 transition-colors">
                    <div className="flex-shrink-0 w-12 h-16 overflow-hidden">
                      <img 
                        src={card.imageUrl} 
                        alt={card.name}
                        className="rounded w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://via.placeholder.com/150x210?text=${encodeURIComponent(card.name)}`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{card.name}</h4>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold">{card.collectionCount || card.count || 0}</span>
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                        <Badge variant="outline" className="capitalize bg-opacity-50" style={{
                          backgroundColor: getTypeColor(card.type, true),
                          color: getTypeColor(card.type),
                          borderColor: getTypeColor(card.type)
                        }}>
                          {card.type}
                        </Badge>
                        <span className="truncate">{card.set}</span>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {card.rarity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-center">
                <div className="space-y-2">
                  <Database className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p className="text-sm text-muted-foreground">No popular cards found</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Beheertools</CardTitle>
            <CardDescription>Snelle acties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Button 
                variant="outline" 
                className="h-auto flex flex-col items-center justify-center p-4 space-y-2"
                onClick={() => window.location.href = '/admin/users'}
              >
                <Users className="h-8 w-8 text-primary" />
                <span className="text-sm">Gebruikersbeheer</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex flex-col items-center justify-center p-4 space-y-2"
                onClick={() => window.location.href = '/admin/collections'}
              >
                <FileStack className="h-8 w-8 text-primary" />
                <span className="text-sm">Collectiebeheer</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex flex-col items-center justify-center p-4 space-y-2"
                onClick={() => window.location.href = '/admin/cards'}
              >
                <Database className="h-8 w-8 text-primary" />
                <span className="text-sm">Kaartenbeheer</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex flex-col items-center justify-center p-4 space-y-2"
                onClick={() => window.location.href = '/admin/settings'}
              >
                <Settings className="h-8 w-8 text-primary" />
                <span className="text-sm">Instellingen</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  change: number;
  isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, change, isLoading }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <div className="h-7 flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            )}
          </div>
          <div className="rounded-full p-2 bg-primary/10">
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{description}</p>
          <div className={`flex items-center text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? (
              <ArrowUp className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 mr-1" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;