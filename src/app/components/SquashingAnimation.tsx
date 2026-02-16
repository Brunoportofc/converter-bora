'use client';

import Lottie from 'lottie-react';
import animationData from '../../../public/Files.json';

export function SquashingAnimation() {
    return (
        <div className="flex flex-col items-center justify-center py-4 relative overflow-visible w-full max-w-md mx-auto">

            <div className="w-64 h-64">
                <Lottie
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                />
            </div>

            <p className="mt-12 text-blue-300 font-mono text-sm animate-pulse">
                Esmagando bytes...
            </p>
        </div>
    );
}
