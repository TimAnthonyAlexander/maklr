<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;
use BaseApi\OpenApi\OpenApiGenerator;
use Exception;

final class OpenApiController extends Controller
{
    public function get(): Response
    {
        try {
            $spec = CacheHelper::remember('system', 'openapi_spec', 86400, function (): array {
                $openApiGenerator = new OpenApiGenerator();

                return $openApiGenerator->generate();
            }, useJitter: false);

            return new JsonResponse($spec);
        } catch (Exception $exception) {
            return JsonResponse::error('Failed to generate OpenAPI specification: ' . $exception->getMessage());
        }
    }
}
