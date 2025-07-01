import { styles } from "@/styles/styles";
import React, { memo, ReactNode } from "react";
import { View, Text } from "react-native";

interface SectionContainerProps {
  title?: string;
  children: ReactNode;
  style?: object;
}

export const SectionContainer = memo(
  ({ title, children, style }: SectionContainerProps) => {
    return (
      <View style={[styles.section, style]}>
        {title && <Text style={styles.sectionTitle}>{title}</Text>}
        {children}
      </View>
    );
  },
);

SectionContainer.displayName = "SectionContainer";
