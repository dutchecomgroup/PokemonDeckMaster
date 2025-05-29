import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  ShieldAlert, 
  UserPlus, 
  Ban, 
  CheckCircle, 
  KeyRound,
  MailIcon
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface UserType {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  role: string;
  status?: 'active' | 'blocked';
  createdAt: string;
  lastLogin?: string;
}

const UsersPage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isBlockUserDialogOpen, setIsBlockUserDialogOpen] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
  });

  const filteredUsers = users.filter((user: UserType) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.displayName && user.displayName.toLowerCase().includes(query))
    );
  });

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kon gebruiker niet verwijderen');
      }
      
      // Vernieuw de gebruikerslijst na succesvolle verwijdering
      refetch();
      
      // Toon succesmelding
      toast({
        title: "Gebruiker verwijderd",
        description: `${selectedUser.username} is succesvol verwijderd.`,
      });
      
      // Sluit het dialoogvenster
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      
      // Toon foutmelding
      toast({
        title: "Fout bij verwijderen",
        description: error instanceof Error ? error.message : 'Kon gebruiker niet verwijderen',
        variant: "destructive"
      });
    }
  };

  const handleRoleToggle = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kon gebruikersrol niet bijwerken');
      }
      
      // Haal gebruikerslijst opnieuw op om de wijzigingen te zien
      refetch();
      
      // Toon succesmelding
      toast({
        title: "Rol bijgewerkt",
        description: `Gebruikersrol is bijgewerkt naar ${newRole}`,
      });
    } catch (error: unknown) {
      console.error('Error updating user role:', error);
      
      // Toon foutmelding
      toast({
        title: "Fout bij bijwerken rol",
        description: error instanceof Error ? error.message : 'Kon gebruikersrol niet bijwerken',
        variant: "destructive"
      });
    }
  };
  
  const handleToggleBlockUser = async () => {
    if (!selectedUser) return;
    
    const newStatus = selectedUser.status === 'blocked' ? 'active' : 'blocked';
    const actionText = newStatus === 'blocked' ? 'geblokkeerd' : 'gedeblokkeerd';
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Kon gebruiker niet ${actionText}`);
      }
      
      // Vernieuw de gebruikerslijst
      refetch();
      
      // Toon succesmelding
      toast({
        title: `Gebruiker ${actionText}`,
        description: `${selectedUser.username} is succesvol ${actionText}.`,
      });
      
      // Sluit het dialoogvenster
      setIsBlockUserDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error(`Error ${actionText} user:`, error);
      
      // Toon foutmelding
      toast({
        title: `Fout bij ${actionText}`,
        description: error instanceof Error ? error.message : `Kon gebruiker niet ${actionText}`,
        variant: "destructive"
      });
    }
  };
  
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kon wachtwoord niet resetten');
      }
      
      // Toon succesmelding
      toast({
        title: "Wachtwoord gereset",
        description: `Een nieuw wachtwoord is gegenereerd en verzonden naar ${selectedUser.email}.`,
      });
      
      // Sluit het dialoogvenster
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      
      // Toon foutmelding
      toast({
        title: "Fout bij wachtwoord resetten",
        description: error instanceof Error ? error.message : 'Kon wachtwoord niet resetten',
        variant: "destructive"
      });
    }
  };

  return (
    <AdminLayout title="Gebruikersbeheer">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gebruikers</CardTitle>
            <CardDescription>Beheer alle gebruikers in het systeem</CardDescription>
          </div>
          <Button className="flex items-center">
            <UserPlus className="mr-2 h-4 w-4" /> Nieuwe gebruiker
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Zoeken op gebruikersnaam of e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Gebruikersnaam</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Aangemaakt op</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: UserType) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{user.username}</div>
                        {user.displayName && (
                          <div className="text-sm text-muted-foreground">{user.displayName}</div>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={user.role === 'admin' ? 'destructive' : 'outline'}
                            className="capitalize"
                          >
                            {user.role}
                          </Badge>
                          
                          {user.status === 'blocked' && (
                            <Badge variant="destructive" className="capitalize">
                              Geblokkeerd
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acties</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setIsEditDialogOpen(true);
                            }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Bewerken
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleToggle(
                                user.id, 
                                user.role === 'admin' ? 'user' : 'admin'
                              )}
                            >
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              {user.role === 'admin' ? 'Verwijder admin rechten' : 'Maak admin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsResetPasswordDialogOpen(true);
                              }}
                            >
                              <KeyRound className="mr-2 h-4 w-4" />
                              Wachtwoord resetten
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsBlockUserDialogOpen(true);
                              }}
                            >
                              {user.status === 'blocked' ? (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Deblokkeren
                                </>
                              ) : (
                                <>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Blokkeren
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex justify-center py-8 text-muted-foreground">
              Geen gebruikers gevonden.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gebruiker verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je de gebruiker <strong>{selectedUser?.username}</strong> wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog - in a real implementation this would include a form */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gebruiker bewerken</DialogTitle>
            <DialogDescription>
              Bewerk de gegevens van gebruiker <strong>{selectedUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-sm">
              Gebruikerseditor formulier zou hier komen.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)}>
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wachtwoord resetten</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je het wachtwoord van <strong>{selectedUser?.username}</strong> wilt resetten?
              Een nieuw wachtwoord zal worden gegenereerd en naar {selectedUser?.email} worden verzonden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button onClick={handleResetPassword}>
              Wachtwoord resetten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Block/Unblock User Dialog */}
      <Dialog open={isBlockUserDialogOpen} onOpenChange={setIsBlockUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.status === 'blocked' ? 'Gebruiker deblokkeren' : 'Gebruiker blokkeren'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.status === 'blocked' ? (
                <>Weet je zeker dat je <strong>{selectedUser?.username}</strong> wilt deblokkeren? De gebruiker zal weer toegang krijgen tot het systeem.</>
              ) : (
                <>Weet je zeker dat je <strong>{selectedUser?.username}</strong> wilt blokkeren? De gebruiker zal geen toegang meer hebben tot het systeem.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBlockUserDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button 
              variant={selectedUser?.status === 'blocked' ? 'default' : 'destructive'}
              onClick={handleToggleBlockUser}
            >
              {selectedUser?.status === 'blocked' ? 'Deblokkeren' : 'Blokkeren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UsersPage;