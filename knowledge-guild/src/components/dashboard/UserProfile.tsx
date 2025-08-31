import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Award, Settings, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfileProps {
  user: any;
  profile: any;
  userBadges: any[];
  onProfileUpdate: () => void;
}

export function UserProfile({ user, profile, userBadges, onProfileUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
      
      setIsEditing(false);
      onProfileUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const characterTypes = {
    citizen: { name: "Constitutional Citizen", icon: "👤", color: "bg-blue-500" },
    scholar: { name: "Legal Scholar", icon: "📚", color: "bg-purple-500" },
    guardian: { name: "Rights Guardian", icon: "🛡️", color: "bg-green-500" },
    advocate: { name: "Justice Advocate", icon: "⚖️", color: "bg-yellow-500" },
  };

  const currentCharacter = characterTypes[profile?.character_type as keyof typeof characterTypes] || characterTypes.citizen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold">User Profile</h2>
        <p className="text-muted-foreground">Manage your account and view achievements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile?.display_name?.[0] || user?.email?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-4 h-4 rounded-full ${currentCharacter.color}`}></span>
                  <span className="font-medium">{currentCharacter.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateProfile} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Display Name</Label>
                  <p className="text-lg">{profile?.display_name || "Not set"}</p>
                </div>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{profile?.level || 1}</div>
                <div className="text-sm text-muted-foreground">Level</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-secondary">{profile?.total_points || 0}</div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements
            </CardTitle>
            <CardDescription>Badges you've earned on your constitutional journey</CardDescription>
          </CardHeader>
          <CardContent>
            {userBadges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userBadges.map((userBadge) => (
                  <div key={userBadge.id} className="p-4 border rounded-lg text-center">
                    <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <h3 className="font-semibold">{userBadge.badges.name}</h3>
                    <p className="text-sm text-muted-foreground">{userBadge.badges.description}</p>
                    <Badge className="mt-2" variant="secondary">
                      {new Date(userBadge.earned_at).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Badges Yet</h3>
                <p className="text-muted-foreground">Complete learning modules and quizzes to earn your first badge!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}