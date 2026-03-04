<?php

namespace App\Controllers\Dashboard;

use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use App\Models\Contact;
use App\Models\Email;
use App\Models\EmailAccount;
use App\Models\Estate;
use App\Models\Task;
use App\Services\CacheHelper;
use App\Services\MatchingService;
use BaseApi\App;
use BaseApi\Http\Attributes\Tag;

#[Tag('Dashboard')]
final class DashboardStatsController extends Controller
{
    public const int CACHE_TTL = 90;

    public function get(): JsonResponse
    {
        $userData = $this->request->user ?? null;
        if (!$userData || empty($userData['id'])) {
            return JsonResponse::error('Unauthorized', 401);
        }

        $officeId = $userData['office_id'] ?? null;

        $stats = CacheHelper::remember('dashboard', $officeId ?? 'none', self::CACHE_TTL, fn(): array => $this->buildStats($officeId));

        return JsonResponse::ok($stats);
    }

    private function buildStats(?string $officeId): array
    {
        $totalEstates = Estate::where('status', '!=', 'archived')
            ->where('office_id', '=', $officeId)
            ->count();

        $estatesByStatus = $this->countGroupedBy('status', $officeId);
        $estatesByPropertyType = $this->countGroupedBy('property_type', $officeId);
        $estatesByMarketingType = $this->countGroupedBy('marketing_type', $officeId);

        $recentEstates = Estate::where('status', '!=', 'archived')
            ->where('office_id', '=', $officeId)
            ->orderBy('created_at', 'DESC')
            ->limit(5)
            ->get();

        $recentEstatesArray = array_map(
            fn(Estate $estate): array => $estate->toArray(),
            $recentEstates,
        );

        $taskStats = $this->getTaskStats($officeId);
        $contactStats = $this->getContactStats($officeId);
        $emailStats = $this->getEmailStats($officeId);
        $matchingStats = $this->getMatchingStats($officeId);

        return [
            'total_estates' => $totalEstates,
            'estates_by_status' => $estatesByStatus,
            'estates_by_property_type' => $estatesByPropertyType,
            'estates_by_marketing_type' => $estatesByMarketingType,
            'recent_estates' => $recentEstatesArray,
            'tasks' => $taskStats,
            'contacts' => $contactStats,
            'emails' => $emailStats,
            'matching' => $matchingStats,
        ];
    }

    private function getTaskStats(?string $officeId): array
    {
        $openTasks = Task::where('status', '!=', 'done')
            ->where('office_id', '=', $officeId)
            ->count();

        $overdueTasks = Task::where('status', '!=', 'done')
            ->where('office_id', '=', $officeId)
            ->where('due_date', '<', date('Y-m-d H:i:s'))
            ->where('due_date', '!=', null)
            ->count();

        $dueSoonTasks = Task::where('status', '!=', 'done')
            ->where('office_id', '=', $officeId)
            ->where('due_date', '>=', date('Y-m-d H:i:s'))
            ->where('due_date', '<=', date('Y-m-d H:i:s', strtotime('+7 days')))
            ->count();

        $tasksByStatus = $this->countTasksGroupedBy('status', $officeId);
        $tasksByPriority = $this->countTasksGroupedBy('priority', $officeId);

        $upcomingTasks = Task::where('status', '!=', 'done')
            ->where('office_id', '=', $officeId)
            ->orderBy('due_date', 'ASC')
            ->limit(5)
            ->get();

        $upcomingTasksArray = array_map(
            fn(Task $task): array => $task->toArray(),
            $upcomingTasks,
        );

        return [
            'open' => $openTasks,
            'overdue' => $overdueTasks,
            'due_soon' => $dueSoonTasks,
            'by_status' => $tasksByStatus,
            'by_priority' => $tasksByPriority,
            'upcoming' => $upcomingTasksArray,
        ];
    }

    private function getContactStats(?string $officeId): array
    {
        $totalContacts = Contact::where('office_id', '=', $officeId)->count();

        $contactsByType = $this->countContactsGroupedBy('type', $officeId);
        $contactsByStage = $this->countContactsGroupedBy('stage', $officeId);
        $contactsByEntityType = $this->countContactsGroupedBy('entity_type', $officeId);

        $recentContacts = Contact::where('office_id', '=', $officeId)
            ->orderBy('created_at', 'DESC')
            ->limit(5)
            ->get();

        $recentContactsArray = array_map(
            fn(Contact $contact): array => $contact->toArray(),
            $recentContacts,
        );

        return [
            'total' => $totalContacts,
            'by_type' => $contactsByType,
            'by_stage' => $contactsByStage,
            'by_entity_type' => $contactsByEntityType,
            'recent' => $recentContactsArray,
        ];
    }

    private function getEmailStats(?string $officeId): array
    {
        $accountIds = $this->getEmailAccountIds($officeId);

        if ($accountIds === []) {
            return [
                'total' => 0,
                'unread' => 0,
                'sent' => 0,
                'recent' => [],
            ];
        }

        $total = Email::query()->qb()
            ->whereIn('email_account_id', $accountIds)
            ->where('status', '!=', 'archived')
            ->where('direction', '=', 'incoming')
            ->count();

        $unread = Email::query()->qb()
            ->whereIn('email_account_id', $accountIds)
            ->where('status', '!=', 'archived')
            ->where('direction', '=', 'incoming')
            ->where('read', '=', false)
            ->count();

        $sent = Email::query()->qb()
            ->whereIn('email_account_id', $accountIds)
            ->where('direction', '=', 'outgoing')
            ->count();

        $recentEmails = Email::query()
            ->qb()
            ->whereIn('email_account_id', $accountIds)
            ->where('status', '!=', 'archived')
            ->orderByRaw('received_at DESC')
            ->limit(5)
            ->get();

        $recentArray = array_map(
            fn(array $row): array => [
                'id' => $row['id'],
                'subject' => $row['subject'],
                'from_address' => $row['from_address'],
                'direction' => $row['direction'],
                'read' => (bool) $row['read'],
                'received_at' => $row['received_at'],
            ],
            $recentEmails,
        );

        return [
            'total' => $total,
            'unread' => $unread,
            'sent' => $sent,
            'recent' => $recentArray,
        ];
    }

    /**
     * @return string[]
     */
    private function getEmailAccountIds(?string $officeId): array
    {
        if ($officeId === null) {
            return [];
        }

        $accounts = EmailAccount::where('office_id', '=', $officeId)
            ->where('active', '=', true)
            ->get();

        $ids = [];
        foreach ($accounts as $account) {
            $ids[] = $account->id;
        }

        return $ids;
    }

    private function getMatchingStats(?string $officeId): array
    {
        if ($officeId === null) {
            return ['contacts_with_profiles' => 0, 'top_matches' => []];
        }

        $contacts = Contact::where('office_id', '=', $officeId)
            ->whereIn('type', ['buyer', 'tenant'])
            ->get();

        $contactsWithProfiles = 0;
        $contactsWithSearchProfiles = [];

        foreach ($contacts as $contact) {
            $profiles = $contact->getSearchProfiles();
            if ($profiles !== []) {
                $contactsWithProfiles++;
                $contactsWithSearchProfiles[] = $contact;
            }
        }

        $activeEstates = Estate::where('office_id', '=', $officeId)
            ->where('status', '=', 'active')
            ->get();

        $allMatches = [];

        foreach ($activeEstates as $activeEstate) {
            foreach ($contactsWithSearchProfiles as $contactWithSearchProfile) {
                $profiles = $contactWithSearchProfile->getSearchProfiles();
                $bestScore = -1;
                $bestProfileName = '';

                foreach ($profiles as $profile) {
                    $matchingService = App::container()->make(MatchingService::class);
                    $result = $matchingService->scoreProfileAgainstEstate($profile, $activeEstate);
                    if ($result['score'] > $bestScore) {
                        $bestScore = $result['score'];
                        $bestProfileName = $profile['name'] ?? '';
                    }
                }

                if ($bestScore >= 50) {
                    $contactName = $contactWithSearchProfile->entity_type === 'company'
                        ? ($contactWithSearchProfile->company_name ?? '')
                        : trim(($contactWithSearchProfile->first_name ?? '') . ' ' . ($contactWithSearchProfile->last_name ?? ''));

                    $allMatches[] = [
                        'estate_id' => $activeEstate->id,
                        'estate_title' => $activeEstate->title ?? '',
                        'contact_id' => $contactWithSearchProfile->id,
                        'contact_name' => $contactName,
                        'contact_type' => $contactWithSearchProfile->type ?? '',
                        'score' => $bestScore,
                        'profile_name' => $bestProfileName,
                    ];
                }
            }
        }

        usort($allMatches, fn(array $a, array $b): int => $b['score'] <=> $a['score']);

        return [
            'contacts_with_profiles' => $contactsWithProfiles,
            'top_matches' => array_slice($allMatches, 0, 5),
        ];
    }

    private function countContactsGroupedBy(string $column, ?string $officeId): array
    {
        $rows = Contact::query()->qb()
            ->select([$column])
            ->selectRaw('COUNT(*)', 'count')
            ->where('office_id', '=', $officeId)
            ->groupBy($column)
            ->get();

        $result = [];
        foreach ($rows as $row) {
            $result[$row[$column]] = (int) $row['count'];
        }

        return $result;
    }

    private function countTasksGroupedBy(string $column, ?string $officeId): array
    {
        $rows = Task::query()->qb()
            ->select([$column])
            ->selectRaw('COUNT(*)', 'count')
            ->where('office_id', '=', $officeId)
            ->groupBy($column)
            ->get();

        $result = [];
        foreach ($rows as $row) {
            $result[$row[$column]] = (int) $row['count'];
        }

        return $result;
    }

    private function countGroupedBy(string $column, ?string $officeId): array
    {
        $rows = Estate::query()->qb()
            ->select([$column])
            ->selectRaw('COUNT(*)', 'count')
            ->where('status', '!=', 'archived')
            ->where('office_id', '=', $officeId)
            ->groupBy($column)
            ->get();

        $result = [];
        foreach ($rows as $row) {
            $result[$row[$column]] = (int) $row['count'];
        }

        return $result;
    }
}
