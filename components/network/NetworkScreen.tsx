import { View } from 'react-native';
import NetworkSelector from './NetworkSelector';
import NetworkDetails from './NetworkDetails';
import { sharedStyles } from '@/styles/shared';

export default function NetworkScreen() {
  return (
    <View style={sharedStyles.container}>
      <View style={sharedStyles.card}>
        <NetworkSelector />
      </View>
      <View style={sharedStyles.card}>
        <NetworkDetails />
      </View>
    </View>
  );
}
