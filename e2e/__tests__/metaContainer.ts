import { noop } from '../../util/noop';
import { LOCAL_TESTNET_API, testnetDown, testnetUp } from 'open-libra-sdk';
import axios from 'axios';

beforeEach(async () => {
  try {
    console.log("testnet setup");
    console.log(LOCAL_TESTNET_API);
    await testnetDown();
    await testnetUp();
  } catch (error) {
    console.error("Failed to setup testnet:", error);
    throw error;
  }
}, 60 * 1000); // 60 second timeout

afterEach(async () => {
  console.log("testnet teardown");
  await testnetDown();
}, 60 * 1000); // 60 second timeout

describe('noop', () => {
  it('should return true', () => {
    expect(noop()).toBe(true)
  })
})

describe('LOCAL_TESTNET_API', () => {
  it('should respond to a GET request', async () => {
    try {
      const response = await axios.get(LOCAL_TESTNET_API);
      expect(response.status).toBe(200);
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  });
});
