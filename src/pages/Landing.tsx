import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Search, Users, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Combat Misinformation with AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Verify news claims in real-time using advanced AI detection and trusted source validation
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Real-Time Verification</CardTitle>
                <CardDescription>
                  Instantly verify news claims against trusted sources
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Advanced Search</CardTitle>
                <CardDescription>
                  Search and filter verified items with powerful tools
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Collaborative</CardTitle>
                <CardDescription>
                  Share findings and contribute to the community
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Activity Tracking</CardTitle>
                <CardDescription>
                  Monitor trends and track verification history
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Fight Misinformation?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users verifying news and protecting truth
          </p>
          <Button size="lg" asChild>
            <Link to="/register">Create Free Account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
