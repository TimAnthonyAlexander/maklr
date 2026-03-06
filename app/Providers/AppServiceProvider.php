<?php

namespace App\Providers;

use Override;
use BaseApi\App;
use BaseApi\Container\ServiceProvider;
use BaseApi\Container\ContainerInterface;
use App\Auth\SimpleUserProvider;
use App\Services\ActivityService;
use App\Services\AppointmentService;
use App\Services\AuditLogService;
use App\Services\EmailService;
use App\Services\EncryptionService;
use App\Services\ImapService;
use App\Services\DocumentService;
use App\Services\MatchingService;
use App\Services\EmailTemplateService;
use App\Services\SmtpSendService;
use App\Services\BrochureService;
use BaseApi\Auth\UserProvider;

/**
 * Application service provider.
 * 
 * Register application-specific services here.
 */
class AppServiceProvider extends ServiceProvider
{
    #[Override]
    public function register(ContainerInterface $container): void
    {
        // Register the user provider
        $container->singleton(UserProvider::class, SimpleUserProvider::class);

        // Register the email service as singleton
        $container->singleton(EmailService::class);

        // Register the audit log service as singleton
        $container->singleton(AuditLogService::class);

        // Register the activity service as singleton
        $container->singleton(ActivityService::class);

        // Register the matching service as singleton
        $container->singleton(MatchingService::class);

        // Register the appointment service as singleton
        $container->singleton(AppointmentService::class);

        // Register the document service as singleton
        $container->singleton(DocumentService::class);

        // Register the brochure service as singleton
        $container->singleton(BrochureService::class);

        // Register encryption and IMAP services
        $container->singleton(EncryptionService::class);
        $container->singleton(ImapService::class);
        $container->singleton(SmtpSendService::class);
        $container->singleton(EmailTemplateService::class);

        // Example: Register a custom service with manual configuration
        // $container->singleton(SomeService::class, function (ContainerInterface $c) {
        //     return new SomeService($c->make(SomeDependency::class));
        // });
    }

    #[Override]
    public function boot(ContainerInterface $container): void
    {
        // Boot services after registration
        // Example: Configure services that depend on other services
        
        // Set the user provider in the App
        App::setUserProvider($container->make(UserProvider::class));
    }
}
