import WebSocket from 'ws';

export interface DebugTarget {
  id: string;
  title: string;
  description: string;
  webSocketDebuggerUrl: string;
  appId?: string;
}

interface ChromeDevToolsMessage {
  id: number;
  method: string;
  params?: any;
}

interface ChromeDevToolsResponse {
  id: number;
  result?: any;
  error?: any;
}

export class ReactNativeDebugClient {
  private ws: WebSocket | null = null;
  private messageId = 1;
  private pendingMessages = new Map<number, { resolve: (value: any) => void; reject: (error: any) => void }>();
  private isConnected = false;

  /**
   * Get list of available debug targets from Metro bundler
   */
  async getAvailableTargets(): Promise<DebugTarget[]> {
    // Try multiple times as sometimes the debugger targets take time to appear
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch('http://localhost:8081/json/list', {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get debug targets: ${response.status} ${response.statusText}`);
        }
        
        const targets = await response.json();
        
        if (!Array.isArray(targets)) {
          throw new Error('Invalid response format: expected array');
        }
        
        // If we got targets, return them
        if (targets.length > 0) {
          return targets;
        }
        
        // If no targets found, wait and retry (except on last attempt)
        if (i < maxRetries - 1) {
          console.log(`No debug targets found, retrying in 1 second... (attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        throw new Error('No React Native debug targets found. Make sure your app is running with remote debugging enabled.');
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (i < maxRetries - 1) {
          console.log(`Connection attempt ${i + 1} failed:`, error instanceof Error ? error.message : String(error));
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw lastError || new Error('Failed to connect to Metro debugger');
  }

  /**
   * Connect to a specific debug target via WebSocket
   */
  async connect(webSocketUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(webSocketUrl);
      
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout after 5 seconds'));
      }, 5000);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message: ChromeDevToolsResponse = JSON.parse(data.toString());
          
          if (message.id && this.pendingMessages.has(message.id)) {
            const { resolve: resolver, reject: rejecter } = this.pendingMessages.get(message.id)!;
            this.pendingMessages.delete(message.id);
            
            if (message.error) {
              rejecter(new Error(message.error.message || 'Unknown error'));
            } else {
              resolver(message);
            }
          }
        } catch (e) {
          // Ignore non-JSON messages (console logs, runtime events, etc.)
        }
      });

      this.ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Send a Chrome DevTools Protocol command
   */
  async sendCommand(method: string, params?: any): Promise<any> {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to debug target');
    }

    const id = this.messageId++;
    const message: ChromeDevToolsMessage = { id, method, params };

    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject });
      
      this.ws!.send(JSON.stringify(message));
      
      // 10 second timeout for responses
      const timeout = setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error(`Command timeout: ${method}`));
        }
      }, 10000);

      // Clear timeout when resolved
      const originalResolve = this.pendingMessages.get(id)?.resolve;
      const originalReject = this.pendingMessages.get(id)?.reject;
      
      if (originalResolve && originalReject) {
        this.pendingMessages.set(id, {
          resolve: (value) => {
            clearTimeout(timeout);
            originalResolve(value);
          },
          reject: (error) => {
            clearTimeout(timeout);
            originalReject(error);
          }
        });
      }
    });
  }

  /**
   * Evaluate JavaScript code on the React Native device
   */
  async evaluateJavaScript(expression: string): Promise<any> {
    const response = await this.sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    
    // Handle nested result structure (Metro/RN specific)
    const result = response.result?.result || response.result;
    
    if (response.result?.exceptionDetails) {
      const exception = response.result.exceptionDetails.exception;
      const errorMessage = exception?.description || response.result.exceptionDetails.text || 'Unknown error';
      throw new Error(`JavaScript execution failed: ${errorMessage}`);
    }
    
    // Return the actual value
    if (result?.value !== undefined) {
      return result.value;
    }
    
    // Handle object references and other types without returnByValue
    if (result?.type === 'object' && result?.description) {
      return result.description;
    }
    
    if (result?.type === 'number' && result?.description) {
      return Number(result.description);
    }
    
    if (result?.type === 'string' && result?.description) {
      return result.description;
    }
    
    if (result?.type === 'boolean' && result?.description) {
      return result.description === 'true';
    }
    
    return result;
  }

  /**
   * Enable Runtime domain for JavaScript evaluation
   */
  async enableRuntime(): Promise<void> {
    await this.sendCommand('Runtime.enable');
  }

  /**
   * Check if connected to debug target
   */
  isConnectedToTarget(): boolean {
    return this.isConnected && this.ws !== null;
  }

  /**
   * Disconnect from debug target
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
    this.pendingMessages.clear();
  }
}

/**
 * Helper function to connect to the first available React Native target
 */
export async function connectToFirstTarget(): Promise<ReactNativeDebugClient> {
  const client = new ReactNativeDebugClient();
  
  const targets = await client.getAvailableTargets();
  if (targets.length === 0) {
    throw new Error('No React Native debug targets found. Make sure your app is running.');
  }
  
  const target = targets[0];
  if (!target.webSocketDebuggerUrl) {
    throw new Error('Target has no WebSocket debugger URL');
  }
  
  await client.connect(target.webSocketDebuggerUrl);
  await client.enableRuntime();
  
  return client;
}

/**
 * Helper function to find a target by app ID
 */
export async function connectToTargetByAppId(appId: string): Promise<ReactNativeDebugClient> {
  const client = new ReactNativeDebugClient();
  
  const targets = await client.getAvailableTargets();
  const target = targets.find(t => t.appId === appId || t.title?.includes(appId));
  
  if (!target) {
    throw new Error(`No target found with app ID: ${appId}`);
  }
  
  if (!target.webSocketDebuggerUrl) {
    throw new Error('Target has no WebSocket debugger URL');
  }
  
  await client.connect(target.webSocketDebuggerUrl);
  await client.enableRuntime();
  
  return client;
}