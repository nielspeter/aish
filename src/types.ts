/**
 * Expected chat content type.
 *
 * @interface MessageContent
 */
export interface MessageContent {
  reasoning: string;
  conclusion: string;
  command?: string;
}

// Define the configuration type for the constructor
export interface ModelClientConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  providerPreferences?: OpenRouterProviderPreferences;
  temperature?: number; // Optional with a default value
  n?: number; // Optional with a default value
}

/**
 * Interface representing provider preferences for routing in OpenRouter.
 */
export interface OpenRouterProviderPreferences {
  /**
   * Whether to allow backup providers to serve requests.
   * - true: (default) Use backup providers if the primary provider is unavailable.
   * - false: Use only the primary provider and return an error if unavailable.
   */
  allow_fallbacks?: boolean | null;

  /**
   * Whether to filter providers to only those that support the parameters provided.
   * - true: Only use providers that support all parameters.
   * - false: Use providers that support some parameters (default behavior).
   */
  require_parameters?: boolean | null;

  /**
   * Data collection policy for the request.
   * - "allow": Allow providers which may store user data non-transiently and train on it.
   * - "deny": Use only providers that do not collect user data.
   */
  data_collection?: 'deny' | 'allow' | null;

  /**
   * An ordered list of provider names. The router will attempt to use providers in this order.
   * If no providers in this list are available, the request will fail.
   */
  order?:
    | (
        | 'OpenAI'
        | 'Anthropic'
        | 'Google'
        | 'Google AI Studio'
        | 'Amazon Bedrock'
        | 'Groq'
        | 'SambaNova'
        | 'Cohere'
        | 'Mistral'
        | 'Together'
        | 'Together 2'
        | 'Fireworks'
        | 'DeepInfra'
        | 'Lepton'
        | 'Novita'
        | 'Avian'
        | 'Lambda'
        | 'Azure'
        | 'Modal'
        | 'AnyScale'
        | 'Replicate'
        | 'Perplexity'
        | 'Recursal'
        | 'OctoAI'
        | 'DeepSeek'
        | 'Infermatic'
        | 'AI21'
        | 'Featherless'
        | 'Inflection'
        | 'xAI'
        | 'Cloudflare'
        | 'SF Compute'
        | '01.AI'
        | 'HuggingFace'
        | 'Mancer'
        | 'Mancer 2'
        | 'Hyperbolic'
        | 'Hyperbolic 2'
        | 'Lynn 2'
        | 'Lynn'
        | 'Reflection'
      )[]
    | null;

  /**
   * List of provider names to ignore. This is merged with account-wide ignored provider settings.
   */
  ignore?:
    | (
        | 'OpenAI'
        | 'Anthropic'
        | 'Google'
        | 'Google AI Studio'
        | 'Amazon Bedrock'
        | 'Groq'
        | 'SambaNova'
        | 'Cohere'
        | 'Mistral'
        | 'Together'
        | 'Together 2'
        | 'Fireworks'
        | 'DeepInfra'
        | 'Lepton'
        | 'Novita'
        | 'Avian'
        | 'Lambda'
        | 'Azure'
        | 'Modal'
        | 'AnyScale'
        | 'Replicate'
        | 'Perplexity'
        | 'Recursal'
        | 'OctoAI'
        | 'DeepSeek'
        | 'Infermatic'
        | 'AI21'
        | 'Featherless'
        | 'Inflection'
        | 'xAI'
        | 'Cloudflare'
        | 'SF Compute'
        | '01.AI'
        | 'HuggingFace'
        | 'Mancer'
        | 'Mancer 2'
        | 'Hyperbolic'
        | 'Hyperbolic 2'
        | 'Lynn 2'
        | 'Lynn'
        | 'Reflection'
      )[]
    | null;

  /**
   * A list of quantization levels to filter providers by.
   */
  quantizations?: ('int4' | 'int8' | 'fp6' | 'fp8' | 'fp16' | 'bf16' | 'unknown')[] | null;
}
