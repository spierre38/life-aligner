// Import our Supabase client
import { supabase } from '@/lib/supabase'

// API route that tests if Supabase is connected
export async function GET() {
    try {
        // seeing if we can get a session
        const { error } = await supabase.auth.getSession()

        // catching errors 
        if (error) throw error

        // Hopefully it comes back as success
        return Response.json({
            status: 'success',
            message: 'Supabase is connected and ready!'
        })

    } catch (error) {
        // somehitngs wrong we get here
        const errorMessage = (error as any)?.message || 'Connection failed'

        return Response.json({
            status: 'error',
            message: errorMessage
        }, {
            status: 500
        })
    }
}
