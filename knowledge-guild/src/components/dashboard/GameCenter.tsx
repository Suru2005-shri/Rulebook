import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Trophy, Play, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GameCenterProps {
  userId?: string;
  onProgressUpdate: () => void;
}

export function GameCenter({ userId, onProgressUpdate }: GameCenterProps) {
  const [games, setGames] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const sampleGames = [
    {
      id: "trivia",
      name: "Constitutional Trivia",
      description: "Test your constitutional knowledge",
      game_type: "trivia",
      points_reward: 5
    },
    {
      id: "matching",
      name: "Rights & Duties Match",
      description: "Match rights with corresponding duties",
      game_type: "matching",
      points_reward: 4
    },
    {
      id: "timeline",
      name: "Constitution Timeline",
      description: "Arrange constitutional events chronologically",
      game_type: "timeline",
      points_reward: 6
    }
  ];

  const playGame = (game: any) => {
    toast({
      title: "Game Coming Soon!",
      description: `${game.name} will be available in the next update.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold">Game Center</h2>
        <p className="text-muted-foreground">Learn while having fun with interactive games</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleGames.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5" />
                      {game.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {game.description}
                    </CardDescription>
                  </div>
                  <Badge>
                    <Trophy className="h-3 w-3 mr-1" />
                    {game.points_reward}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => playGame(game)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play Game
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}