import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Users, FileText, Ban, CheckCircle, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  email: string;
  profiles: { name: string | null; is_banned: boolean | null }[];
  user_roles: { role: string }[];
}

interface Verification {
  id: string;
  claim: string;
  verdict: string;
  confidence: number;
  created_at: string;
  profiles: { name: string | null } | null;
}

// Helper types for Supabase responses
interface ProfileResponse {
  id: string;
  name: string | null;
  is_banned: boolean | null;
  user_roles: { role: string }[];
}

interface VerificationResponse {
  id: string;
  claim: string;
  verdict: string;
  confidence: number;
  created_at: string;
  profiles: { name: string | null } | null;
}

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        name,
        is_banned,
        user_roles (role)
      `);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } else {
      // Cast data to unknown first to avoid Any error
      const profileData = data as unknown as ProfileResponse[];

      const mappedUsers = (profileData || []).map((profile) => ({
        id: profile.id,
        email: "",
        profiles: [{ name: profile.name, is_banned: profile.is_banned }],
        user_roles: profile.user_roles || []
      }));
      setUsers(mappedUsers);
    }
  }, [toast]);

  const loadVerifications = useCallback(async () => {
    const { data, error } = await supabase
      .from("verifications")
      .select(`
        id,
        claim,
        verdict,
        confidence,
        created_at,
        profiles (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error loading verifications:", error);
      toast({
        title: "Error",
        description: "Failed to load verification history",
        variant: "destructive",
      });
    } else {
      setVerifications(data as unknown as VerificationResponse[] || []);
    }
  }, [toast]);

  const checkAdmin = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    const adminStatus = !!data;
    setIsAdmin(adminStatus);

    if (adminStatus) {
      await Promise.all([loadUsers(), loadVerifications()]);
    }
    setLoading(false);
  }, [user, loadUsers, loadVerifications]);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  async function toggleBan(userId: string, currentBanStatus: boolean) {
    try {
      const { data, error } = await supabase.rpc('toggle_ban', { user_id_input: userId });

      if (error) throw error;

      setUsers(users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            profiles: [{ ...u.profiles[0], is_banned: data }]
          };
        }
        return u;
      }));

      toast({
        title: "Success",
        description: `User has been ${data ? 'banned' : 'unbanned'}.`,
      });
    } catch (error) {
      console.error("Error toggling ban:", error);
      toast({
        title: "Error",
        description: "Failed to update ban status",
        variant: "destructive",
      });
    }
  }

  const filteredVerifications = verifications.filter(v =>
    v.claim.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.profiles?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have permission to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.user_roles?.some((r) => r.role === "admin")).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {verifications.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users Management</TabsTrigger>
          <TabsTrigger value="history">Verification History</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isBanned = user.profiles?.[0]?.is_banned;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.profiles?.[0]?.name || "No name"}</TableCell>
                        <TableCell>
                          {user.user_roles?.some((r) => r.role === "admin") ? (
                            <Badge>Admin</Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isBanned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={isBanned ? "default" : "destructive"}
                            size="sm"
                            onClick={() => toggleBan(user.id, !!isBanned)}
                            disabled={user.user_roles?.some((r) => r.role === "admin")}
                          >
                            {isBanned ? <CheckCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                            {isBanned ? "Unban" : "Ban"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Verification Usage History</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search claims or users..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="w-[40%]">Claim</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVerifications.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.profiles?.name || "Unknown"}</TableCell>
                      <TableCell className="truncate max-w-[300px]" title={v.claim}>
                        {v.claim}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          v.verdict.toLowerCase().includes('true') ? 'default' :
                            v.verdict.toLowerCase().includes('false') ? 'destructive' : 'secondary'
                        }>
                          {v.verdict}
                        </Badge>
                      </TableCell>
                      <TableCell>{v.confidence}%</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(v.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredVerifications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No verifications found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
