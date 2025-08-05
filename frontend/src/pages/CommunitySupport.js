import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import {
  MessageSquare,
  Users,
  ExternalLink,
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Award,
  TrendingUp,
  Calendar,
  Hash,
  Search
} from 'lucide-react';

const CommunitySupport = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState([]);
  const [communityStats, setCommunityStats] = useState(null);
  const [discordInfo, setDiscordInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', tags: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      // Fetch community stats
      const statsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/community/stats`, {
        credentials: 'include'
      });
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setCommunityStats(stats);
      }

      // Fetch questions
      const questionsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/community/questions?limit=20`, {
        credentials: 'include'
      });
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions || []);
      }

      // Fetch Discord info
      const discordResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/community/discord`, {
        credentials: 'include'
      });
      if (discordResponse.ok) {
        const discord = await discordResponse.json();
        setDiscordInfo(discord);
      }

    } catch (error) {
      console.error('Error fetching community data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la communauté",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour poser une question",
        variant: "destructive"
      });
      return;
    }

    if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir le titre et le contenu de votre question",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/community/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newQuestion.title.trim(),
          content: newQuestion.content.trim(),
          tags: newQuestion.tags.filter(tag => tag.trim()).map(tag => tag.trim().toLowerCase())
        })
      });

      if (response.ok) {
        const createdQuestion = await response.json();
        setQuestions([createdQuestion, ...questions]);
        setNewQuestion({ title: '', content: '', tags: [] });
        
        toast({
          title: "Question publiée !",
          description: "Votre question a été ajoutée à la communauté"
        });
      } else {
        throw new Error('Failed to create question');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: "Erreur",
        description: "Impossible de publier votre question",
        variant: "destructive"
      });
    }
  };

  const handleVoteQuestion = async (questionId, voteType) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour voter",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/community/questions/${questionId}/vote?vote_type=${voteType}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const voteResult = await response.json();
        
        // Update question in local state
        setQuestions(questions.map(q => 
          q.id === questionId 
            ? { ...q, upvotes: voteResult.upvotes, downvotes: voteResult.downvotes }
            : q
        ));

        toast({
          title: "Vote enregistré",
          description: `Votre ${voteType === 'up' ? 'vote positif' : 'vote négatif'} a été pris en compte`
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre vote",
        variant: "destructive"
      });
    }
  };

  const getPopularTags = () => {
    const tagCounts = {};
    questions.forEach(q => {
      q.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = !searchTerm || 
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !selectedTag || question.tags?.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <MessageSquare className="w-8 h-8 animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement de la communauté...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
            <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold">Support Communautaire</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Posez vos questions, échangez avec d'autres joueurs et progressez ensemble grâce à notre espace communautaire.
        </p>
      </div>

      {/* Community Stats */}
      {communityStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{communityStats.total_questions}</div>
              <div className="text-sm text-muted-foreground">Questions posées</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{communityStats.total_answers}</div>
              <div className="text-sm text-muted-foreground">Réponses partagées</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{communityStats.active_users}</div>
              <div className="text-sm text-muted-foreground">Membres actifs</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="questions">Questions & Réponses</TabsTrigger>
          <TabsTrigger value="discord">Discord Community</TabsTrigger>
          <TabsTrigger value="guidelines">Guide de la Communauté</TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-6">
          
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Poser une Question
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nouvelle Question</DialogTitle>
                  <DialogDescription>
                    Posez votre question à la communauté Poker Pro
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateQuestion} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre de votre question</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Comment jouer AA en position tardive?"
                      value={newQuestion.title}
                      onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Description détaillée</Label>
                    <Textarea
                      id="content"
                      placeholder="Décrivez votre situation, les cartes, la position, les actions précédentes..."
                      value={newQuestion.content}
                      onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                      rows={6}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tags">Tags (optionnel)</Label>
                    <Input
                      id="tags"
                      placeholder="Ex: tournoi, cash-game, preflop (séparés par des virgules)"
                      value={newQuestion.tags.join(', ')}
                      onChange={(e) => setNewQuestion({
                        ...newQuestion, 
                        tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      })}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Publier ma Question
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Popular Tags */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTag('')}
            >
              Tous
            </Button>
            {getPopularTags().map(({ tag, count }) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className="gap-1"
              >
                <Hash className="h-3 w-3" />
                {tag}
                <Badge variant="secondary" className="ml-1 h-4 text-xs">
                  {count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucune question trouvée</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || selectedTag 
                      ? 'Essayez de modifier vos critères de recherche'
                      : 'Soyez le premier à poser une question à la communauté!'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredQuestions.map((question) => (
                <Card key={question.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      
                      {/* Voting */}
                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVoteQuestion(question.id, 'up')}
                          className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold">
                          {question.upvotes - question.downvotes}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVoteQuestion(question.id, 'down')}
                          className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Question Content */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2 hover:text-emerald-600 cursor-pointer">
                          {question.title}
                        </h3>
                        
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {question.content}
                        </p>
                        
                        {/* Tags */}
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {question.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* Metadata */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>Par {question.user_name}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(question.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{question.answer_count || 0} réponse(s)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Discord Tab */}
        <TabsContent value="discord" className="space-y-6">
          {discordInfo && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Discord Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-indigo-600" />
                    {discordInfo.title}
                  </CardTitle>
                  <CardDescription>
                    {discordInfo.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <span className="font-semibold">Membres actifs</span>
                      <Badge className="bg-indigo-600">{discordInfo.member_count}</Badge>
                    </div>
                    
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => window.open(discordInfo.discord_link, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Rejoindre le Discord
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Channels List */}
              <Card>
                <CardHeader>
                  <CardTitle>Canaux disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {discordInfo.channels.map((channel, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">{channel.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {channel.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Guidelines Tab */}
        <TabsContent value="guidelines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Guide de la Communauté</CardTitle>
              <CardDescription>
                Règles et bonnes pratiques pour une communauté bienveillante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    Bonnes Pratiques
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Soyez respectueux envers tous les membres</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Partagez uniquement du contenu lié au poker</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Utilisez des titres clairs et descriptifs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Aidez les nouveaux membres à s'intégrer</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Conseils pour de Bonnes Questions
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Décrivez précisément la situation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Mentionnez les cartes, positions, et actions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Ajoutez des tags pertinents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Recherchez d'abord si la question existe</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Contact */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-3">Besoin d'aide ?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Si vous avez des questions sur l'utilisation de la plateforme ou rencontrez des problèmes techniques, notre équipe est là pour vous aider.
                </p>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contacter le Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunitySupport;