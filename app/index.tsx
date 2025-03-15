import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';


export const CustomText = ({ children }: PropsWithChildren) => <Text>{children}</Text>;

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <CustomText>Welcome!</CustomText>
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
