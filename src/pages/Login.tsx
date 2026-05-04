import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
    const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true); // start loader

  try {
    const res = await fetch(`${baseURL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast({
        title: "Login failed",
        description: data.detail || "Invalid credentials",
        variant: "destructive",
      });
      return;
    }

    login(data.access_token, data.user);

    toast({
      title: "Welcome back!",
      description: `Logged in as ${data.user.email}`,
    });

    navigate("/dashboard");
  } catch {
    toast({
      title: "Server error",
      description: "Unable to login. Try again later.",
      variant: "destructive",
    });
  } finally {
    setLoading(false); // stop loader
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary">
              <Truck className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold">Ugly Truck Admin</CardTitle>
            <CardDescription>
              Sign in to access the truck resale automation platform
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;



// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '@/contexts/AuthContext';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Truck } from 'lucide-react';
// import { useToast } from '@/hooks/use-toast';
//
// const Login = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const { login } = useAuth();
//   const navigate = useNavigate();
//   const { toast } = useToast();
//
//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//
//     const success = login(username, password);
//
//     if (success) {
//       toast({
//         title: 'Welcome back!',
//         description: 'Successfully logged in as admin.',
//       });
//       navigate('/dashboard');
//     } else {
//       toast({
//         title: 'Login failed',
//         description: 'Invalid credentials. Please try again.',
//         variant: 'destructive',
//       });
//     }
//   };
//
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
//       <Card className="w-full max-w-md">
//         <CardHeader className="space-y-4">
//           <div className="flex justify-center">
//             <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary">
//               <Truck className="w-8 h-8 text-primary-foreground" />
//             </div>
//           </div>
//           <div className="space-y-2 text-center">
//             <CardTitle className="text-2xl font-bold">Ugly Truck Admin</CardTitle>
//             <CardDescription>
//               Sign in to access the truck resale automation platform
//             </CardDescription>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="username">Username</Label>
//               <Input
//                 id="username"
//                 type="text"
//                 placeholder="Enter your username"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="Enter your password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>
//             <Button type="submit" className="w-full">
//               Sign In
//             </Button>
//             <p className="text-xs text-center text-muted-foreground mt-4">
//               Demo credentials: admin / admin123
//             </p>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };
//
// export default Login;
