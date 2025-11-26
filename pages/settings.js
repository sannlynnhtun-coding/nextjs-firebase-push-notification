import { useState, useEffect } from 'react';
import PushNotificationLayout from '../components/PushNotificationLayout';
import FirebaseConfigForm from '../components/FirebaseConfigForm';
import localforage from 'localforage';

export default function Settings() {
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    try {
      const config = await localforage.getItem('firebase_config');
      setHasConfig(!!config);
    } catch (error) {
      console.error('Error checking config:', error);
    }
  };

  const handleConfigSaved = () => {
    setHasConfig(true);
  };

  return (
    <PushNotificationLayout>
      <FirebaseConfigForm onConfigSaved={handleConfigSaved} />
    </PushNotificationLayout>
  );
}


