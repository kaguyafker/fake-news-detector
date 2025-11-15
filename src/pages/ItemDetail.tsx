import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Item {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadItem();
    }
  }, [id]);

  async function loadItem() {
    if (!id) return;

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load item",
        variant: "destructive",
      });
      navigate("/items");
    } else {
      setItem(data);
    }

    setLoading(false);
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);

    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      navigate("/items");
    }

    setDeleting(false);
  }

  const canEdit = item && user && (item.owner_id === user.id);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-10 w-32 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <p>Item not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" asChild className="mb-8">
        <Link to="/items">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Items
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">{item.title}</CardTitle>
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" size="icon" asChild>
                  <Link to={`/items/${item.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Item</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this item? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{item.description || "No description provided"}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Created: {new Date(item.created_at).toLocaleString()}</p>
            <p>Updated: {new Date(item.updated_at).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
