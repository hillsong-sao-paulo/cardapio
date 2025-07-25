
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se já está logado
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Usar a função is_admin_user para verificar credenciais
      const { data, error } = await supabase
        .rpc('is_admin_user', { 
          user_email: email, 
          user_password: password 
        });

      if (error) {
        console.error('Erro na autenticação:', error);
        throw new Error('Erro ao verificar credenciais');
      }

      if (data === true) {
        // Salvar sessão admin no localStorage
        localStorage.setItem('admin_session', JSON.stringify({
          email,
          loginTime: new Date().toISOString()
        }));

        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o painel..."
        });

        navigate('/admin');
      } else {
        throw new Error('Credenciais inválidas');
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      toast({
        title: "Erro",
        description: error.message || "Credenciais inválidas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img 
                src="/lovable-uploads/d8797de3-f66c-4df1-be7a-6f33464353d3.png" 
                alt="Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
          <CardTitle className="text-2xl">Login Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Carregando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
