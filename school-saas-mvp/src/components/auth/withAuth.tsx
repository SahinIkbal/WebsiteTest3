'use client';

import { useEffect, useState, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { AuthTokenPayload } from '@/lib/auth'; // Assuming verifyToken can run client-side if needed, or use a fetch to an API route

// Helper function to get token and user data from localStorage
const getClientSideAuth = (): { token: string | null; user: AuthTokenPayload | null } => {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }
  const token = localStorage.getItem('authToken');
  const userDataString = localStorage.getItem('userData');
  let user: AuthTokenPayload | null = null;
  if (userDataString) {
    try {
      user = JSON.parse(userDataString);
    } catch (e) {
      console.error("Error parsing user data from localStorage", e);
      localStorage.removeItem('userData'); // Clear corrupted data
      localStorage.removeItem('authToken'); // Also clear token as state is inconsistent
      return { token: null, user: null }; // Return null user if parsing fails
    }
  }
   // Basic check if token is present, but not expired (actual verification is harder client-side without exposing secret)
  // For MVP, presence of token and user data is the main check.
  // A better check would be to have an API endpoint like /api/auth/verify that the client calls.
  if (!token || !user) {
    return { token: null, user: null };
  }

  return { token, user };
};


interface WithAuthProps {
  allowedRoles?: AuthTokenPayload['role'][];
}

export default function withAuth<P extends object>(
  WrappedComponent: ComponentType<P & { currentUser: AuthTokenPayload }>,
  options?: WithAuthProps
) {
  const ComponentWithAuth = (props: Omit<P, 'currentUser'>) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<AuthTokenPayload | null>(null);

    useEffect(() => {
      const auth = getClientSideAuth();
      if (!auth.token || !auth.user) {
        router.replace('/login');
      } else {
        // Role check
        if (options?.allowedRoles && !options.allowedRoles.includes(auth.user.role)) {
          // Redirect to a 'forbidden' page or back to dashboard/login
          // For now, redirecting to dashboard, which might then redirect again if dashboard also has role checks
          console.warn(`User role ${auth.user.role} not allowed. Allowed: ${options.allowedRoles.join(', ')}`);
          router.replace('/dashboard'); // Or a dedicated /unauthorized page
        } else {
          setIsAuthenticated(true);
          setUser(auth.user);
        }
      }
    }, [router]);

    if (!isAuthenticated || !user) {
      // You can render a loading spinner here
      return <div className="min-h-screen flex items-center justify-center"><p>Loading and verifying authentication...</p></div>;
    }

    // Pass down the user object to the wrapped component if needed
    return <WrappedComponent {...(props as P)} currentUser={user} />;
  };
  return ComponentWithAuth;
}
