import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Award, 
  Gamepad2, 
  MessageSquare, 
  User, 
  TrendingUp, 
  Target,
  Crown,
  Star,
  Trophy,
  LogOut
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LearningModules } from "./dashboard/LearningModules";
import { QuizCenter } from "./dashboard/QuizCenter";
import { GameCenter } from "./dashboard/GameCenter";
import { UserProfile } from "./dashboard/UserProfile";
import { ConstitutionalChatbot } from "./dashboard/ConstitutionalChatbot";

interface DashboardProps {
  onSignOut: () => void;
}

export function Dashboard({ onSignOut }: DashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      setUser(user);

      if (user) {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile error:', profileError);
        } else if (profileData) {
          setProfile(profileData);
        }

        // Fetch user badges
        const { data: badgesData, error: badgesError } = await supabase
          .from('user_badges')
          .select(`
            *,
            badges (*)
          `)
          .eq('user_id', user.id);

        if (badgesError) {
          console.error('Badges error:', badgesError);
        } else {
          setUserBadges(badgesData || []);
        }

        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select(`
            *,
            learning_modules (*)
          `)
          .eq('user_id', user.id);

        if (progressError) {
          console.error('Progress error:', progressError);
        } else {
          setProgress(progressData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      // Clean up auth state
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      await supabase.auth.signOut({ scope: 'global' });
      
      toast({
        title: "Signed out successfully",
        description: "Come back soon to continue your constitutional journey!",
      });
      
      setTimeout(() => onSignOut(), 1000);
    } catch (error) {
      console.error('Sign out error:', error);
      onSignOut(); // Force sign out even if error occurs
    }
  };

  const completedModules = progress.filter(p => p.completed).length;
  const totalProgress = progress.length > 0 ? (completedModules / progress.length) * 100 : 0;

  const characterTypes = {
    citizen: { name: "Constitutional Citizen", icon: "👤", color: "bg-blue-500" },
    scholar: { name: "Legal Scholar", icon: "📚", color: "bg-purple-500" },
    guardian: { name: "Rights Guardian", icon: "🛡️", color: "bg-green-500" },
    advocate: { name: "Justice Advocate", icon: "⚖️", color: "bg-yellow-500" },
  };

  const currentCharacter = characterTypes[profile?.character_type as keyof typeof characterTypes] || characterTypes.citizen;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Constitution Quest</h1>
              <p className="text-sm text-muted-foreground">Constitutional Learning Platform</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold">{profile?.display_name || user?.email}</p>
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${currentCharacter.color}`}></span>
                <span className="text-sm text-muted-foreground">{currentCharacter.name}</span>
              </div>
            </div>
            <Avatar>
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>{profile?.display_name?.[0] || user?.email?.[0]}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="chatbot">AI Tutor</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-2xl">{currentCharacter.icon}</span>
                    <span>Welcome back, {profile?.display_name || "Constitutional Scholar"}!</span>
                  </CardTitle>
                  <CardDescription>
                    Continue your journey to master the Constitution of India
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{profile?.level || 1}</div>
                      <div className="text-sm text-muted-foreground">Current Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-secondary">{profile?.total_points || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{completedModules}</div>
                      <div className="text-sm text-muted-foreground">Modules Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Progress Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Learning Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span>{Math.round(totalProgress)}%</span>
                      </div>
                      <Progress value={totalProgress} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {completedModules} of {progress.length} modules completed
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Recent Achievements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userBadges.slice(0, 3).map((userBadge) => (
                      <div key={userBadge.id} className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{userBadge.badges.name}</span>
                      </div>
                    ))}
                    {userBadges.length === 0 && (
                      <p className="text-sm text-muted-foreground">Complete modules to earn badges!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center space-y-2"
                      onClick={() => setActiveTab("modules")}
                    >
                      <BookOpen className="h-6 w-6" />
                      <span className="text-xs">Learn</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center space-y-2"
                      onClick={() => setActiveTab("quizzes")}
                    >
                      <Target className="h-6 w-6" />
                      <span className="text-xs">Quiz</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center space-y-2"
                      onClick={() => setActiveTab("games")}
                    >
                      <Gamepad2 className="h-6 w-6" />
                      <span className="text-xs">Games</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center space-y-2"
                      onClick={() => setActiveTab("chatbot")}
                    >
                      <MessageSquare className="h-6 w-6" />
                      <span className="text-xs">AI Tutor</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="modules">
            <LearningModules userId={user?.id} onProgressUpdate={fetchUserData} />
          </TabsContent>

          <TabsContent value="quizzes">
            <QuizCenter userId={user?.id} onProgressUpdate={fetchUserData} />
          </TabsContent>

          <TabsContent value="games">
            <GameCenter userId={user?.id} onProgressUpdate={fetchUserData} />
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile 
              user={user} 
              profile={profile} 
              userBadges={userBadges}
              onProfileUpdate={fetchUserData}
            />
          </TabsContent>

          <TabsContent value="chatbot">
            <ConstitutionalChatbot />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}