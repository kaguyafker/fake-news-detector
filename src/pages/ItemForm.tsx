import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ItemForm() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const { toast } = useToast();

  const isEditing = !!id;

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
      setTitle(data.title);
      setDescription(data.description || "");
    }

    setInitialLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    if (isEditing) {
      const { error } = await supabase
        .from("items")
        .update({ title, description })
        .eq("id", id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Item updated successfully",
        });
        navigate(`/items/${id}`);
      }
    } else {
      const { data, error } = await supabase
        .from("items")
        .insert({ title, description, owner_id: user.id })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Item created successfully",
        });
        navigate(`/items/${data.id}`);
      }
    }

    setLoading(false);
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-8">
        <Link to="/items">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Items
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Item" : "Create New Item"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter item title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter item description"
                rows={5}
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update" : "Create"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/items")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
