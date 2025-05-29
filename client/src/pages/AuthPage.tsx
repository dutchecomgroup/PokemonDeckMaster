import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect } from "wouter";
import { insertUserSchema, loginSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

// Create schemas for the forms, based on our shared schema
const loginFormSchema = loginSchema;

// Create a new schema for registration with client-side validations
const registerFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Please enter a valid email address"),
  displayName: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCards: 0,
    totalCollections: 0
  });
  const [randomCards, setRandomCards] = useState([
    {
      id: 25,
      name: "Pikachu",
      image: "https://assets.pokemon.com/assets/cms2/img/pokedex/full/025.png",
      type: "Electric",
      rarity: "Rare",
      color: "from-yellow-400/60 to-amber-600/60",
      textColor: "text-yellow-300"
    },
    {
      id: 6,
      name: "Charizard",
      image: "https://assets.pokemon.com/assets/cms2/img/pokedex/full/006.png",
      type: "Fire",
      rarity: "Ultra Rare",
      color: "from-orange-400/60 to-red-600/60",
      textColor: "text-orange-300"
    },
    {
      id: 1,
      name: "Bulbasaur",
      image: "https://assets.pokemon.com/assets/cms2/img/pokedex/full/001.png",
      type: "Grass",
      rarity: "Uncommon",
      color: "from-green-400/60 to-teal-600/60",
      textColor: "text-green-300"
    }
  ]);
  const { user } = useAuth();
  
  // List of popular Pokémon with their IDs, types, rarities, and color schemes
  const pokemonDatabase = [
    {id: 25, name: "Pikachu", type: "Electric", rarity: "Rare", color: "from-yellow-400/60 to-amber-600/60", textColor: "text-yellow-300"},
    {id: 6, name: "Charizard", type: "Fire", rarity: "Ultra Rare", color: "from-orange-400/60 to-red-600/60", textColor: "text-orange-300"},
    {id: 1, name: "Bulbasaur", type: "Grass", rarity: "Uncommon", color: "from-green-400/60 to-teal-600/60", textColor: "text-green-300"},
    {id: 150, name: "Mewtwo", type: "Psychic", rarity: "Legendary", color: "from-purple-400/60 to-indigo-600/60", textColor: "text-purple-300"},
    {id: 9, name: "Blastoise", type: "Water", rarity: "Rare", color: "from-blue-400/60 to-cyan-600/60", textColor: "text-blue-300"},
    {id: 94, name: "Gengar", type: "Ghost", rarity: "Rare", color: "from-purple-500/60 to-purple-800/60", textColor: "text-purple-300"},
    {id: 143, name: "Snorlax", type: "Normal", rarity: "Rare", color: "from-blue-300/60 to-blue-500/60", textColor: "text-blue-200"},
    {id: 249, name: "Lugia", type: "Psychic", rarity: "Legendary", color: "from-blue-300/60 to-indigo-500/60", textColor: "text-blue-200"},
    {id: 384, name: "Rayquaza", type: "Dragon", rarity: "Legendary", color: "from-green-500/60 to-emerald-700/60", textColor: "text-green-300"},
    {id: 448, name: "Lucario", type: "Fighting", rarity: "Rare", color: "from-blue-500/60 to-blue-700/60", textColor: "text-blue-300"},
    {id: 133, name: "Eevee", type: "Normal", rarity: "Uncommon", color: "from-amber-400/60 to-amber-600/60", textColor: "text-amber-300"},
    {id: 39, name: "Jigglypuff", type: "Fairy", rarity: "Common", color: "from-pink-400/60 to-pink-600/60", textColor: "text-pink-300"}
  ];
  
  // Fetch real statistics and generate random cards when component mounts
  useEffect(() => {
    // Generate initial random cards on mount
    const initializeRandomCards = () => {
      // Create a copy and shuffle with Fisher-Yates algorithm
      const shuffled = [...pokemonDatabase];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Take the first 3 pokemon
      const selected = shuffled.slice(0, 3);
      
      // Format with proper image URLs
      const formattedCards = selected.map(pokemon => ({
        ...pokemon,
        image: `https://assets.pokemon.com/assets/cms2/img/pokedex/full/${pokemon.id.toString().padStart(3, '0')}.png`
      }));
      
      console.log("Random Pokémon generated on mount:", formattedCards);
      
      // Update state with the random cards
      setRandomCards(formattedCards);
    };

    // Fetch statistics from our API
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        console.log("Stats loaded:", data);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
      });
    
    // Generate new random cards
    initializeRandomCards();
    
    // Add this key to force re-render when page loads
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        initializeRandomCards();
      }
    };
    
    // Update cards when user returns to the page
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // If user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }

  // Use a reliable background image URL
  const cardsBackgroundURL = "https://wallpaperaccess.com/full/4167709.jpg";

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden bg-slate-900">
      {/* Background with Pokemon Cards */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm z-10"></div>
        <img 
          src={cardsBackgroundURL} 
          alt="Pokemon Cards Collection" 
          className="w-full h-full object-cover object-center"
        />
      </div>
      
      {/* Decorative Pokemon Card Elements */}
      <div className="absolute w-full h-full overflow-hidden pointer-events-none z-20">
        {/* Card 1 - Floating in top left */}
        <div className="absolute top-[5%] left-[5%] w-48 md:w-64 transform rotate-[-15deg] hover:rotate-[-5deg] transition-all duration-700 animate-float-slow">
          <div className="card-glow absolute inset-0 rounded-2xl"></div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 shadow-2xl p-1">
            <div className="relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-r ${randomCards[0]?.color || 'from-blue-400/60 to-indigo-600/60'}`}></div>
              <img
                src={randomCards[0]?.image}
                alt={randomCards[0]?.name}
                className="w-full h-full object-contain transform hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div className={`font-bold text-sm md:text-base ${randomCards[0]?.textColor || 'text-yellow-300'}`}>{randomCards[0]?.name}</div>
                <div className="text-white/80 text-xs">{randomCards[0]?.type} • {randomCards[0]?.rarity}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 2 - Floating in top right */}
        <div className="absolute top-[8%] right-[7%] w-52 md:w-72 transform rotate-[12deg] hover:rotate-[5deg] transition-all duration-700 animate-float-slow-reverse">
          <div className="card-glow absolute inset-0 rounded-2xl"></div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 shadow-2xl p-1">
            <div className="relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-r ${randomCards[1]?.color || 'from-orange-400/60 to-red-600/60'}`}></div>
              <img
                src={randomCards[1]?.image}
                alt={randomCards[1]?.name}
                className="w-full h-full object-contain transform hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div className={`font-bold text-sm md:text-base ${randomCards[1]?.textColor || 'text-orange-300'}`}>{randomCards[1]?.name}</div>
                <div className="text-white/80 text-xs">{randomCards[1]?.type} • {randomCards[1]?.rarity}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 3 - Floating in bottom left */}
        <div className="absolute bottom-[10%] left-[12%] w-44 md:w-60 transform rotate-[20deg] hover:rotate-[15deg] transition-all duration-700 animate-float-medium">
          <div className="card-glow absolute inset-0 rounded-2xl"></div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 shadow-2xl p-1">
            <div className="relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-r ${randomCards[2]?.color || 'from-green-400/60 to-teal-600/60'}`}></div>
              <img
                src={randomCards[2]?.image}
                alt={randomCards[2]?.name}
                className="w-full h-full object-contain transform hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div className={`font-bold text-sm md:text-base ${randomCards[2]?.textColor || 'text-green-300'}`}>{randomCards[2]?.name}</div>
                <div className="text-white/80 text-xs">{randomCards[2]?.type} • {randomCards[2]?.rarity}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 z-40 backdrop-blur-sm">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm animate-gradient">
              TCG DeckMaster
            </h1>
            <p className="text-gray-300 mt-2 text-lg">
              Your ultimate Pokémon card collection companion
            </p>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 shadow-2xl">
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-black/40 p-1">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary/80 text-white data-[state=active]:text-white rounded-md py-3 font-medium">Login</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-primary/80 text-white data-[state=active]:text-white rounded-md py-3 font-medium">Register</TabsTrigger>
              </TabsList>
              
              {/* Fixed height container for form content - ensures consistent height */}
              <div className="h-[650px] relative">
                <TabsContent value="login" className="m-0 absolute inset-0 overflow-auto">
                  <div className="p-6 text-white h-full overflow-y-auto scrollbar-thin">
                    <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Welcome Back, Trainer!
                    </h2>
                    <p className="text-white mb-6">
                      Sign in to access your Pokémon card collection
                    </p>
                    <LoginForm />
                  </div>
                </TabsContent>
                
                <TabsContent value="register" className="m-0 absolute inset-0 overflow-auto">
                  <div className="p-6 text-white h-full overflow-y-auto scrollbar-thin">
                    <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Begin Your Collection Journey
                    </h2>
                    <p className="text-white mb-6">
                      Create an account to start your Pokémon card adventure
                    </p>
                    <RegisterForm />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Hero Section - Right side information */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center relative z-40 backdrop-blur-sm">
        {/* Hero Banner/Carousel */}
        <div className="w-full max-w-lg mb-6 overflow-hidden rounded-2xl shadow-2xl">
          <div className="relative">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mt-10 -mr-10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -mb-8 -ml-8 blur-xl"></div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white z-10 relative tracking-tight mb-2">
                Start Your <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Pokémon</span> Journey
              </h2>
              <p className="text-white/80 text-lg max-w-md mb-6">
                Join our community of collectors and track your valuable cards with precision
              </p>
              
              <div className="flex items-center gap-4 mt-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white">P</div>
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white">M</div>
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white">S</div>
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white">+</div>
                </div>
                <span className="text-white text-sm">Join {stats.totalUsers > 0 ? `${stats.totalUsers}+` : 'our community of'} collectors today!</span>
              </div>
            </div>
            
            {/* Featured Cards Display */}
            <div className="grid grid-cols-3 gap-1 p-3 bg-slate-800 border-t border-white/10">
              <div className="aspect-[2.5/3.5] bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded overflow-hidden relative group">
                <img src="https://assets.pokemon.com/assets/cms2/img/cards/web/SV01/SV01_EN_90.png" 
                     alt="Featured Card" 
                     className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 right-0 p-1 text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="font-bold">Charizard</p>
                  <p className="text-yellow-300">Ultra Rare</p>
                </div>
              </div>
              <div className="aspect-[2.5/3.5] bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded overflow-hidden relative group">
                <img src="https://assets.pokemon.com/assets/cms2/img/cards/web/SWSH12/SWSH12_EN_179.png" 
                     alt="Featured Card" 
                     className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 right-0 p-1 text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="font-bold">Pikachu VMAX</p>
                  <p className="text-yellow-300">Rare Holo</p>
                </div>
              </div>
              <div className="aspect-[2.5/3.5] bg-gradient-to-br from-green-500/20 to-green-600/10 rounded overflow-hidden relative group">
                <img src="https://assets.pokemon.com/assets/cms2/img/cards/web/SWSH11/SWSH11_EN_185.png" 
                     alt="Featured Card" 
                     className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 right-0 p-1 text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="font-bold">Mew V</p>
                  <p className="text-yellow-300">Rare Holo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        {/* Live Statistics Section */}
        <div className="max-w-lg w-full bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-2xl">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">Community Stats</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg border border-blue-500/20">
              <div className="text-3xl font-bold text-blue-300 mb-1">
                {stats.totalCards.toLocaleString()}
              </div>
              <div className="text-xs text-gray-300">Cards Collected</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg border border-purple-500/20">
              <div className="text-3xl font-bold text-purple-300 mb-1">
                {stats.totalUsers.toLocaleString()}
              </div>
              <div className="text-xs text-gray-300">Active Collectors</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg border border-green-500/20">
              <div className="text-3xl font-bold text-green-300 mb-1">
                {stats.totalCollections.toLocaleString()}
              </div>
              <div className="text-xs text-gray-300">Collections Created</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-xl border border-blue-500/30 hover:border-blue-400/50 transform hover:scale-105 transition-all duration-300">
              <h3 className="font-bold text-lg mb-1 text-blue-300">Card Recognition</h3>
              <p className="text-gray-300 text-sm">AI-powered card identification technology</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 rounded-xl border border-purple-500/30 hover:border-purple-400/50 transform hover:scale-105 transition-all duration-300">
              <h3 className="font-bold text-lg mb-1 text-purple-300">Collection Analytics</h3>
              <p className="text-gray-300 text-sm">Track collection value and progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  const isPending = loginMutation.isPending;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const handleSocialLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="space-y-5">
      {/* Social Login Buttons */}
      <div className="space-y-2">
        <Button 
          type="button" 
          variant="outline" 
          className="w-full border-2 flex items-center justify-center gap-2 h-11 bg-white hover:bg-gray-50 text-gray-900 font-medium"
          onClick={() => handleSocialLogin('google')}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"
            />
            <path
              fill="#34A853"
              d="M16.0407269,18.0125889 C14.9509167,18.7163129 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"
            />
            <path
              fill="#4A90E2"
              d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1272727,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"
            />
            <path
              fill="#FBBC05"
              d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"
            />
          </svg>
          Continue with Google
        </Button>
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full border-2 flex items-center justify-center gap-2 h-11 bg-gray-400 text-white border-gray-400 font-medium cursor-not-allowed opacity-50"
          disabled
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
            <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z" />
          </svg>
          Facebook Login (Coming Soon)
        </Button>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300/30"></span>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-slate-900 px-3 text-gray-300">Or continue with</span>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-medium">Username</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your username" 
                    {...field} 
                    disabled={isPending} 
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-medium">Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Enter your password" 
                    {...field} 
                    disabled={isPending}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Sign In with Username"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();
  const isPending = registerMutation.isPending;
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Fetch the registration status when component mounts
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        setIsCheckingStatus(true);
        const response = await fetch('/api/registration-status');
        const data = await response.json();
        setRegistrationEnabled(data.enabled);
        console.log('Registration enabled:', data.enabled);
      } catch (error) {
        console.error('Error checking registration status:', error);
        // Default to enabled if there's an error checking
        setRegistrationEnabled(true);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkRegistrationStatus();
  }, []);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    if (!registrationEnabled) {
      return;
    }
    registerMutation.mutate(values);
  };

  const handleSocialLogin = (provider: string) => {
    if (!registrationEnabled) {
      return;
    }
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="space-y-5 relative">
      {/* Registration Disabled Overlay */}
      {!isCheckingStatus && !registrationEnabled && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-lg p-6">
          <div className="bg-slate-800 p-6 rounded-xl shadow-xl border border-primary/30 max-w-md text-center">
            <h3 className="text-xl font-bold text-white mb-2">Registration Disabled</h3>
            <p className="text-gray-300 mb-4">
              The administrator has temporarily disabled new user registration.
            </p>
            <p className="text-gray-400 text-sm">
              Please try again later or contact the administrator for assistance.
            </p>
          </div>
        </div>
      )}
      
      {/* Social Sign Up Buttons */}
      <div className="space-y-2">
        <Button 
          type="button" 
          variant="outline" 
          className="w-full border-2 flex items-center justify-center gap-2 h-11 bg-white hover:bg-gray-50 text-gray-900 font-medium"
          onClick={() => handleSocialLogin('google')}
          disabled={isPending || !registrationEnabled}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"
            />
            <path
              fill="#34A853"
              d="M16.0407269,18.0125889 C14.9509167,18.7163129 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"
            />
            <path
              fill="#4A90E2"
              d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1272727,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"
            />
            <path
              fill="#FBBC05"
              d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"
            />
          </svg>
          Sign up with Google
        </Button>
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full border-2 flex items-center justify-center gap-2 h-11 bg-gray-400 text-white border-gray-400 font-medium cursor-not-allowed opacity-50"
          disabled
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
            <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z" />
          </svg>
          Facebook Sign Up (Coming Soon)
        </Button>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300/30"></span>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-slate-900 px-3 text-gray-300">Or register with email</span>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-medium">Username</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="trainer123" 
                    {...field} 
                    disabled={isPending} 
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-medium">Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="trainer@example.com" 
                    {...field} 
                    disabled={isPending} 
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-medium">Display Name (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ash Ketchum" 
                    {...field} 
                    disabled={isPending} 
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-medium">Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="********" 
                    {...field} 
                    disabled={isPending} 
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-medium">Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="********" 
                    {...field} 
                    disabled={isPending} 
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full font-semibold bg-primary hover:bg-primary/90" 
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account with Email"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}