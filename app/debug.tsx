import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { observer } from '@legendapp/state/react';
import { ErrorLogger, errorStore$ } from '@/util/errorLogging';
import { sharedStyles } from '@/styles/shared';

export default observer(function DebugScreen() {
  const logs = errorStore$.logs.get();

  const handleExport = async () => {
    try {
      await ErrorLogger.exportLogs();
    } catch (error) {
      console.error('Failed to export:', error);
      ErrorLogger.logError(error);
    }
  };

  const handleClear = () => {
    ErrorLogger.clearLogs();
  };

  return (
    <View style={sharedStyles.container}>
      <View style={sharedStyles.row}>
        <TouchableOpacity style={sharedStyles.button} onPress={handleExport}>
          <Text style={sharedStyles.buttonText}>Export Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={sharedStyles.button} onPress={handleClear}>
          <Text style={sharedStyles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {logs.map((log) => (
          <View key={log.id} style={sharedStyles.card}>
            <Text style={sharedStyles.heading}>{log.message}</Text>
            <Text style={sharedStyles.label}>{log.timestamp}</Text>
            {log.stack && (
              <Text style={[sharedStyles.text, { fontSize: 12 }]}>{log.stack}</Text>
            )}
            {log.metadata && (
              <Text style={sharedStyles.text}>
                {JSON.stringify(log.metadata, null, 2)}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
});
