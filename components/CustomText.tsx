import { Text, TextStyle} from 'react-native';
import React from 'react';

interface CustomTextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}

export const CustomText: React.FC<CustomTextProps> = ({ children, style }) => {
  return <Text style={style}>{children}</Text>;
};
