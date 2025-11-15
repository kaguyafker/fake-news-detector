import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export default function Activity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadActivities();
  }, [user]);

  async function loadActivities() {
    if (!user) return;

    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .eq("actor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load activity log",
        variant: "destructive",
      });
    } else {
      setActivities(data || []);
    }

    setLoading(false);
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "default";
      case "update":
        return "secondary";
      case "delete":
        return "destructive";
      case "login":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Activity Log</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Activity Log</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No activity recorded yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <Badge variant={getActionColor(activity.action)}>
                        {activity.action.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.entity_type || "N/A"}</TableCell>
                    <TableCell>{new Date(activity.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
