import { useReducer, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ChainName } from '../types/networkTypes';
import { appReducer } from '../app/context/AppContext';

export default function NetworkSelector() {
  const [state, dispatch] = useReducer(appReducer, {});

  const [selectedNetwork, setPickerValue] = useState<ChainName>(ChainName.MAINNET);

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={state.network_config.type}
        onValueChange={async (value: ChainName) => {
          console.log('Selected network:', value);
          setPickerValue(value);
          dispatch('update');
        }}>
        {Object.values(ChainName).map((type) => (
          <Picker.Item key={type} label={type} value={type} />
        ))}
      </Picker>

      {/* {selectedNetwork === NetworkType.CUSTOM && (
        <CustomNetworkForm
          initialValues={MAINNET_CONFIG}
          onSubmit={handleCustomSubmit}
        />
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
