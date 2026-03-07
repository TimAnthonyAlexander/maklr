<?php

namespace App\Jobs;

use Override;
use Throwable;
use BaseApi\App;
use BaseApi\Queue\Job;
use App\Services\ProcessExecutionService;

class ProcessWaitCheckJob extends Job
{
    protected int $maxRetries = 1;

    protected int $retryDelay = 60;

    public function __construct() {}

    #[Override]
    public function handle(): void
    {
        $container = App::container();
        /** @var ProcessExecutionService $executionService */
        $executionService = $container->make(ProcessExecutionService::class);

        $processed = $executionService->processWaitSteps();

        if ($processed > 0) {
            App::logger()->info('process_wait_check_completed', ['steps_processed' => $processed]);
        }
    }

    #[Override]
    public function failed(Throwable $throwable): void
    {
        App::logger()->error('process_wait_check_failed', ['error' => $throwable->getMessage()]);
        parent::failed($throwable);
    }
}
