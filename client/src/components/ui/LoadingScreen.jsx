import React, { useEffect, useState } from 'react';

// Shown while the app checks whether someone is already signed in.
// The demo backend sleeps when idle, so after a few seconds we explain the
// wait rather than leaving people looking at an empty page.
const LoadingScreen = () => {
  const [takingLong, setTakingLong] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTakingLong(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      <p className="mt-6 text-base font-medium text-slate-900">Starting GramSetu</p>
      {takingLong && (
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          The demo server sleeps when it is not in use. The first load can take
          up to a minute while it starts back up.
        </p>
      )}
    </div>
  );
};

export default LoadingScreen;
