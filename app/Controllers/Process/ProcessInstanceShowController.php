<?php

namespace App\Controllers\Process;

use App\Models\ProcessInstance;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class ProcessInstanceShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $instance = ProcessInstance::with(['template', 'stepInstances'])
            ->where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$instance instanceof ProcessInstance) {
            return JsonResponse::notFound('Process instance not found');
        }

        return JsonResponse::ok($instance->toArray(true));
    }
}
