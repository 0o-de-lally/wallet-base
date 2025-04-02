import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { device, element, by } from 'detox';
import CameraComponent from '../../src/components/CameraComponent';

// Bun's test API is compatible with Jest
describe('CameraComponent', () => {
  it('should access the camera when button is pressed', async () => {
    // This test will run on a real device/simulator
    await device.reloadReactNative();

    // Render the component in the test app
    render(<CameraComponent />);

    // Find and press the camera button
    const cameraButton = await element(by.id('open-camera-button'));
    await cameraButton.tap();

    // Check that camera permission dialog appears (on real device)
    await waitFor(element(by.text('Allow Camera Access')))
      .toBeVisible()
      .withTimeout(2000);

    // Test passed if we get this far without errors
  });

  it('should capture a photo and return image data', async () => {
    render(<CameraComponent />);

    const captureButton = await element(by.id('capture-photo-button'));
    await captureButton.tap();

    // Verify we got image data back (component-specific assertion)
    const photoPreview = await element(by.id('photo-preview'));
    await expect(photoPreview).toBeVisible();
  });
});
