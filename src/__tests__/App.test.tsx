import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../../app/index';

describe('App', () => {
  it('renders PIN Management button', () => {
    const { getByText } = render(<App />);
    expect(getByText('PIN Management')).toBeTruthy();
  });
});
