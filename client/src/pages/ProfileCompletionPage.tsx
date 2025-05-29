import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Create schema for the profile completion form
const profileCompletionSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  displayName: z.string().optional(),
});

type ProfileCompletionFormValues = z.infer<typeof profileCompletionSchema>;

export default function ProfileCompletionPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Create form
  const form = useForm<ProfileCompletionFormValues>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      username: "",
      displayName: user?.displayName || "",
    },
  });

  // Watch username field for availability check
  const username = form.watch("username");

  // Check username availability when the username changes
  useEffect(() => {
    const checkUsername = async () => {
      if (username.length >= 3) {
        setCheckingUsername(true);
        try {
          const response = await apiRequest("GET", `/api/check-username?username=${encodeURIComponent(username)}`);
          const data = await response.json();
          setUsernameAvailable(data.available);
        } catch (error) {
          console.error("Error checking username:", error);
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
      }
    };

    // Debounce the check to avoid too many requests
    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  // If user is still loading, show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not logged in, redirect to auth page
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // If user doesn't need profile completion, redirect to home
  if (!user.needsProfileCompletion) {
    return <Redirect to="/" />;
  }

  const onSubmit = async (values: ProfileCompletionFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/complete-profile", values);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      
      const updatedUser = await response.json();
      
      // Update user data in auth context
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Redirect to home page
      setLocation("/");
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-purple-300/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-40 w-40 h-40 bg-blue-300/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-md">
            Welcome to TCG DeckMaster!
          </h1>
          <p className="text-white/80 text-lg max-w-md mx-auto">
            You're almost ready to start your Pokémon card collection journey
          </p>
        </div>
        
        <Card className="w-full backdrop-blur-sm bg-white/90 border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent pb-1">
              Choose Your Trainer Name
            </CardTitle>
            <CardDescription className="text-gray-600">
              This will be your unique identifier in the TCG DeckMaster community
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-4">
            {user?.avatar && (
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Trainer Name</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            placeholder="Choose a username like 'PokeMaster' or 'AshKetchum'" 
                            {...field} 
                            disabled={isSubmitting}
                            className={
                              usernameAvailable === true 
                                ? "pr-10 border-green-500 focus-visible:ring-green-500 shadow-sm" 
                                : usernameAvailable === false
                                  ? "pr-10 border-red-500 focus-visible:ring-red-500 shadow-sm"
                                  : "pr-10 shadow-sm"
                            }
                          />
                        </FormControl>
                        {checkingUsername && (
                          <div className="absolute right-3 top-2.5">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                          </div>
                        )}
                        {!checkingUsername && usernameAvailable === true && field.value.length >= 3 && (
                          <div className="absolute right-3 top-2.5">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      </div>
                      {!checkingUsername && usernameAvailable === false && (
                        <p className="text-sm font-medium text-red-500 mt-1">
                          This trainer name is already taken
                        </p>
                      )}
                      {usernameAvailable === true && field.value.length >= 3 && (
                        <p className="text-sm font-medium text-green-500 mt-1">
                          Great choice! This trainer name is available
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Display Name (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your real name or nickname" 
                          {...field} 
                          disabled={isSubmitting}
                          className="shadow-sm" 
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">
                        This will be displayed alongside your trainer name
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md transition-all duration-200 py-6"
                    disabled={isSubmitting || usernameAvailable === false || checkingUsername || form.getValues('username')?.length < 3}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Setting Up Your Profile...
                      </>
                    ) : (
                      "Start My Collection Journey"
                    )}
                  </Button>
                </div>
                
                <div className="text-center text-sm text-gray-500 mt-4">
                  By continuing, you agree to follow the <span className="text-blue-600">community guidelines</span> and <span className="text-blue-600">terms of service</span>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}