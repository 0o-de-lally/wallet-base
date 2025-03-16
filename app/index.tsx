import { StyleSheet, View } from 'react-native';
import NetworkScreen from './network';
import { CustomText } from '../components/CustomText';

export default function HomeScreen() {

  return (
      <View style={styles.container}>
        <CustomText>Welcome!</CustomText>
        <NetworkScreen />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
