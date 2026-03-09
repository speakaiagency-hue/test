/**
 * API Key Rotator - Round-robin rotation with automatic fallback
 * Supports multiple API keys from environment variable
 */

class ApiKeyRotator {
  private keys: string[];
  private currentIndex: number = 0;
  private failedKeys: Set<string> = new Set();
  private lastResetTime: number = Date.now();
  private readonly RESET_INTERVAL = 60 * 60 * 1000; // Reset failed keys every hour

  constructor(keysEnvVar: string) {
    const keysString = process.env[keysEnvVar] || '';
    
    if (!keysString) {
      throw new Error(`Environment variable ${keysEnvVar} is not set`);
    }

    // Split by comma and trim whitespace
    this.keys = keysString
      .split(',')
      .map(key => key.trim())
      .filter(key => key.length > 0);

    if (this.keys.length === 0) {
      throw new Error(`No valid API keys found in ${keysEnvVar}`);
    }

    console.log(`✅ API Key Rotator initialized with ${this.keys.length} keys`);
  }

  /**
   * Get the next available API key (round-robin)
   */
  getApiKey(): string {
    this.resetFailedKeysIfNeeded();

    const availableKeys = this.keys.filter(key => !this.failedKeys.has(key));

    if (availableKeys.length === 0) {
      console.warn('⚠️ All API keys have failed, resetting failed keys list');
      this.failedKeys.clear();
      return this.keys[0];
    }

    // Find next available key
    let attempts = 0;
    while (attempts < this.keys.length) {
      const key = this.keys[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;

      if (!this.failedKeys.has(key)) {
        return key;
      }

      attempts++;
    }

    // Fallback to first key
    return this.keys[0];
  }

  /**
   * Mark a key as failed
   */
  markKeyAsFailed(key: string): void {
    this.failedKeys.add(key);
    console.warn(`❌ API key marked as failed (${this.failedKeys.size}/${this.keys.length} failed)`);
  }

  /**
   * Reset failed keys after interval
   */
  private resetFailedKeysIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastResetTime > this.RESET_INTERVAL) {
      console.log('🔄 Resetting failed API keys');
      this.failedKeys.clear();
      this.lastResetTime = now;
    }
  }

  /**
   * Get total number of keys
   */
  getTotalKeys(): number {
    return this.keys.length;
  }

  /**
   * Get number of available keys
   */
  getAvailableKeys(): number {
    return this.keys.length - this.failedKeys.size;
  }

  /**
   * Execute a function with automatic key rotation on failure
   */
  async executeWithRotation<T>(
    fn: (apiKey: string) => Promise<T>,
    maxRetries?: number
  ): Promise<T> {
    const retries = maxRetries || this.keys.length;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      const apiKey = this.getApiKey();

      try {
        const result = await fn(apiKey);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if it's an API key error (401, 403, 429)
        const errorMessage = lastError.message.toLowerCase();
        if (
          errorMessage.includes('401') ||
          errorMessage.includes('403') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('forbidden') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('rate limit')
        ) {
          console.warn(`⚠️ API key failed (attempt ${attempt + 1}/${retries}):`, errorMessage);
          this.markKeyAsFailed(apiKey);
          
          // Try next key
          continue;
        }

        // If it's not an API key error, throw immediately
        throw lastError;
      }
    }

    // All retries failed
    throw new Error(
      `All API keys failed after ${retries} attempts. Last error: ${lastError?.message}`
    );
  }
}

// Singleton instance for Gemini API keys
let geminiKeyRotator: ApiKeyRotator | null = null;

export function getGeminiKeyRotator(): ApiKeyRotator {
  if (!geminiKeyRotator) {
    geminiKeyRotator = new ApiKeyRotator('GEMINI_API_KEYS');
  }
  return geminiKeyRotator;
}

export { ApiKeyRotator };
