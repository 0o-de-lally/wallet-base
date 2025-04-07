import { styles } from "@/styles/styles";
import React, { memo, ReactNode } from "react";
import { View, Text } from "react-native";

interface SectionContainerProps {
  title?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}

export const SectionContainer = memo(
  ({ title, children }: SectionContainerProps) => {
    return (
      <View style={[styles.section]}>
        {title && <Text style={styles.sectionTitle}>{title}</Text>}
        {children}
      </View>
    );
  },
);

SectionContainer.displayName = "SectionContainer";
