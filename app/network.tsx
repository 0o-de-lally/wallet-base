import { useEffect } from 'react';
import { View } from 'react-native';
import { initializeNetworkConfig } from '../util/networkSettings';

export default function App() {
  useEffect(() => {
    const init = async () => {
      try {
        await initializeNetworkConfig();
      } catch (error) {
        console.error('Failed to initialize network config:', error);
      }
    };

    init();
  }, []);

  return (
    <View>
      {/* Your app content */}
    </View>
  );
}
