import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Target, Award, CheckCircle, X, Brain, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizCenterProps {
  userId?: string;
  onProgressUpdate: () => void;
}

export function QuizCenter({ userId, onProgressUpdate }: QuizCenterProps) {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  // Sample quiz data
  const sampleQuestions = [
    {
      question: "Which article of the Indian Constitution deals with the Right to Equality?",
      options: ["Article 14", "Article 19", "Article 21", "Article 25"],
      correct: 0
    },
    {
      question: "Who is known as the 'Father of the Indian Constitution'?",
      options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Dr. B.R. Ambedkar", "Sardar Patel"],
      correct: 2
    },
    {
      question: "How many fundamental rights are guaranteed by the Indian Constitution?",
      options: ["5", "6", "7", "8"],
      correct: 1
    },
    {
      question: "Which part of the Constitution deals with Fundamental Rights?",
      options: ["Part II", "Part III", "Part IV", "Part V"],
      correct: 1
    },
    {
      question: "When was the Indian Constitution adopted?",
      options: ["26th January 1950", "15th August 1947", "26th November 1949", "2nd October 1950"],
      correct: 2
    }
  ];

  const startQuiz = (quiz: any) => {
    const questionsToUse = quiz.questions && quiz.questions.length > 0 
      ? quiz.questions 
      : sampleQuestions;
      
    setCurrentQuiz({
      ...quiz,
      questions: questionsToUse
    });
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedAnswer("");
    setShowResults(false);
    setScore(0);
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const nextQuestion = () => {
    if (!currentQuiz) return;
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);
    
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer("");
    } else {
      // Quiz completed, calculate score
      calculateScore(newAnswers);
    }
  };

  const calculateScore = async (answers: string[]) => {
    if (!currentQuiz || !userId) return;
    
    setIsLoading(true);
    try {
      let correctAnswers = 0;
      
      currentQuiz.questions.forEach((question: any, index: number) => {
        if (parseInt(answers[index]) === question.correct) {
          correctAnswers++;
        }
      });
      
      const finalScore = Math.round((correctAnswers / currentQuiz.questions.length) * 100);
      setScore(finalScore);
      
      // Save quiz attempt
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: userId,
          quiz_id: currentQuiz.id,
          score: finalScore,
          answers: answers
        });

      if (error) throw error;

      // Award points based on score
      const pointsEarned = Math.round((finalScore / 100) * (currentQuiz.points_reward || 5));
      
      if (pointsEarned > 0) {
        // Get current points first
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('user_id', userId)
          .single();

        const newPoints = (currentProfile?.total_points || 0) + pointsEarned;
        
        await supabase
          .from('profiles')
          .update({ total_points: newPoints })
          .eq('user_id', userId);
      }

      setShowResults(true);
      onProgressUpdate();
      
      toast({
        title: `Quiz Completed!`,
        description: `You scored ${finalScore}% and earned ${pointsEarned} points!`,
      });
    } catch (error) {
      console.error('Error saving quiz result:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedAnswer("");
    setShowResults(false);
    setScore(0);
  };

  if (currentQuiz && showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              {score >= 80 ? (
                <Trophy className="h-16 w-16 text-yellow-500" />
              ) : score >= 60 ? (
                <Award className="h-16 w-16 text-blue-500" />
              ) : (
                <Target className="h-16 w-16 text-gray-500" />
              )}
            </div>
            <CardTitle className="text-3xl">Quiz Completed!</CardTitle>
            <CardDescription>
              {score >= 80 ? "Excellent work! You're a constitutional expert!" :
               score >= 60 ? "Good job! Keep studying to improve your score." :
               "Keep practicing! Review the material and try again."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-6xl font-bold text-primary">{score}%</div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Question Review:</h3>
              {currentQuiz.questions.map((question: any, index: number) => {
                const userAnswerIndex = parseInt(userAnswers[index]);
                const isCorrect = userAnswerIndex === question.correct;
                
                return (
                  <div key={index} className="text-left p-4 rounded-lg bg-muted/50">
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{question.question}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your answer: {question.options[userAnswerIndex]}
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-green-600 mt-1">
                            Correct answer: {question.options[question.correct]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button onClick={resetQuiz}>Back to Quizzes</Button>
              <Button variant="outline" onClick={() => startQuiz(currentQuiz)}>
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (currentQuiz) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{currentQuiz.title}</CardTitle>
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
              </Badge>
            </div>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">{currentQuestion.question}</h3>
              
              <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
                {currentQuestion.options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={resetQuiz}>
                Exit Quiz
              </Button>
              <Button 
                onClick={nextQuestion}
                disabled={!selectedAnswer || isLoading}
              >
                {isLoading ? "Submitting..." : currentQuestionIndex === currentQuiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
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
          <h2 className="text-3xl font-bold">Quiz Center</h2>
          <p className="text-muted-foreground">Test your knowledge of the Constitution</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sample Quizzes */}
        {[
          {
            id: "constitutional-basics",
            title: "Constitutional Basics",
            description: "Test your knowledge of fundamental constitutional concepts",
            points_reward: 10,
            questions: sampleQuestions
          },
          {
            id: "fundamental-rights",
            title: "Fundamental Rights",
            description: "Quiz on fundamental rights guaranteed by the Constitution",
            points_reward: 15,
            questions: sampleQuestions
          },
          {
            id: "government-structure",
            title: "Government Structure",
            description: "Understanding the structure of Indian government",
            points_reward: 12,
            questions: sampleQuestions
          }
        ].map((quiz, index) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      {quiz.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {quiz.description}
                    </CardDescription>
                  </div>
                  <Badge>
                    <Award className="h-3 w-3 mr-1" />
                    {quiz.points_reward}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>{quiz.questions.length} questions</span>
                </div>
                
                <Button
                  className="w-full"
                  onClick={() => startQuiz(quiz)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Database Quizzes */}
        {quizzes.map((quiz, index) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index + 3) * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      {quiz.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {quiz.description}
                    </CardDescription>
                  </div>
                  <Badge>
                    <Award className="h-3 w-3 mr-1" />
                    {quiz.points_reward}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>{quiz.questions?.length || 0} questions</span>
                </div>
                
                <Button
                  className="w-full"
                  onClick={() => startQuiz(quiz)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {quizzes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sample Quizzes Available</h3>
            <p className="text-muted-foreground">Start with the sample quizzes above to test your constitutional knowledge!</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}