import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Shield, CheckCircle, XCircle, HelpCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlassmorphicCard } from "@/components/GlassmorphicCard";
import { SkeletonStats } from "@/components/SkeletonCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfDay, parseISO } from "date-fns";

interface DayData {
  date: string;
  True: number;
  False: number;
  Uncertain: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, trueCount: 0, falseCount: 0, uncertainCount: 0 });
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();
    
    const { data, error } = await supabase
      .from("verifications")
      .select("verdict, created_at")
      .eq("user_id", user?.id);

    if (data) {
      const total = data.length;
      const trueCount = data.filter(v => v.verdict === "True").length;
      const falseCount = data.filter(v => v.verdict === "False").length;
      const uncertainCount = data.filter(v => v.verdict === "Uncertain").length;
      setStats({ total, trueCount, falseCount, uncertainCount });

      // Process chart data for last 7 days
      const days: DayData[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = startOfDay(subDays(new Date(), i));
        const dayStr = format(day, "yyyy-MM-dd");
        const dayData = data.filter(v => {
          const vDate = format(parseISO(v.created_at), "yyyy-MM-dd");
          return vDate === dayStr;
        });
        days.push({
          date: format(day, "MMM d"),
          True: dayData.filter(v => v.verdict === "True").length,
          False: dayData.filter(v => v.verdict === "False").length,
          Uncertain: dayData.filter(v => v.verdict === "Uncertain").length,
        });
      }
      setChartData(days);
    }
    setLoading(false);
  };

  const truePercent = stats.total > 0 ? Math.round((stats.trueCount / stats.total) * 100) : 0;
  const falsePercent = stats.total > 0 ? Math.round((stats.falseCount / stats.total) * 100) : 0;
  const uncertainPercent = stats.total > 0 ? Math.round((stats.uncertainCount / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
        </div>
        <SkeletonStats />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Your AI-powered fact-checking companion
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <GlassmorphicCard gradient>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Checks</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary opacity-80" />
          </div>
        </GlassmorphicCard>

        <GlassmorphicCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">True</p>
              <p className="text-3xl font-bold text-green-500">{truePercent}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
          </div>
        </GlassmorphicCard>

        <GlassmorphicCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">False</p>
              <p className="text-3xl font-bold text-red-500">{falsePercent}%</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500 opacity-80" />
          </div>
        </GlassmorphicCard>

        <GlassmorphicCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Uncertain</p>
              <p className="text-3xl font-bold text-yellow-500">{uncertainPercent}%</p>
            </div>
            <HelpCircle className="h-8 w-8 text-yellow-500 opacity-80" />
          </div>
        </GlassmorphicCard>
      </div>

      {/* Chart */}
      <GlassmorphicCard 
        title="Verification Trends" 
        description="Your verdicts over the last 7 days"
        className="mb-8"
        gradient
      >
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis allowDecimals={false} className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px"
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="True" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="False" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Uncertain" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassmorphicCard>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <GlassmorphicCard gradient>
          <div className="flex items-start gap-4">
            <Shield className="h-10 w-10 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Verify News Claims</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Check the accuracy of news headlines and claims using AI-powered fact verification
              </p>
              <Button onClick={() => navigate("/verify")} className="w-full bg-gradient-to-r from-primary to-primary/80">
                Start Verifying
              </Button>
            </div>
          </div>
        </GlassmorphicCard>

        <GlassmorphicCard>
          <div className="flex items-start gap-4">
            <CheckCircle className="h-10 w-10 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">How It Works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">1.</span>
                  <span>Submit any news claim or headline</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">2.</span>
                  <span>AI analyzes the claim for accuracy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">3.</span>
                  <span>Get verdict with confidence score</span>
                </li>
              </ul>
            </div>
          </div>
        </GlassmorphicCard>
      </div>
    </div>
  );
}
