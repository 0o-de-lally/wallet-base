import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../app/index';

describe('App', () => {
  it('renders home', () => {
    const { getByText } = render(<App />);
    expect(getByText('PIN-Protected Storage')).toBeTruthy();
  });
});
