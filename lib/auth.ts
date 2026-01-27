import { supabase } from './supabase';

export type AuthError = {
    message: string;
    code?: string;
};

export type AuthResult = {
    success: boolean;
    error?: AuthError;
};

/**
 * Sign up a new user with email and password
 * Note: Profile is automatically created by database trigger
 */
export async function signUp(email: string, password: string, fullName: string): Promise<AuthResult> {
    try {
        // Create the user account
        // The database trigger will automatically create the profile
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (authError) {
            return {
                success: false,
                error: {
                    message: authError.message,
                    code: authError.code,
                },
            };
        }

        if (!authData.user) {
            return {
                success: false,
                error: {
                    message: 'Failed to create user account',
                },
            };
        }

        // Wait a moment for the trigger to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify profile was created by trigger
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile was not created by trigger:', profileError);
            // This is a critical error - trigger failed
            return {
                success: false,
                error: {
                    message: 'Account created but profile setup failed. Please contact support.',
                },
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Signup error:', error);
        return {
            success: false,
            error: {
                message: 'An unexpected error occurred during signup',
            },
        };
    }
}

/**
 * Sign in a user with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return {
                success: false,
                error: {
                    message: error.message,
                    code: error.code,
                },
            };
        }

        if (!data.user) {
            return {
                success: false,
                error: {
                    message: 'Login failed',
                },
            };
        }

        // Verify profile exists (it should always exist due to trigger)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile missing for user:', data.user.id);

            // This should never happen with our trigger, but handle it as a fallback
            // Try to create the profile with available user data
            const { error: createError } = await supabase.from('profiles').insert({
                id: data.user.id,
                full_name: data.user.user_metadata?.full_name || '',
            });

            if (createError) {
                console.error('Failed to create missing profile:', createError);
                return {
                    success: false,
                    error: {
                        message: 'Account setup incomplete. Please contact support.',
                    },
                };
            }

            console.log('Created missing profile for user:', data.user.id);
        }

        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: {
                message: 'An unexpected error occurred during login',
            },
        };
    }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return {
                success: false,
                error: {
                    message: error.message,
                },
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Signout error:', error);
        return {
            success: false,
            error: {
                message: 'An unexpected error occurred during signout',
            },
        };
    }
}

/**
 * Get the current user session
 */
export async function getSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Session error:', error);
            return null;
        }

        return session;
    } catch (error) {
        console.error('Get session error:', error);
        return null;
    }
}

/**
 * Get the current user and verify their profile exists
 */
export async function getUserWithProfile() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return null;
        }

        // Verify profile exists
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile not found for authenticated user:', user.id);
            return null;
        }

        return {
            user,
            profile,
        };
    } catch (error) {
        console.error('Get user with profile error:', error);
        return null;
    }
}
