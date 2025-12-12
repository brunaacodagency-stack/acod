import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("Delete User function invoked");

        // Create Supabase client with Admin (Service Role) rights
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get the user_id from the request body
        let user_id;
        try {
            const body = await req.json();
            user_id = body.user_id;
        } catch (e) {
            console.error("Error parsing JSON:", e);
            throw new Error("Invalid Request Body");
        }

        console.log(`Attempting to delete user: ${user_id}`);

        if (!user_id) {
            return new Response(
                JSON.stringify({ error: 'User ID is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // 0. Remove dependent data from 'contents' table
        const { error: contentError } = await supabaseAdmin
            .from('contents')
            .delete()
            .eq('user_id', user_id);

        if (contentError) {
            console.error('Error deleting user contents:', contentError);
            // We continue, as it might fail if table doesn't exist or other reasons, but usually we want to try to clear child data
        } else {
            console.log("User contents deleted successfully");
        }

        // 1. Delete from profiles table (Service Role allows bypassing RLS)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('user_id', user_id);

        if (profileError) {
            console.error('Error deleting profile (continuing anyway):', profileError);
            // We don't stop here because the main goal is to delete the Auth User
        } else {
            console.log("Profile deleted successfully");
        }

        // 2. Delete user from Auth
        const { data, error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

        if (authError) {
            console.error('Error deleting user from Auth:', authError)
            return new Response(
                JSON.stringify({ error: authError.message }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        console.log("Auth user deleted successfully");

        // Return success
        return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Unexpected error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal Server Error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
