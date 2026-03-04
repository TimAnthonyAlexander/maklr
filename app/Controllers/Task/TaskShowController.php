<?php

namespace App\Controllers\Task;

use App\Services\CacheHelper;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use App\Models\Task;

class TaskShowController extends Controller
{
    public string $id = '';

    public function get(): JsonResponse
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $data = CacheHelper::remember('task', $this->id, 300, function () use ($officeId): ?array {
            $task = Task::with(['taskUsers', 'comments', 'estate', 'contact'])
                ->where('id', '=', $this->id)
                ->where('office_id', '=', $officeId)
                ->first();

            if (!$task instanceof Task) {
                return null;
            }

            return $task->toArray(true);
        });

        if ($data === null) {
            return JsonResponse::notFound('Task not found');
        }

        return JsonResponse::ok($data);
    }
}
