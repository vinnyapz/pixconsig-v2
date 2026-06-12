import React from 'react';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen w-full relative flex items-center justify-center p-4">
             {/* Background Image with Overlay */}
             <div className="absolute inset-0 z-0" style={{
                backgroundImage: 'url("/recovery-bg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}>
                {/* Gradient Overlay for better readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0066A1]/40 to-black/60 backdrop-blur-[2px]" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full flex flex-col items-center justify-center">
                <ResetPasswordForm />
            </div>
        </div>
    );
}
