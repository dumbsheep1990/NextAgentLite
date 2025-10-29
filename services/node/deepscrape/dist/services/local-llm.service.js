"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalLLMService = void 0;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../utils/logger");
/**
 * Service for interacting with local LLM servers via OpenAI-compatible API
 */
class LocalLLMService {
    constructor(config) {
        this.config = config;
        // Initialize OpenAI client with custom base URL
        this.client = new openai_1.default({
            apiKey: config.apiKey || 'dummy-key', // Some local servers don't need real keys
            baseURL: config.baseUrl,
            timeout: config.timeout || 120000, // 2 minutes default for local models
            maxRetries: config.maxRetries || 3,
            defaultHeaders: this.getProviderHeaders(config),
        });
        logger_1.logger.info(`Initialized ${config.provider} LLM service`, {
            provider: config.provider,
            baseUrl: config.baseUrl,
            model: config.model
        });
    }
    /**
     * Get provider-specific headers
     */
    getProviderHeaders(config) {
        const headers = {};
        switch (config.provider) {
            case 'vllm':
                // vLLM specific headers
                if (process.env.VLLM_API_KEY) {
                    headers['Authorization'] = `Bearer ${process.env.VLLM_API_KEY}`;
                }
                break;
            case 'litellm':
                // LiteLLM requires specific auth header format
                if (config.apiKey) {
                    headers['Authorization'] = `Bearer ${config.apiKey}`;
                }
                break;
            case 'localai':
                // LocalAI can use API key in header
                if (config.apiKey && config.apiKey !== 'dummy-key') {
                    headers['x-api-key'] = config.apiKey;
                }
                break;
            case 'ollama':
                // Ollama doesn't require auth by default
                break;
            case 'custom':
                // Custom providers might need specific headers
                if (process.env.CUSTOM_LLM_AUTH_HEADER) {
                    headers[process.env.CUSTOM_LLM_AUTH_HEADER] = config.apiKey;
                }
                break;
        }
        return headers;
    }
    /**
     * Get the provider type
     */
    getProvider() {
        return this.config.provider;
    }
    /**
     * Get the current model
     */
    getModel() {
        return this.config.model;
    }
    /**
     * Convert our message format to OpenAI's format
     */
    convertMessages(messages) {
        return messages.map(msg => {
            // Handle different message roles
            if (msg.role === 'system') {
                return { role: 'system', content: msg.content };
            }
            else if (msg.role === 'user') {
                return { role: 'user', content: msg.content };
            }
            else if (msg.role === 'assistant') {
                return { role: 'assistant', content: msg.content };
            }
            else {
                // For function/tool roles, default to user for compatibility
                return { role: 'user', content: msg.content };
            }
        });
    }
    /**
     * Build request parameters for chat completion
     */
    buildRequestParams(messages, options, responseFormat) {
        const requestParams = {
            model: this.getModelName(),
            messages,
            temperature: options.temperature ?? 0.2,
            max_tokens: options.maxTokens ?? 4000,
            top_p: options.topP,
            frequency_penalty: options.frequencyPenalty,
            presence_penalty: options.presencePenalty,
            stop: options.stop,
            seed: options.seed,
            user: options.user,
        };
        // Add response format only if supported by provider
        if (this.supportsResponseFormat() && responseFormat) {
            requestParams.response_format = responseFormat;
        }
        // Disable thinking mode for Qwen models
        if (this.isQwenModel()) {
            logger_1.logger.debug('Detected Qwen model, attempting to disable thinking mode');
            requestParams.extra_body = {
                chat_template_kwargs: { enable_thinking: false }
            };
        }
        return requestParams;
    }
    /**
     * Process and parse response content
     */
    processResponseContent(content) {
        if (!content) {
            return content;
        }
        // Clean thinking tags from Qwen models as a fallback
        if (this.isQwenModel() && content.includes('<think>')) {
            logger_1.logger.debug('Cleaning thinking tags from Qwen response');
            content = this.cleanThinkingTags(content);
        }
        // Parse JSON if expected
        try {
            return typeof content === 'string' && content.trim().startsWith('{')
                ? JSON.parse(content)
                : content;
        }
        catch (parseError) {
            logger_1.logger.debug('Response is not JSON, returning as-is', {
                error: parseError instanceof Error ? parseError.message : String(parseError)
            });
            return content;
        }
    }
    /**
     * Build error message based on error type
     */
    buildErrorMessage(error) {
        let errorMessage = `${this.config.provider} error: `;
        if (error instanceof Error) {
            if (error.message.includes('ECONNREFUSED')) {
                errorMessage += `Cannot connect to ${this.config.baseUrl}. Make sure the ${this.config.provider} server is running.`;
            }
            else if (error.message.includes('404')) {
                errorMessage += `Model ${this.config.model} not found. Check available models.`;
            }
            else if (error.message.includes('timeout')) {
                errorMessage += 'Request timed out. Try increasing LLM_TIMEOUT.';
            }
            else {
                errorMessage += error.message;
            }
        }
        else {
            errorMessage += String(error);
        }
        return errorMessage;
    }
    /**
     * Get a completion from the local LLM
     */
    async getCompletion(messages, options = {}, responseFormat) {
        try {
            const startTime = Date.now();
            logger_1.logger.debug(`Sending request to ${this.config.provider}`, {
                model: this.config.model,
                messageCount: messages.length,
                temperature: options.temperature
            });
            // Convert messages to OpenAI format
            const typedMessages = this.convertMessages(messages);
            // Build request parameters
            const requestParams = this.buildRequestParams(typedMessages, options, responseFormat);
            // Make the API call
            const response = await this.client.chat.completions.create(requestParams);
            const latency = Date.now() - startTime;
            const content = response.choices[0].message.content;
            logger_1.logger.debug(`Received response from ${this.config.provider}`, {
                model: response.model,
                latency,
                tokensUsed: response.usage?.total_tokens
            });
            // Process the response content
            const parsedContent = this.processResponseContent(content);
            return {
                success: true,
                data: parsedContent,
                metadata: {
                    model: response.model,
                    provider: this.config.provider,
                    usage: response.usage ? {
                        promptTokens: response.usage.prompt_tokens,
                        completionTokens: response.usage.completion_tokens,
                        totalTokens: response.usage.total_tokens,
                    } : undefined,
                    latency,
                },
            };
        }
        catch (error) {
            logger_1.logger.error(`${this.config.provider} completion error`, {
                error: error instanceof Error ? error.message : String(error),
                model: this.config.model
            });
            return {
                success: false,
                error: this.buildErrorMessage(error),
            };
        }
    }
    /**
     * Get embeddings for text
     */
    async getEmbeddings(text) {
        try {
            const inputArray = Array.isArray(text) ? text : [text];
            logger_1.logger.debug(`Getting embeddings from ${this.config.provider}`, {
                inputCount: inputArray.length
            });
            // Note: Not all local servers support embeddings
            // You may need to use a specific embedding model
            const response = await this.client.embeddings.create({
                model: this.config.model, // Provider may need specific embedding model
                input: inputArray,
            });
            const embeddings = response.data.map(item => item.embedding);
            return {
                success: true,
                data: embeddings,
                metadata: {
                    model: response.model,
                    provider: this.config.provider,
                    usage: response.usage ? {
                        promptTokens: response.usage.prompt_tokens,
                        completionTokens: 0,
                        totalTokens: response.usage.total_tokens,
                    } : undefined,
                },
            };
        }
        catch (error) {
            logger_1.logger.error(`${this.config.provider} embeddings error`, {
                error: error instanceof Error ? error.message : String(error)
            });
            // Many local servers don't support embeddings
            let errorMessage = `${this.config.provider} embeddings error: `;
            if (error instanceof Error && error.message.includes('404')) {
                errorMessage += 'Embeddings endpoint not supported by this provider.';
            }
            else {
                errorMessage += error instanceof Error ? error.message : String(error);
            }
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * List available models
     */
    async listModels() {
        try {
            logger_1.logger.debug(`Listing models from ${this.config.provider}`);
            const response = await this.client.models.list();
            const models = response.data.map(model => model.id);
            logger_1.logger.info(`Found ${models.length} models on ${this.config.provider}`, { models });
            return models;
        }
        catch (error) {
            logger_1.logger.warn(`Failed to list models from ${this.config.provider}`, {
                error: error instanceof Error ? error.message : String(error)
            });
            // Return empty array if listing fails (not all providers support this)
            return [];
        }
    }
    /**
     * Check if the service is healthy
     */
    async healthCheck() {
        try {
            logger_1.logger.debug(`Checking health of ${this.config.provider} at ${this.config.baseUrl}`);
            // Try to list models as a health check
            await this.client.models.list();
            logger_1.logger.info(`${this.config.provider} is healthy`);
            return true;
        }
        catch (error) {
            logger_1.logger.warn(`${this.config.provider} health check failed`, {
                error: error instanceof Error ? error.message : String(error),
                baseUrl: this.config.baseUrl
            });
            return false;
        }
    }
    /**
     * Get provider-specific information
     */
    getProviderInfo() {
        return {
            name: this.config.provider,
            baseUrl: this.config.baseUrl || 'Not configured',
            model: this.config.model,
        };
    }
    /**
     * Get the model name with provider-specific formatting
     */
    getModelName() {
        // Some providers require specific model name formats
        switch (this.config.provider) {
            case 'ollama':
                // Ollama uses model names without org prefix
                return this.config.model.split('/').pop() || this.config.model;
            case 'litellm':
                // LiteLLM can route to multiple providers, use as-is
                return this.config.model;
            default:
                return this.config.model;
        }
    }
    /**
     * Check if provider supports response_format parameter
     */
    supportsResponseFormat() {
        // Not all providers support structured output format
        switch (this.config.provider) {
            case 'vllm':
            case 'litellm':
                return true;
            case 'ollama':
            case 'localai':
                // These providers might not support response_format
                return false;
            case 'custom':
                // Check env variable for custom provider capability
                return process.env.CUSTOM_LLM_SUPPORTS_JSON === 'true';
            default:
                return false;
        }
    }
    /**
     * Check if the current model is a Qwen model
     */
    isQwenModel() {
        const modelName = this.config.model.toLowerCase();
        return modelName.includes('qwen') || modelName.includes('qwq');
    }
    /**
     * Clean response content by removing thinking tags
     */
    cleanThinkingTags(content) {
        if (!content)
            return content;
        // Remove <think>...</think> blocks completely
        const cleaned = content.replace(/<think>[\s\S]*?<\/think>\s*/gi, '');
        // Log if we removed significant content
        if (cleaned.length < content.length * 0.5) {
            logger_1.logger.warn(`Removed ${Math.round((1 - cleaned.length / content.length) * 100)}% of content as thinking tags`);
        }
        return cleaned.trim();
    }
}
exports.LocalLLMService = LocalLLMService;
