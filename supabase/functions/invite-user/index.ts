import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, role, display_name } = await req.json()

        if (!email) {
            throw new Error('Email is required')
        }

        const { data, error } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
            data: {
                role: role || 'cliente',
                display_name: display_name || ''
            },
            redirectTo: `${req.headers.get('origin')}/auth?setup_password=true`
        })

        if (error) throw error

        // Also update the profile if needed immediately, though the invite metadata should handle it on trigger if set up, 
        // but updating profile directly ensures role is set.
        // However, the user isn't fully created until they accept? 
        // Actually inviteUser creates the user in 'invited' state. We can update profiles table now.

        if (data.user) {
            // Upsert into profiles to ensure data is there
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    email: email,
                    role: role || 'cliente',
                    display_name: display_name || '',
                    user_id: data.user.id
                })

            if (profileError) {
                console.error('Error creating profile:', profileError)
            }
        }

        return new Response(
            JSON.stringify(data),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
