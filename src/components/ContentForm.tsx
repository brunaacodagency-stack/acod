import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getDayOfWeek } from "@/lib/utils";

interface ContentFormProps {
  onSuccess?: () => void;
  mode: 'theme' | 'content';
}

const ContentForm = ({ onSuccess, mode }: ContentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    content_type: "estatico" as "estatico" | "carrossel" | "reels",
    objective: "",
    feed_theme: "",
    approved_guidelines: "indefinido" as "indefinido" | "aprovado" | "rejeitado" | "pendente",
    capture_responsible: "s_necessidade" as "s_necessidade" | "pela_agencia" | "pelo_cliente",
    content_status: "pendente" as "pendente" | "em_producao" | "aguardando_aprovacao" | "aprovado" | "rejeitado" | "publicado",
    caption: "",
    content_body: "",
    client_id: ""
  });
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const isAgency = userProfile?.role === 'agencia';

  const [clients, setClients] = useState<{ id: string, display_name: string | null, email: string | null }[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      if (!isAgency) return;

      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .neq('role', 'agencia'); // Fetch all non-agency users (clients)

      if (data) {
        // Map the data to use user_id as id for the component
        const formattedData = data.map(client => ({
          id: client.user_id,
          display_name: client.display_name,
          email: client.email
        }));
        setClients(formattedData);
      }
    };

    fetchClients();
  }, [isAgency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    if (isAgency && !formData.client_id) {
      toast({
        title: "Erro no formulário",
        description: "Por favor, selecione um cliente para este conteúdo.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        date: formData.date,
        feed_theme: formData.feed_theme,
        user_id: user.id, // Creator
        client_id: isAgency ? formData.client_id : user.id, // Assigned Client
        day_of_week: getDayOfWeek(formData.date),
        capture_responsible: formData.capture_responsible
      };

      if (mode === 'theme') {
        payload.objective = formData.objective;
        payload.content_type = formData.content_type;
        // Defaults for theme mode
        payload.approved_guidelines = 'pendente';
        payload.content_status = 'pendente';
      } else {
        // Content mode
        payload.content_type = formData.content_type;
        // capture_responsible is already in payload from defaults if we want, or from form data
        payload.caption = formData.caption;
        payload.content_body = formData.content_body;
        payload.content_status = formData.content_status;
        // If creating content directly, we assume the guidelines/theme are implicitly approved or skipped
        payload.approved_guidelines = 'aprovado';
      }

      const { error } = await supabase
        .from('contents')
        .insert([payload]);

      if (error) throw error;

      toast({
        title: mode === 'theme' ? "Tema criado!" : "Conteúdo criado!",
        description: "Item adicionado com sucesso.",
      });

      setFormData({
        date: "",
        content_type: "estatico",
        objective: "",
        feed_theme: "",
        approved_guidelines: "indefinido",
        capture_responsible: "s_necessidade",
        content_status: "pendente",
        caption: "",
        content_body: "",
        client_id: ""
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle>{mode === 'theme' ? 'Novo Tema' : 'Novo Conteúdo'}</CardTitle>
        <CardDescription>
          {mode === 'theme'
            ? 'Adicione um novo tema de pauta para aprovação.'
            : 'Adicione um novo conteúdo finalizado.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAgency && (
              <div className="space-y-2 col-span-full">
                <Label htmlFor="client_id">Cliente</Label>
                <Select value={formData.client_id} onValueChange={(value) => handleInputChange('client_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.display_name || client.email || "Cliente sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feed_theme">Tema Feed</Label>
              <Input
                id="feed_theme"
                placeholder="Tema do feed"
                value={formData.feed_theme}
                onChange={(e) => handleInputChange('feed_theme', e.target.value)}
                required
              />
            </div>

            {mode === 'theme' && (
              <>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="objective">Objetivo</Label>
                  <Select value={formData.objective} onValueChange={(value) => handleInputChange('objective', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversao">Conversão</SelectItem>
                      <SelectItem value="awareness">Awareness</SelectItem>
                      <SelectItem value="engajamento">Engajamento</SelectItem>
                      <SelectItem value="consideracao">Consideração</SelectItem>
                      <SelectItem value="retencao">Retenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content_type">Tipo de Conteúdo</Label>
                  <Select value={formData.content_type} onValueChange={(value) => handleInputChange('content_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estatico">Estático</SelectItem>
                      <SelectItem value="carrossel">Carrossel</SelectItem>
                      <SelectItem value="reels">Reels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capture_responsible">Captação do Conteúdo</Label>
                  <Select value={formData.capture_responsible} onValueChange={(value: any) => handleInputChange('capture_responsible', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de captação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s_necessidade">S/ Necessidade</SelectItem>
                      <SelectItem value="pela_agencia">Pela Acod</SelectItem>
                      <SelectItem value="pelo_cliente">Pelo Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {mode === 'content' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="content_type">Tipo de Conteúdo</Label>
                  <Select value={formData.content_type} onValueChange={(value) => handleInputChange('content_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estatico">Estático</SelectItem>
                      <SelectItem value="carrossel">Carrossel</SelectItem>
                      <SelectItem value="reels">Reels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isAgency && (
                  <div className="space-y-2">
                    <Label htmlFor="content_status">Status do Conteúdo</Label>
                    <Select value={formData.content_status} onValueChange={(value) => handleInputChange('content_status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_producao">Em Produção</SelectItem>
                        <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        <SelectItem value="publicado">Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>

          {mode === 'content' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="content_body">Texto do Conteúdo / Arte</Label>
                <Textarea
                  id="content_body"
                  placeholder="Texto que vai na imagem/arte..."
                  value={formData.content_body}
                  onChange={(e) => handleInputChange('content_body', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Legenda</Label>
                <Textarea
                  id="caption"
                  placeholder="Texto da legenda do post..."
                  value={formData.caption}
                  onChange={(e) => handleInputChange('caption', e.target.value)}
                  rows={5}
                />
              </div>
            </>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : (mode === 'theme' ? "Criar Tema" : "Criar Conteúdo")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};



export default ContentForm;