'use client'

import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import Image from 'next/image'

const supabase = createClient()

export default function LoginPage() {

  return (
    <main className="glow-container flex items-center justify-center p-4">
      {/* Background patterns and glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />
      <div className="blue-glow -top-24 -left-24" />
      <div className="blue-glow -bottom-24 -right-24" />

      <div className="relative w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white border border-slate-200 shadow-sm mb-6 overflow-hidden">
            <Image 
              src="/logo.png" 
              alt="Steven Golus Logo" 
              width={96} 
              height={96}
              className="object-cover"
            />
          </div>
          <h1 className="text-4xl font-extrabold text-[#003B71] tracking-tight">Training Portal</h1>
          <p className="text-slate-500 mt-3 text-xs font-bold tracking-[0.2em] uppercase">Steven Golus Training</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#003B71',
                    brandAccent: '#00264d',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#FFFFFF',
                    defaultButtonBackgroundHover: '#F8FAFC',
                    defaultButtonBorder: '#E2E8F0',
                    defaultButtonText: '#1A202C',
                    dividerBackground: '#E2E8F0',
                    inputBackground: '#FFFFFF',
                    inputBorder: '#E2E8F0',
                    inputBorderHover: '#003B71',
                    inputBorderFocus: '#003B71',
                    inputText: '#1A202C',
                    inputLabelText: '#4A5568',
                    inputPlaceholder: '#A0AEC0',
                    messageText: '#1A202C',
                    messageBackground: '#F1F5F9',
                    messageBorder: '#E2E8F0',
                    anchorTextColor: '#003B71',
                  },
                  space: {
                    inputPadding: '14px',
                    buttonPadding: '14px',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '12px',
                    buttonBorderRadius: '12px',
                    inputBorderRadius: '12px',
                  },
                },
              },
            }}
            providers={['google']}
            redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`}
            localization={{
              variables: {
                sign_in: {
                  social_provider_text: 'Continue with {{provider}}',
                },
              },
            }}
          />

          <p className="text-center text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-wider">
            Secure Access • Steven Golus Training
          </p>
        </div>
      </div>
    </main>
  )
}
