import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Pencil, Trash2 } from "lucide-react";

interface Content {
  id: string;
  date: string;
  day_of_week: string;
  content_type: string;
  objective: string;
  feed_theme: string;
  observations: string;
  approved_guidelines: string;
  content_capture: string;
  content_status: string;
  created_at: string;
  caption: string | null;
  content_body: string | null;
}

interface ContentTableProps {
  refreshTrigger?: number;
  viewMode?: 'themes' | 'contents';
}

const ContentTable = ({ refreshTrigger, viewMode = 'themes' }: ContentTableProps) => {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [clients, setClients] = useState<Array<{ id: string; email: string; display_name: string }>>([]);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [rejectDialog, setRejectDialog] = useState<{ isOpen: boolean; id: string | null; reason: string; field: 'content_status' | 'approved_guidelines' }>({ isOpen: false, id: null, reason: '', field: 'content_status' });

  // Check if user has agency access
  const isAgency = userProfile?.role === 'agencia';

  // Fetch clients list for agency users
  useEffect(() => {
    // ... (same as before) ...
    const fetchClients = async () => {
      if (!isAgency) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, email, display_name')
          .eq('role', 'cliente')
          .order('email');
        if (error) throw error;
        setClients(data?.map(profile => ({
          id: profile.user_id,
          email: profile.email || 'Sem email',
          display_name: profile.display_name || profile.email || 'Sem nome'
        })) || []);
      } catch (error: any) {
        console.error('Error fetching clients:', error);
      }
    };
    fetchClients();
  }, [isAgency]);

  const fetchContents = async () => {
    // ... (same as before) ...
    if (!user) return;
    try {
      let query = supabase
        .from('contents')
        .select('*')
        .order('date', { ascending: false });
      if (!isAgency) {
        query = query.eq('client_id', user.id);
      } else if (selectedClient !== 'all') {
        query = query.eq('client_id', selectedClient);
      }
      const { data, error } = await query;
      if (error) throw error;
      setContents(data || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar conteúdos", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [user, refreshTrigger, selectedClient]);

  const handleStatusUpdate = async (id: string, field: string, value: string) => {
    // ... (same as before) ...
    try {
      const { error } = await supabase
        .from('contents')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;
      setContents(prev => prev.map(content =>
        content.id === id ? { ...content, [field]: value } : content
      ));
      toast({ title: "Status atualizado!", description: "O conteúdo foi atualizado com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
    setEditingId(null);
    setEditingField(null);
  };

  const handleDelete = async (id: string) => {
    // ... (same as before) ...
    if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return;
    try {
      const { error } = await supabase.from('contents').delete().eq('id', id);
      if (error) throw error;
      setContents(prev => prev.filter(content => content.id !== id));
      toast({ title: "Conteúdo excluído!", description: "O conteúdo foi removido com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    // ... (same as before) ...
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pendente: "outline",
      em_producao: "secondary",
      aguardando_aprovacao: "default",
      aprovado: "default",
      rejeitado: "destructive",
      publicado: "default"
    };
    return <Badge variant={variants[status] || "outline"}>{status.replace('_', ' ')}</Badge>;
  };

  const getApprovalBadge = (status: string) => {
    // ... (same as before) ...
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      indefinido: "outline",
      aprovado: "default",
      rejeitado: "destructive",
      pendente: "secondary"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const filteredContents = contents.filter(content => {
    // ... (same as before) ...
    const matchesMonth = selectedMonth === "all" || (new Date(content.date).getMonth() + 1).toString() === selectedMonth;
    if (viewMode === 'themes') {
      return matchesMonth && content.approved_guidelines !== 'indefinido' && content.approved_guidelines !== null;
    } else {
      return matchesMonth && (content.approved_guidelines === 'indefinido' || content.approved_guidelines === null);
    }
  });

  const months = [
    { value: "all", label: "Todos os meses" },
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" }
  ];

  if (loading) {
    return <div className="text-center py-4">Carregando conteúdos...</div>;
  }

  // Helper to update caption - not used in this snippet but kept for consistency
  const handleCaptionUpdate = async (id: string, newCaption: string) => {
    // ... (same as before) ...
    try {
      const { error } = await supabase.from('contents').update({ caption: newCaption }).eq('id', id);
      if (error) throw error;
      setContents(prev => prev.map(c => c.id === id ? { ...c, caption: newCaption } : c));
      toast({ title: "Legenda salva", description: "A legenda foi atualizada." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const confirmReject = async () => {
    if (!rejectDialog.id) return;

    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('contents')
        .select('observations')
        .eq('id', rejectDialog.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const newObservations = currentData?.observations
        ? `${currentData.observations}\n\n[Rejeição - ${new Date().toLocaleDateString()}]: ${rejectDialog.reason}`
        : `[Rejeição - ${new Date().toLocaleDateString()}]: ${rejectDialog.reason}`;

      const { error } = await supabase
        .from('contents')
        .update({
          [rejectDialog.field]: 'rejeitado', // Dynamic field update
          observations: newObservations
        })
        .eq('id', rejectDialog.id);

      if (error) throw error;

      setContents(prev => prev.map(content =>
        content.id === rejectDialog.id
          ? { ...content, [rejectDialog.field]: 'rejeitado', observations: newObservations }
          : content
      ));

      toast({
        title: "Conteúdo rejeitado",
        description: "Status atualizado e observação adicionada.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao rejeitar",
        description: error.message,
        variant: "destructive",
      });
    }
    setRejectDialog({ isOpen: false, id: null, reason: '', field: 'content_status' });
  };

  // Reusable Dialog Component
  const RejectDialogComponent = () => (
    <Dialog open={rejectDialog.isOpen} onOpenChange={(open) => setRejectDialog(prev => ({ ...prev, isOpen: open }))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Motivo da Rejeição</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Descreva o motivo da rejeição ou correções necessárias..."
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRejectDialog({ isOpen: false, id: null, reason: '', field: 'content_status' })}>Cancelar</Button>
          <Button variant="destructive" onClick={confirmReject}>Confirmar Rejeição</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (viewMode === 'contents') {
    return (
      <div className="space-y-6">
        {/* ... (Header same as before) ... */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Aprovação de Conteúdo</h2>
          <div className="flex gap-2">
            {isAgency && (
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContents.map((content) => (
              <Card key={content.id} className="flex flex-col">
                <CardContent className="p-4 space-y-4 flex-1">
                  {/* ... (Card content details same as before) ... */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground block">
                        Status: {getStatusBadge(content.content_status || 'pendente')}
                      </span>
                    </div>
                    <Badge variant="outline">{new Date(content.date).toLocaleDateString()}</Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Tipo de Conteúdo: </span>
                      <span className="capitalize">{content.content_type || 'Não definido'}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Tema: </span>
                      {content.feed_theme || 'Sem tema'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Previsão: {new Date(content.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Texto da Arte</Label>
                    <div className="w-full min-h-[120px] bg-white dark:bg-zinc-900 rounded-md border p-3">
                      {content.content_body ? (
                        <p className="text-sm whitespace-pre-wrap">{content.content_body}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Nenhum texto definido.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Legenda</Label>
                    <div className="w-full min-h-[100px] bg-white dark:bg-zinc-900 rounded-md border p-3">
                      {content.caption ? (
                        <p className="text-sm whitespace-pre-wrap">{content.caption}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Nenhuma legenda definida.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <div className="flex-1 flex gap-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleStatusUpdate(content.id, 'content_status', 'aprovado')}
                      >
                        Aprovar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => setRejectDialog({ isOpen: true, id: content.id, reason: '', field: 'content_status' })}
                      >
                        Rejeitar
                      </Button>
                    </div>

                    {isAgency && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive shrink-0"
                        onClick={() => handleDelete(content.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <RejectDialogComponent />
        </>
        {filteredContents.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum conteúdo encontrado para este período.
          </div>
        )}
      </div>
    );
  }

  // THEMES TABLE VIEW
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aprovação de Temas</CardTitle>
        <CardDescription>Gerencie e aprove os temas propostos</CardDescription>
      </CardHeader>
      <CardContent>
        {/* ... (Filter section same as before) ... */}
        <div className="mb-4 flex gap-2">
          {isAgency && (
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Dia</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContents.map((content) => (
                <TableRow key={content.id}>

                  <TableCell>{new Date(content.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="capitalize">{content.day_of_week}</TableCell>

                  <TableCell className="max-w-32 truncate capitalize">{content.objective}</TableCell>
                  <TableCell className="max-w-32 truncate">{content.feed_theme}</TableCell>
                  <TableCell className="capitalize">{content.content_type}</TableCell>
                  <TableCell>
                    {getApprovalBadge(content.approved_guidelines)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={content.approved_guidelines === 'aprovado' ? 'default' : 'outline'}
                          className="h-7 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleStatusUpdate(content.id, 'approved_guidelines', 'aprovado')}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7"
                          onClick={() => setRejectDialog({ isOpen: true, id: content.id, reason: '', field: 'approved_guidelines' })}
                        >
                          Reprovar
                        </Button>
                      </div>
                      {isAgency && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(content.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredContents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum conteúdo encontrado. Adicione o primeiro conteúdo!
            </div>
          )}
        </div>
        <RejectDialogComponent />
      </CardContent>
    </Card>
  );
};

export default ContentTable;