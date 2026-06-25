import { useState, useEffect } from 'react';

export const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (document.getElementById('razorpay-script')) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error('Razorpay script failed to load');
    document.body.appendChild(script);

    return () => {
      // We don't remove it to reuse if needed, but we could
    };
  }, []);

  return isLoaded;
};
