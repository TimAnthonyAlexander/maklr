<?php

declare(strict_types=1);

namespace App\Services;

use CurlHandle;
use Generator;
use RuntimeException;
use Throwable;
use App\Models\ApiCost;

ini_set('max_execution_time', '-1'); // Disable max execution time limit for long-running requests

/**
 * OpenAI Responses API Client
 * Correct implementation following official Responses API spec
 */
final class OpenAIService
{
    private const string API_ENDPOINT = 'https://api.openai.com/v1/responses';

    private string $apiKey;

    private array $options = [];

    private ?string $serviceType = null;

    private ?string $userId = null;

    public function __construct(
        ?string $apiKey = null,
        private string $model = 'gpt-4.1',
        private ?string $baseUrl = null,
    ) {
        $this->apiKey = $apiKey ?? $_ENV['OPENAI_API_KEY'] ?? $_SERVER['OPENAI_API_KEY'] ?? getenv('OPENAI_API_KEY');

        if ($this->apiKey === '') {
            throw new RuntimeException('OpenAI API key required');
        }
    }

    /**
     * Enable cost tracking for this request
     *
     * @param string $service Service type (e.g., 'explanation', 'course_generation', 'image_generation')
     * @param ?string $userId Optional user ID for attribution
     */
    public function withService(string $service, ?string $userId = null): self
    {
        $clone = clone $this;
        $clone->serviceType = $service;
        $clone->userId = $userId;
        return $clone;
    }

    /**
     * Set the model to use
     */
    public function model(string $model): self
    {
        $clone = clone $this;
        $clone->model = $model;
        return $clone;
    }

    /**
     * Set system instructions
     */
    public function withInstructions(string $instructions): self
    {
        $clone = clone $this;
        $clone->options['instructions'] = $instructions;
        return $clone;
    }

    /**
     * Register function tools
     */
    public function withTools(array $tools, string|array $toolChoice = 'auto', ?bool $parallelToolCalls = null): self
    {
        $clone = clone $this;
        $clone->options['tools'] = $tools;
        $clone->options['tool_choice'] = $toolChoice;
        if ($parallelToolCalls !== null) {
            $clone->options['parallel_tool_calls'] = $parallelToolCalls;
        }

        return $clone;
    }

    /**
     * Set sampling parameters
     */
    public function withSampling(?float $temperature = null, ?float $topP = null): self
    {
        $clone = clone $this;
        if ($temperature !== null) {
            $clone->options['temperature'] = $temperature;
        }

        if ($topP !== null) {
            $clone->options['top_p'] = $topP;
        }

        return $clone;
    }

    /**
     * Set output limits
     */
    public function withLimits(?int $maxOutputTokens = null, ?string $truncation = null): self
    {
        $clone = clone $this;
        if ($maxOutputTokens !== null) {
            $clone->options['max_output_tokens'] = $maxOutputTokens;
        }

        if ($truncation !== null) {
            $clone->options['truncation'] = $truncation;
        }

        return $clone;
    }

    /**
     * Set reasoning effort
     */
    public function withReasoning(?string $effort = null): self
    {
        $clone = clone $this;
        if ($effort !== null) {
            $clone->options['reasoning'] = ['effort' => $effort];
        }

        return $clone;
    }

    /**
     * Set response format with JSON schema
     */
    public function withResponseFormatJsonSchema(string $name, array $schema, bool $strict = true): self
    {
        $clone = clone $this;
        $clone->options['text'] = [
            'format' => [
                'type' => 'json_schema',
                'name' => $name,
                'strict' => $strict,
                'schema' => $schema,
            ],
        ];
        return $clone;
    }

    /**
     * Attach request metadata
     */
    public function withMetadata(array $metadata): self
    {
        $clone = clone $this;
        $clone->options['metadata'] = $metadata;
        return $clone;
    }

    /**
     * Set user identifier
     */
    public function withUser(?string $userIdOrHash): self
    {
        $clone = clone $this;
        if ($userIdOrHash !== null) {
            $clone->options['user'] = $userIdOrHash;
        }

        return $clone;
    }

    /**
     * Enable storing the response for later retrieval
     */
    public function withStore(bool $store = true): self
    {
        $clone = clone $this;
        $clone->options['store'] = $store;
        return $clone;
    }

    /**
     * One-shot request
     */
    public function create(array|string $input, array $extra = []): array
    {
        $payload = $this->buildPayload($input, $extra);
        return $this->request($payload);
    }

    /**
     * Get path for cache file, ensuring directory exists
     */
    private function getCachePath(string $hash): string
    {
        $dir = __DIR__ . '/../../storage/openai_cache';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        return $dir . '/' . $hash . '.json';
    }

    /**
     * Recursively sort array by key
     */
    private function recursiveKsort(array &$array): void
    {
        foreach ($array as &$value) {
            if (is_array($value)) {
                $this->recursiveKsort($value);
            }
        }

        ksort($array);
    }

    /**
     * Continue conversation using previous_response_id
     */
    public function continue(string $previousResponseId, array|string $newInput, array $extra = []): array
    {
        $extra['previous_response_id'] = $previousResponseId;
        $payload = $this->buildPayload($newInput, $extra);
        return $this->request($payload);
    }

    /**
     * Submit tool result and continue
     */
    public function continueWithToolResult(
        string $previousResponseId,
        string $callId,
        string $toolName,
        string|array $toolOutput,
        array $extra = []
    ): array {
        // Build function_call_output item (NOT role:tool)
        $functionCallOutput = [
            'type' => 'function_call_output',
            'call_id' => $callId,
            'output' => is_string($toolOutput) ? $toolOutput : json_encode($toolOutput),
        ];

        $extra['previous_response_id'] = $previousResponseId;
        $payload = $this->buildPayload([$functionCallOutput], $extra);
        return $this->request($payload);
    }

    /**
     * Raw SSE event stream
     */
    public function stream(array|string $input, array $extra = []): Generator
    {
        $extra['stream'] = true;
        $payload = $this->buildPayload($input, $extra);

        $curlHandle = $this->buildCurlHandle($payload, true);

        $sink = fopen('php://temp', 'w+');
        if ($sink === false) {
            throw new RuntimeException('Failed to open temp stream');
        }

        curl_setopt($curlHandle, CURLOPT_RETURNTRANSFER, false);
        curl_setopt($curlHandle, CURLOPT_FILE, $sink);

        $curlMultiHandle = curl_multi_init();
        curl_multi_add_handle($curlMultiHandle, $curlHandle);

        $buffer = '';
        $readPos = 0;
        $running = 0;

        do {
            $status = curl_multi_exec($curlMultiHandle, $running);
            if ($status === CURLM_OK) {
                curl_multi_select($curlMultiHandle, 0.01);
            }

            fflush($sink);
            $chunk = stream_get_contents($sink, -1, $readPos);
            if ($chunk !== false && $chunk !== '') {
                $readPos += strlen($chunk);
                $buffer .= $chunk;

                while (($pos = strpos($buffer, "\n")) !== false) {
                    $line = rtrim(substr($buffer, 0, $pos), "\r");
                    $buffer = substr($buffer, $pos + 1);

                    if (!str_starts_with($line, 'data: ')) {
                        continue;
                    }

                    $json = substr($line, 6);
                    if ($json === '[DONE]') {
                        continue;
                    }

                    $decoded = json_decode($json, true);
                    if (is_array($decoded)) {
                        yield $decoded;
                    }
                }
            }
        } while ($running > 0);

        // Flush any trailing buffer
        if ($buffer !== '') {
            $line = rtrim($buffer, "\r");
            if (str_starts_with($line, 'data: ')) {
                $json = substr($line, 6);
                if ($json !== '[DONE]') {
                    $decoded = json_decode($json, true);
                    if (is_array($decoded)) {
                        yield $decoded;
                    }
                }
            }
        }

        $httpCode = curl_getinfo($curlHandle, CURLINFO_HTTP_CODE);

        if ($httpCode >= 400) {
            rewind($sink);
            $errorBody = stream_get_contents($sink);
            curl_multi_remove_handle($curlMultiHandle, $curlHandle);
            curl_multi_close($curlMultiHandle);
            curl_close($curlHandle);
            fclose($sink);

            $errorMessage = 'HTTP ' . $httpCode;
            if ($errorBody !== false) {
                $errorData = json_decode($errorBody, true);
                if (is_array($errorData) && isset($errorData['error']['message'])) {
                    $errorMessage = $errorData['error']['message'];
                }
            }

            throw new RuntimeException('OpenAI API error: ' . $errorMessage);
        }

        curl_multi_remove_handle($curlMultiHandle, $curlHandle);
        curl_multi_close($curlMultiHandle);
        curl_close($curlHandle);
        fclose($sink);
    }

    /**
     * Convenience streaming with delta callbacks
     */
    public function streamDeltas(
        array|string $input,
        ?callable $onTextDelta = null,
        ?callable $onToolCallDelta = null,
        ?callable $onEvent = null,
        array $extra = []
    ): void {
        $toolCallBuffers = []; // call_id => ['name' => '', 'arguments' => '', 'finalized' => false]

        foreach ($this->stream($input, $extra) as $event) {
            $type = $event['type'] ?? '';

            // Call general event handler
            if ($onEvent !== null) {
                $onEvent($event);
            }

            // Handle text deltas
            if ($type === 'response.output_text.delta') {
                $delta = $event['delta'] ?? '';
                if ($delta !== '' && $onTextDelta !== null) {
                    $onTextDelta($delta);
                }
            }

            // Handle output_item.added - announces function calls with name and call_id
            if ($type === 'response.output_item.added') {
                $item = $event['item'] ?? [];
                if (($item['type'] ?? '') === 'function_call') {
                    $callId = $item['call_id'] ?? '';
                    $name = $item['name'] ?? '';
                    if ($callId !== '') {
                        $toolCallBuffers[$callId] = [
                            'name' => $name,
                            'arguments' => '',
                            'finalized' => false,
                        ];
                    }
                }
            }

            // Handle function call arguments deltas
            if ($type === 'response.function_call_arguments.delta') {
                $callId = $event['call_id'] ?? '';
                if ($callId !== '') {
                    if (!isset($toolCallBuffers[$callId])) {
                        $toolCallBuffers[$callId] = ['name' => '', 'arguments' => '', 'finalized' => false];
                    }

                    if (isset($event['name'])) {
                        $toolCallBuffers[$callId]['name'] = $event['name'];
                    }

                    if (isset($event['arguments'])) {
                        $toolCallBuffers[$callId]['arguments'] .= $event['arguments'];
                    }

                    if ($onToolCallDelta !== null) {
                        $onToolCallDelta([
                            'call_id' => $callId,
                            'name' => $toolCallBuffers[$callId]['name'],
                            'arguments_partial' => $toolCallBuffers[$callId]['arguments'],
                        ]);
                    }
                }
            }

            // Handle completed function calls via arguments.done
            if ($type === 'response.function_call_arguments.done') {
                $callId = $event['call_id'] ?? '';
                if ($callId !== '' && isset($toolCallBuffers[$callId]) && !$toolCallBuffers[$callId]['finalized']) {
                    $name = $toolCallBuffers[$callId]['name'];
                    $argsJson = $toolCallBuffers[$callId]['arguments'];
                    $arguments = json_decode($argsJson, true) ?? [];

                    $toolCallBuffers[$callId]['finalized'] = true;

                    if ($onToolCallDelta !== null) {
                        $onToolCallDelta([
                            'call_id' => $callId,
                            'name' => $name,
                            'arguments' => $arguments,
                            'done' => true,
                        ]);
                    }
                }
            }

            // Handle output_item.done - finalize function calls if not already done
            if ($type === 'response.output_item.done') {
                $item = $event['item'] ?? [];
                if (($item['type'] ?? '') === 'function_call') {
                    $callId = $item['call_id'] ?? '';
                    if ($callId !== '' && isset($toolCallBuffers[$callId]) && !$toolCallBuffers[$callId]['finalized']) {
                        $name = $toolCallBuffers[$callId]['name'];
                        $argsJson = $item['arguments'] ?? $toolCallBuffers[$callId]['arguments'];

                        // Arguments might be in the item itself
                        $arguments = is_string($argsJson) ? json_decode($argsJson, true) ?? [] : $argsJson;

                        $toolCallBuffers[$callId]['finalized'] = true;

                        if ($onToolCallDelta !== null) {
                            $onToolCallDelta([
                                'call_id' => $callId,
                                'name' => $name,
                                'arguments' => $arguments,
                                'done' => true,
                            ]);
                        }
                    }
                }
            }
        }
    }

    /**
     * Retrieve a completed response
     */
    public function retrieve(string $responseId): array
    {
        $endpoint = ($this->baseUrl ?? self::API_ENDPOINT) . '/' . $responseId;
        $ch = curl_init($endpoint);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 400 || !is_string($response)) {
            throw new RuntimeException('Failed to retrieve response: HTTP ' . $httpCode);
        }

        return json_decode($response, true) ?? [];
    }

    /**
     * Cancel a response
     */
    public function cancel(string $responseId): array
    {
        $endpoint = ($this->baseUrl ?? self::API_ENDPOINT) . '/' . $responseId . '/cancel';
        $ch = curl_init($endpoint);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 400 || !is_string($response)) {
            throw new RuntimeException('Failed to cancel response: HTTP ' . $httpCode);
        }

        return json_decode($response, true) ?? [];
    }

    /**
     * Extract text from response (concatenate all output_text parts)
     */
    public static function extractText(array $response): string
    {
        $texts = [];

        // Scan response.output for message items with output_text content
        foreach ($response['output'] ?? [] as $item) {
            $itemType = $item['type'] ?? null;

            // Look for message items
            if ($itemType === 'message') {
                foreach ($item['content'] ?? [] as $part) {
                    if (($part['type'] ?? null) === 'output_text') {
                        $text = $part['text'] ?? '';
                        if ($text !== '') {
                            $texts[] = $text;
                        }
                    }
                }
            }
        }

        return implode('', $texts);
    }

    /**
     * Extract tool calls from response (correct type: function_call)
     */
    public static function extractToolCalls(array $response): array
    {
        $tools = [];
        foreach ($response['output'] ?? [] as $item) {
            if (($item['type'] ?? null) === 'function_call') {
                $arguments = $item['arguments'] ?? [];

                // Parse arguments if string
                if (is_string($arguments)) {
                    $arguments = json_decode($arguments, true) ?? [];
                }

                $tools[] = [
                    'call_id' => $item['call_id'] ?? '',
                    'name' => $item['name'] ?? '',
                    'arguments' => $arguments,
                ];
            }
        }

        return $tools;
    }

    /**
     * Check if response has tool calls
     */
    public static function hasMoreToolWork(array $response): bool
    {
        return self::extractToolCalls($response) !== [];
    }

    /**
     * Check if the model is a reasoning model (o-series or gpt-5)
     */
    private function isReasoningModel(string $model): bool
    {
        // Reasoning models start with "o" (e.g., o1, o3, o1-mini) or "gpt-5" (e.g., gpt-5-mini)
        return str_starts_with($model, 'o') || str_starts_with($model, 'gpt-5');
    }

    /**
     * Build request payload
     */
    private function buildPayload(array|string $input, array $extra): array
    {
        $payload = array_merge(
            ['model' => $this->model],
            $this->options,
            $extra
        );

        // Remove temperature for reasoning models (they don't support it)
        if ($this->isReasoningModel($this->model)) {
            unset($payload['temperature']);
        }

        // Normalize input
        if (is_string($input)) {
            $payload['input'] = [
                [
                    'role' => 'user',
                    'content' => [
                        ['type' => 'input_text', 'text' => $input],
                    ],
                ],
            ];
        } elseif (is_array($input)) {
            $payload['input'] = $this->normalizeInput($input);
        }

        return $payload;
    }

    /**
     * Normalize input messages/items to Responses format
     */
    private function normalizeInput(array $input): array
    {
        $normalized = [];

        foreach ($input as $item) {
            // If it's a function_call_output item, keep it as-is
            if (isset($item['type']) && $item['type'] === 'function_call_output') {
                $normalized[] = $item;
                continue;
            }

            // If already in Responses format with role + content, process it
            if (isset($item['role']) && isset($item['content'])) {
                $role = $item['role'];
                $content = $item['content'];

                if ($role === 'system') {
                    // System messages go in instructions, skip
                    continue;
                }

                // Normalize content to proper parts
                if (is_string($content)) {
                    $contentType = $role === 'assistant' ? 'output_text' : 'input_text';
                    $normalized[] = [
                        'role' => $role === 'assistant' ? 'assistant' : 'user',
                        'content' => [
                            ['type' => $contentType, 'text' => $content],
                        ],
                    ];
                } elseif (is_array($content)) {
                    // Content is already an array of parts
                    $contentType = $role === 'assistant' ? 'output_text' : 'input_text';
                    $parts = [];

                    foreach ($content as $part) {
                        if (isset($part['type'])) {
                            // Normalize text types to correct input_text/output_text
                            if ($part['type'] === 'text' && isset($part['text'])) {
                                $parts[] = ['type' => $contentType, 'text' => $part['text']];
                            } elseif ($part['type'] === 'input_text' || $part['type'] === 'output_text') {
                                // Already correct, but enforce the right type based on role
                                $parts[] = ['type' => $contentType, 'text' => $part['text'] ?? ''];
                            } else {
                                $parts[] = $part;
                            }
                        }
                    }

                    $normalized[] = [
                        'role' => $role === 'assistant' ? 'assistant' : 'user',
                        'content' => $parts,
                    ];
                }

                continue;
            }

            // Otherwise, treat as raw item and pass through
            $normalized[] = $item;
        }

        return $normalized;
    }

    /**
     * Build cURL handle
     */
    private function buildCurlHandle(array $payload, bool $stream): CurlHandle
    {
        $endpoint = $this->baseUrl ?? self::API_ENDPOINT;
        $ch = curl_init($endpoint);

        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json',
        ];

        if ($stream) {
            $headers[] = 'Accept: text/event-stream';
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            CURLOPT_HTTPHEADER => $headers,
        ]);

        return $ch;
    }

    /**
     * Make HTTP request
     */
    private function request(array $payload): array
    {
        // Generate cache key based on full payload (includes model, temperature, input)
        // Sort payload recursively to ensure consistent hash regardless of key order
        $cachePayload = $payload;
        $this->recursiveKsort($cachePayload);
        $cacheKey = hash('sha256', (string) json_encode($cachePayload));
        $cacheFile = $this->getCachePath($cacheKey);

        if (file_exists($cacheFile)) {
            $cachedContent = file_get_contents($cacheFile);
            if ($cachedContent !== false) {
                $decoded = json_decode($cachedContent, true);
                if (is_array($decoded)) {
                    return $decoded;
                }
            }
        }

        $curlHandle = $this->buildCurlHandle($payload, false);

        $response = curl_exec($curlHandle);
        $httpCode = curl_getinfo($curlHandle, CURLINFO_HTTP_CODE);
        $error = curl_error($curlHandle);
        curl_close($curlHandle);

        if ($error !== '' && $error !== '0') {
            throw new RuntimeException('cURL error: ' . $error);
        }

        if (!is_string($response)) {
            throw new RuntimeException('cURL request failed');
        }

        $decoded = json_decode($response, true);

        if ($httpCode >= 400) {
            $message = $decoded['error']['message'] ?? 'HTTP ' . $httpCode;
            throw new RuntimeException('OpenAI API error: ' . $message);
        }

        // Save to cache (only if successful)
        if (isset($decoded)) {
            file_put_contents($cacheFile, json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        return $decoded ?? [];
    }
}
