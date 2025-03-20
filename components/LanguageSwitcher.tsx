import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { sharedStyles } from '@/styles/shared';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' }
  ];

  return (
    <View style={[sharedStyles.row, { justifyContent: 'center' }]}>
      {languages.map(lang => (
        <TouchableOpacity
          key={lang.code}
          style={[
            sharedStyles.button,
            {
              backgroundColor: i18n.language === lang.code ? '#004999' : '#007AFF',
              marginHorizontal: 4
            }
          ]}
          onPress={() => i18n.changeLanguage(lang.code)}
        >
          <Text style={sharedStyles.buttonText}>{lang.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
