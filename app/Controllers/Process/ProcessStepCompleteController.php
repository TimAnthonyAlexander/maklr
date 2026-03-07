<?php

namespace App\Controllers\Process;

use App\Models\ProcessInstance;
use App\Services\ProcessExecutionService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class ProcessStepCompleteController extends Controller
{
    public string $id = '';

    public string $stepKey = '';

    public function post(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $instance = ProcessInstance::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$instance instanceof ProcessInstance) {
            return JsonResponse::notFound('Process instance not found');
        }

        if ($instance->status !== 'running') {
            return JsonResponse::badRequest('Process is not running');
        }

        /** @var ProcessExecutionService $executionService */
        $executionService = $this->make(ProcessExecutionService::class);

        $completed = $executionService->completeManualStep($instance, $this->stepKey);

        if (!$completed) {
            return JsonResponse::badRequest('Step cannot be completed (not found or not active)');
        }

        // Reload instance to get updated state
        $instance = ProcessInstance::with(['stepInstances'])
            ->where('id', '=', $this->id)
            ->first();

        return JsonResponse::ok($instance instanceof ProcessInstance ? $instance->toArray(true) : []);
    }
}
