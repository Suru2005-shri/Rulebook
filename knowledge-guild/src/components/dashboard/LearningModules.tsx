import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, CheckCircle, Clock, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LearningModulesProps {
  userId?: string;
  onProgressUpdate: () => void;
}

export function LearningModules({ userId, onProgressUpdate }: LearningModulesProps) {
  const [modules, setModules] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchModules();
      fetchUserProgress();
    }
  }, [userId]);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchUserProgress = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setUserProgress(data || []);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const getModuleProgress = (moduleId: string) => {
    return userProgress.find(p => p.module_id === moduleId);
  };

  const startModule = async (module: any) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const existingProgress = getModuleProgress(module.id);
      
      if (!existingProgress) {
        // Create new progress entry
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: userId,
            module_id: module.id,
            progress_percentage: 10
          });

        if (error) throw error;
      }

      setSelectedModule(module);
      await fetchUserProgress();
      
      toast({
        title: "Module Started",
        description: `You've started learning: ${module.title}`,
      });
    } catch (error) {
      console.error('Error starting module:', error);
      toast({
        title: "Error",
        description: "Failed to start module",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeModule = async (moduleId: string) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          completed: true,
          progress_percentage: 100,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Award points
      const module = modules.find(m => m.id === moduleId);
      if (module) {
        // Get current points first
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('user_id', userId)
          .single();

        const newPoints = (currentProfile?.total_points || 0) + (module?.points_reward || 0);
        
        await supabase
          .from('profiles')
          .update({ total_points: newPoints })
          .eq('user_id', userId);
      }

      await fetchUserProgress();
      onProgressUpdate();
      setSelectedModule(null);
      
      toast({
        title: "Module Completed!",
        description: `You earned ${module?.points_reward || 0} points!`,
      });
    } catch (error) {
      console.error('Error completing module:', error);
      toast({
        title: "Error",
        description: "Failed to complete module",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedModule) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedModule.title}</CardTitle>
                <CardDescription>{selectedModule.description}</CardDescription>
              </div>
              <Badge variant="secondary">
                <Award className="h-4 w-4 mr-1" />
                {selectedModule.points_reward} pts
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose max-w-none">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3>Learning Content</h3>
                <p>{selectedModule.content}</p>
                
                <div className="mt-6 space-y-4">
                  <h4>Key Points to Remember:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>The Constitution of India is the supreme law of the land</li>
                    <li>It guarantees fundamental rights to all citizens</li>
                    <li>It establishes the structure of government</li>
                    <li>It defines the relationship between the state and citizens</li>
                  </ul>
                </div>
                
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <h4 className="text-primary font-semibold">Did you know?</h4>
                  <p>The Indian Constitution is the longest written constitution in the world, containing 395 articles and 12 schedules.</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setSelectedModule(null)}
              >
                Back to Modules
              </Button>
              <Button
                onClick={() => completeModule(selectedModule.id)}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isLoading ? "Completing..." : "Complete Module"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Learning Modules</h2>
          <p className="text-muted-foreground">Master the Constitution of India step by step</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => {
          const progress = getModuleProgress(module.id);
          const isCompleted = progress?.completed;
          const progressPercentage = progress?.progress_percentage || 0;

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full transition-all hover:shadow-lg ${isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {module.title}
                        {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {module.description}
                      </CardDescription>
                    </div>
                    <Badge variant={isCompleted ? "default" : "secondary"}>
                      <Award className="h-3 w-3 mr-1" />
                      {module.points_reward}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {progress && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{progressPercentage}%</span>
                      </div>
                      <Progress value={progressPercentage} />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>~15 minutes</span>
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={() => startModule(module)}
                    disabled={isLoading}
                    variant={isCompleted ? "outline" : "default"}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Review
                      </>
                    ) : progress ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Continue
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Learning
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {modules.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Modules Available</h3>
            <p className="text-muted-foreground">Learning modules will appear here once they're added.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}