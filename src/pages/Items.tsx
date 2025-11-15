import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Item {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  owner_id: string;
}

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Items</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Items</h1>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button asChild>
            <Link to="/items/new">
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Link>
          </Button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No items found. Create your first item!</p>
            <Button asChild className="mt-4">
              <Link to="/items/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Item
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Link key={item.id} to={`/items/${item.id}`}>
              <Card className="h-full hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{item.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{item.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">
                    {new Date(item.created_at).toLocaleDateString()}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
