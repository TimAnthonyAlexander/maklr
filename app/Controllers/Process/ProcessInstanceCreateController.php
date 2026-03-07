<?php

namespace App\Controllers\Process;

use App\Models\ProcessInstance;
use App\Models\ProcessTemplate;
use App\Services\ProcessExecutionService;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Validation\ValidationException;

class ProcessInstanceCreateController extends Controller
{
    public string $process_template_id = '';

    public string $entity_id = '';

    public function post(): JsonResponse
    {
        try {
            $this->validate([
                'process_template_id' => 'required|string',
                'entity_id' => 'required|string',
            ]);
        } catch (ValidationException $validationException) {
            return JsonResponse::validationError($validationException->errors());
        }

        $officeId = $this->request->user['office_id'] ?? null;
        $userId = $this->request->user['id'];

        $template = ProcessTemplate::where('id', '=', $this->process_template_id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$template instanceof ProcessTemplate) {
            return JsonResponse::notFound('Process template not found');
        }

        if (!$template->active) {
            return JsonResponse::badRequest('Process template is not active');
        }

        // Check for duplicate running instance
        $existing = ProcessInstance::where('process_template_id', '=', $template->id)
            ->where('entity_id', '=', $this->entity_id)
            ->where('status', '=', 'running')
            ->exists();

        if ($existing) {
            return JsonResponse::badRequest('A running instance of this process already exists for this entity');
        }

        /** @var ProcessExecutionService $executionService */
        $executionService = $this->make(ProcessExecutionService::class);

        $instance = $executionService->startInstance(
            $template,
            $template->entity_type,
            $this->entity_id,
            $officeId ?? '',
            $userId,
        );

        return JsonResponse::created($instance->toArray());
    }
}
