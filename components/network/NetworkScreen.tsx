import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import NetworkSelector from './NetworkSelector';
import NetworkDetails from './NetworkDetails';
import { sharedStyles } from '@/styles/shared';

export default function NetworkScreen() {
  const { t } = useTranslation();

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
