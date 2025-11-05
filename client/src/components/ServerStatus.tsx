import { useEffect, useState } from 'react';
import { config } from '@/config/env';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const ServerStatus = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL.replace('/api', '')}/health`);
        if (response.ok) {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      } catch (error) {
        setStatus('offline');
      }
    };

    checkServerStatus();
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking server...
      </div>
    );
  }

  if (status === 'online') {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle className="w-4 h-4" />
        Server is online
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-red-600 text-sm">
      <AlertCircle className="w-4 h-4" />
      Server is offline - Please start the Flask server
    </div>
  );
};

export default ServerStatus;