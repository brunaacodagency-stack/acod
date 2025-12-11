import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Trash2, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
    id: string;
    user_id: string;
    email: string | null;
    display_name: string | null;
    role: string | null;
}

export function UserManagement() {
    const [isOpen, setIsOpen] = useState(false);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    // New User State
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserName, setNewUserName] = useState("");
    const [newUserRole, setNewUserRole] = useState("cliente");
    const [creatingUser, setCreatingUser] = useState(false);

    const { toast } = useToast();

    const handleCreateUser = async () => {
        if (!newUserEmail) {
            toast({
                title: "Email obrigatório",
                description: "Por favor, insira um email.",
                variant: "destructive",
            });
            return;
        }

        setCreatingUser(true);
        try {
            const { data, error } = await supabase.functions.invoke('invite-user', {
                body: {
                    email: newUserEmail,
                    role: newUserRole,
                    display_name: newUserName,
                }
            });

            if (error) throw error;

            toast({
                title: "Convite enviado!",
                description: `Um convite foi enviado para ${newUserEmail}.`,
            });

            // Clear form
            setNewUserEmail("");
            setNewUserName("");
            setNewUserRole("cliente");

            // Refresh list (might not show immediately if filter doesn't include invited, but handy)
            fetchProfiles();
            setIsOpen(false);

        } catch (error: any) {
            console.error("Error inviting user:", error);
            toast({
                title: "Erro ao convidar usuário",
                description: error.message || "Não foi possível enviar o convite.",
                variant: "destructive",
            });
        } finally {
            setCreatingUser(false);
        }
    };

    const startEditing = (profile: Profile) => {
        setEditingId(profile.id);
        setEditName(profile.display_name || "");
    };

    const handleUpdateName = async (userId: string) => {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ display_name: editName })
                .eq("id", userId);

            if (error) throw error;

            setProfiles((prev) =>
                prev.map((profile) =>
                    profile.id === userId ? { ...profile, display_name: editName } : profile
                )
            );

            setEditingId(null);
            toast({
                title: "Nome atualizado",
                description: "O nome do usuário foi atualizado com sucesso.",
            });
        } catch (error) {
            console.error("Error updating name:", error);
            toast({
                title: "Erro ao atualizar nome",
                description: "Não foi possível atualizar o nome do usuário.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteUser = async (authUserId: string, profileId: string) => {
        try {
            // Call Edge Function to delete user from Auth (which is the source of truth)
            // We must pass the AUTH USER ID, not the profile ID
            const { error } = await supabase.functions.invoke('delete-user', {
                body: { user_id: authUserId }
            });

            if (error) throw error;

            // Optimistically update UI
            setProfiles((prev) => prev.filter((p) => p.id !== profileId));

            toast({
                title: "Usuário removido",
                description: "O usuário foi excluído do sistema permanentemente.",
            });
        } catch (error: any) {
            console.error("Error deleting user:", error);

            // Fallback: Try to delete from profiles table directly if function fails or isn't deployed yet?
            // But if the issue is that they return, it's because they still exist in Auth.
            // So we must insist on the function working or show error.

            toast({
                title: "Erro ao remover usuário",
                description: error.message || "Não foi possível remover o usuário.",
                variant: "destructive",
            });
        }
    };

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, user_id, email, display_name, role");

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error("Error fetching profiles:", error);
            toast({
                title: "Erro ao carregar usuários",
                description: "Não foi possível carregar a lista de usuários.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchProfiles();
        }
    }, [isOpen]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ role: newRole })
                .eq("id", userId);

            if (error) throw error;

            setProfiles((prev) =>
                prev.map((profile) =>
                    profile.id === userId ? { ...profile, role: newRole } : profile
                )
            );

            toast({
                title: "Função atualizada",
                description: "A função do usuário foi atualizada com sucesso.",
            });
        } catch (error) {
            console.error("Error updating role:", error);
            toast({
                title: "Erro ao atualizar função",
                description: "Não foi possível atualizar a função do usuário.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="mr-2">
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar Usuários
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Gerenciamento de Usuários</DialogTitle>
                </DialogHeader>

                <div className="flex justify-between items-center mt-4 mb-4">
                    <h3 className="text-lg font-medium">Lista de Usuários</h3>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Users className="mr-2 h-4 w-4" />
                                Novo Usuário
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome</Label>
                                    <Input
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        placeholder="Nome do usuário"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        placeholder="email@exemplo.com"
                                        type="email"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Função</Label>
                                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cliente">Cliente</SelectItem>
                                            <SelectItem value="agencia">Admin (Agência)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleCreateUser} className="w-full" disabled={creatingUser}>
                                    {creatingUser ? "Criando..." : "Criar Usuário"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="mt-4">
                    {loading ? (
                        <div className="flex justify-center p-4">Carregando...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {profiles.map((profile) => (
                                    <TableRow key={profile.id}>
                                        <TableCell>{profile.email || "Sem email"}</TableCell>
                                        <TableCell>
                                            {editingId === profile.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-8 w-[200px]"
                                                    />
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleUpdateName(profile.id)}
                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => setEditingId(null)}
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span>{profile.display_name || "-"}</span>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => startEditing(profile)}
                                                        className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={profile.role || "cliente"}
                                                onValueChange={(value) => handleRoleChange(profile.id, value)}
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Selecione a função" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="agencia">Admin (Agência)</SelectItem>
                                                    <SelectItem value="cliente">Cliente</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
                                                        handleDeleteUser(profile.user_id, profile.id);
                                                    }
                                                }}
                                                className="h-8"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default UserManagement;
