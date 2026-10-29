import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, User } from 'lucide-react';
import SEO from '@/components/SEO';
import { useAuth } from '@/hooks/useAuth';
const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    signIn,
    user
  } = useAuth();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await signIn(email, password);
      if (error) {
        throw error;
      }
      const toastResult = toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o painel administrativo..."
      });

      // Fechar o toast automaticamente após 1 segundo
      setTimeout(() => {
        toastResult.dismiss();
      }, 1000);
      navigate('/admin');
    } catch (error) {
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Credenciais inválidas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <>
      <SEO title="Login Administrativo" description="Acesso ao painel administrativo do sistema de vendas do Hillsong Lounge - Encounterfest 2025." noindex={true} />
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 rounded-full overflow-hidden mb-4">
              <img src="/brand/d8797de3-f66c-4df1-be7a-6f33464353d3.png" alt="Hillsong Logo" className="h-full w-full object-cover" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Painel Administrativo</h2>
            <p className="mt-2 text-sm text-gray-600">Hillsong Lounge</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Login</CardTitle>
              <CardDescription className="text-center">
                Digite suas credenciais para acessar o sistema
              </CardDescription>
              {import.meta.env.DEV && (
                <p className="text-center text-xs text-gray-500">
                  Demonstração local: admin@hillsong.com / demo1234
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="mt-1 relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="email" name="email" type="email" autoComplete="email" required className="pl-10" placeholder="Digite seu e-mail" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <div className="mt-1 relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="password" name="password" type="password" autoComplete="current-password" required className="pl-10" placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>;
};
export default Auth;