<?php

namespace App\Controllers\Process;

use App\Models\ProcessInstance;
use App\Services\ProcessExecutionService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;

class ProcessInstanceUpdateController extends Controller
{
    public string $id = '';

    public ?string $status = null;

    private const array VALID_ACTIONS = ['paused', 'running', 'cancelled'];

    public function patch(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $instance = ProcessInstance::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$instance instanceof ProcessInstance) {
            return JsonResponse::notFound('Process instance not found');
        }

        try {
            if ($this->status !== null) {
                $this->validate(['status' => 'string|in:' . implode(',', self::VALID_ACTIONS)]);
            }
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        if ($this->status === null) {
            return JsonResponse::ok($instance->toArray());
        }

        /** @var ProcessExecutionService $executionService */
        $executionService = $this->make(ProcessExecutionService::class);

        match ($this->status) {
            'paused' => $executionService->pauseInstance($instance),
            'running' => $executionService->resumeInstance($instance),
            'cancelled' => $executionService->cancelInstance($instance),
            default => null,
        };

        return JsonResponse::ok($instance->toArray());
    }
}
