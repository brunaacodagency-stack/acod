import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import ContentForm from "@/components/ContentForm";
import ContentTable from "@/components/ContentTable";
import UserManagement from "@/components/UserManagement";
import { LogOut, Plus, List } from "lucide-react";

const Index = () => {
  const { user, userProfile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleContentCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsThemeDialogOpen(false);
    setIsContentDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAgency = userProfile?.role === 'agencia';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Sistema de Aprovação Acod</h1>
              <p className="text-muted-foreground">
                {isAgency ? 'Acesso completo da agência' : 'Acesso de cliente para aprovações'}
              </p>
            </div>
            <div className="flex gap-2">
              <UserManagement />
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="themes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
            <TabsTrigger value="themes" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Temas
            </TabsTrigger>
            <TabsTrigger value="contents" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Conteúdos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="themes" className="mt-0">
            <div className="flex justify-end mb-4">
              {isAgency && (
                <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Novo Tema
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <ContentForm onSuccess={handleContentCreated} mode="theme" />
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <ContentTable refreshTrigger={refreshTrigger} viewMode="themes" />
          </TabsContent>

          <TabsContent value="contents" className="mt-0">
            <div className="flex justify-end mb-4">
              {isAgency && (
                <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Novo Conteúdo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <ContentForm onSuccess={handleContentCreated} mode="content" />
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <ContentTable refreshTrigger={refreshTrigger} viewMode="contents" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
