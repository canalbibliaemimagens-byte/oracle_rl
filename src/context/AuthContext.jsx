import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const AuthContext = createContext(null);

// Supabase client - only initialize if env vars are set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if auth is required (has WS_TOKEN means public mode)
    const requiresAuth = !!import.meta.env.VITE_WS_TOKEN;

    useEffect(() => {
        if (!supabase || !requiresAuth) {
            // No auth required (local mode)
            setLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        if (!supabase) {
            return { error: { message: 'Supabase not configured' } };
        }
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    };

    const logout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
    };

    const isAuthenticated = !requiresAuth || !!session;

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            login,
            logout,
            isAuthenticated,
            requiresAuth,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
