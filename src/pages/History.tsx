import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GlassmorphicCard } from "@/components/GlassmorphicCard";
import { GradientBadge } from "@/components/GradientBadge";
import { SkeletonTable } from "@/components/SkeletonCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw, Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Verification {
  id: string;
  claim: string;
  verdict: string;
  confidence: number;
  reasoning: string;
  sources: any;
  created_at: string;
  isBookmarked?: boolean;
}

export default function History() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "True" | "False" | "Uncertain">("all");

  useEffect(() => {
    if (user) {
      fetchVerifications();
      fetchBookmarks();
    }
  }, [user]);

  const fetchVerifications = async () => {
    const { data, error } = await supabase
      .from("verifications")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast({ title: "Error", description: "Failed to load history", variant: "destructive" });
    } else {
      setVerifications(data || []);
    }
    setLoading(false);
  };

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from("bookmarks")
      .select("verification_id")
      .eq("user_id", user?.id);
    
    if (data) {
      setBookmarks(new Set(data.map(b => b.verification_id)));
    }
  };

  const toggleBookmark = async (verificationId: string) => {
    if (bookmarks.has(verificationId)) {
      await supabase.from("bookmarks").delete().eq("verification_id", verificationId).eq("user_id", user?.id);
      setBookmarks(prev => { const next = new Set(prev); next.delete(verificationId); return next; });
      toast({ title: "Removed from bookmarks" });
    } else {
      await supabase.from("bookmarks").insert({ user_id: user?.id, verification_id: verificationId });
      setBookmarks(prev => new Set(prev).add(verificationId));
      toast({ title: "Added to bookmarks" });
    }
  };

  const exportCSV = () => {
    const filteredData = filter === "all" ? verifications : verifications.filter(v => v.verdict === filter);
    const csv = [
      ["Date", "Claim", "Verdict", "Confidence", "Reasoning"],
      ...filteredData.map(v => [
        format(new Date(v.created_at), "yyyy-MM-dd HH:mm"),
        `"${v.claim.replace(/"/g, '""')}"`,
        v.verdict,
        v.confidence.toString(),
        `"${v.reasoning.replace(/"/g, '""')}"`
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verification-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredVerifications = filter === "all" 
    ? verifications 
    : verifications.filter(v => v.verdict === filter);

  if (loading) {
    return (
      <div className="container max-w-6xl py-8">
        <GlassmorphicCard title="Verification History">
          <SkeletonTable />
        </GlassmorphicCard>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 px-4">
      <GlassmorphicCard 
        title="Verification History" 
        description="Your last 50 news claim verifications"
        gradient
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="backdrop-blur-md bg-muted/50">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="True" className="text-green-600">True</TabsTrigger>
                <TabsTrigger value="False" className="text-red-600">False</TabsTrigger>
                <TabsTrigger value="Uncertain" className="text-yellow-600">Uncertain</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={exportCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {filteredVerifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No verifications found. Start verifying news claims!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Date</TableHead>
                    <TableHead>Claim</TableHead>
                    <TableHead className="w-[100px]">Verdict</TableHead>
                    <TableHead className="w-[100px]">Confidence</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVerifications.map((v) => (
                    <TableRow key={v.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(v.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="max-w-xs truncate font-medium">
                        {v.claim}
                      </TableCell>
                      <TableCell>
                        <GradientBadge variant={v.verdict.toLowerCase() as any}>
                          {v.verdict}
                        </GradientBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${v.confidence}%` }} 
                            />
                          </div>
                          <span className="text-sm">{v.confidence}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => toggleBookmark(v.id)}
                          >
                            {bookmarks.has(v.id) ? (
                              <BookmarkCheck className="h-4 w-4 text-primary" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => navigate("/verify", { state: { claim: v.claim } })}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </GlassmorphicCard>
    </div>
  );
}
