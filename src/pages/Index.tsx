import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "affiliate") return <Navigate to="/afiliado" replace />;

  // User has no role yet — show a waiting message
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Conta criada com sucesso!</h1>
        <p className="text-muted-foreground">Aguarde o administrador ativar seu acesso como afiliado.</p>
      </div>
    </div>
  );
}
