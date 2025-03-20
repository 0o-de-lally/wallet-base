import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ErrorLogger } from '@/util/errorLogging';
import { sharedStyles } from '@/styles/shared';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    ErrorLogger.logError(error, {
      componentStack: errorInfo.componentStack
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={[sharedStyles.container, { justifyContent: 'center' }]}>
          <Text style={sharedStyles.heading}>Something went wrong</Text>
          <Text style={sharedStyles.text}>{this.state.error?.message}</Text>
          <TouchableOpacity
            style={sharedStyles.button}
            onPress={this.handleRetry}
          >
            <Text style={sharedStyles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
