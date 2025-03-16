import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ChainName } from '../types/networkTypes';
import { NetworkConfigGenerator } from '../util/networkSettings';

export default function NetworkSelector() {
  const [selectedNetwork, setPickerValue] = useState<ChainName>(ChainName.MAINNET);

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedNetwork}
        onValueChange={async (value: ChainName) => {
          console.log('Selected network:', value);
          setPickerValue(value);
          const networkConfig = NetworkConfigGenerator.generateConfig(value);
          await NetworkConfigGenerator.saveConfig(networkConfig);
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
