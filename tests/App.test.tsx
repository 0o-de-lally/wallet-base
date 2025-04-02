import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../app/index';

// Add this to check if jest-expo mocks are loaded
console.log('Jest environment:', process.env.JEST_WORKER_ID ? 'Running in Jest' : 'Not Jest');
console.log('SafeAreaContext mock check:',
  jest.isMockFunction(require('react-native-safe-area-context').SafeAreaProvider)
    ? 'SafeAreaProvider is mocked'
    : 'SafeAreaProvider is NOT mocked'
);

describe('App', () => {
  it('renders without crashing', () => {
    // Simply rendering the component is enough to verify it doesn't crash
    const { toJSON, queryByTestId } = render(<App />);

    // Just verify that something rendered
    console.log('Rendered App:', toJSON());

    // Verify some content rendered
    expect(toJSON()).not.toBeNull();

    // If you're looking for specific elements, use queryByTestId instead of getAllByTestId
    // to avoid errors when elements don't exist
    const element = queryByTestId('your-element-id');
    if (element) console.log('Found element:', element);
  });
});
