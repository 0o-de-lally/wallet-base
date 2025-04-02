// Import test setup first
// import './setup';

describe('localStorage tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('should store and retrieve data', () => {
    localStorage.setItem('testKey', 'testValue');
    expect(localStorage.getItem('testKey')).toBe('testValue');
  });

  test('should remove data', () => {
    localStorage.setItem('testKey', 'testValue');
    localStorage.removeItem('testKey');
    expect(localStorage.getItem('testKey')).toBeNull();
  });
});
