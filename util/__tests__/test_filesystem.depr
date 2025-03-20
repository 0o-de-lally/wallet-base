// import * as FileSystem from 'expo-file-system';
import { ensureConfigDirectory, getConfigFilePath, readObjectFromConfigPath, saveObjectToConfigPath } from '../fileSystem';

describe('Expo FileSystem Basics', () => {
  it('should handle directory creation', async () => {

    const a = await getConfigFilePath();
    console.log(a);
    await ensureConfigDirectory();

    await saveObjectToConfigPath('test.json', { test: "test"});
    const b = await readObjectFromConfigPath('test.json');
    console.log(b)
  });

});
