import { noop } from '../../util/noop';
import { LOCAL_TESTNET_API, testnetDown, testnetUp } from 'open-libra-sdk';
import axios from 'axios';

beforeEach(async () => {
  console.log("testnet setup");
  console.log(LOCAL_TESTNET_API);
  // make sure we teardown any zombies first
  await testnetDown();
  await testnetUp();
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
    const response = await axios.get(LOCAL_TESTNET_API);
    expect(response.status).toBe(200);
  });
});
