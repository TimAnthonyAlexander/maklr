<?php

namespace App\Controllers\Process;

use App\Models\ProcessInstance;
use App\Models\ProcessTemplate;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

class ProcessTemplateShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $template = ProcessTemplate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$template instanceof ProcessTemplate) {
            return JsonResponse::notFound('Process template not found');
        }

        $data = $template->toArray();

        // Include count of running instances
        $data['running_instances_count'] = ProcessInstance::where('process_template_id', '=', $template->id)
            ->where('status', '=', 'running')
            ->count();

        return JsonResponse::ok($data);
    }
}
