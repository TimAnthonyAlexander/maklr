<?php

namespace App\Services\OpenImmo;

use DateTime;
use App\Models\Contact;
use App\Models\Estate;
use App\Models\Office;
use App\Models\Portal;
use JMS\Serializer\SerializerBuilder;
use JMS\Serializer\SerializerInterface;
use Ujamii\OpenImmo\API\Anbieter;
use Ujamii\OpenImmo\API\Openimmo;
use Ujamii\OpenImmo\API\Uebertragung;

class OpenImmoExportService
{
    private readonly SerializerInterface $serializer;

    public function __construct(
        private readonly OpenImmoMapperService $openImmoMapperService,
    ) {
        $this->serializer = SerializerBuilder::create()->build();
    }

    /**
     * Generate OpenImmo XML for a set of estates destined for a specific portal.
     *
     * @param array<array{estate: Estate, images: array, owner: ?Contact, action: string}> $estateData
     * @return string XML content
     */
    public function generateXml(Portal $portal, array $estateData, Office $office): string
    {
        $uebertragung = $this->buildUebertragung();
        $anbieter = $this->buildAnbieter($portal, $estateData, $office);

        $openimmo = new Openimmo($uebertragung, [$anbieter]);

        return $this->serializer->serialize($openimmo, 'xml');
    }

    /**
     * @param array<array{estate: Estate, images: array, owner: ?Contact, action: string}> $estateData
     */
    private function buildAnbieter(Portal $portal, array $estateData, Office $office): Anbieter
    {
        $anbieter = new Anbieter();
        $anbieter->setFirma($office->name);
        $anbieter->setOpenimmoAnid($portal->provider_id ?? $office->id);
        $anbieter->setAnbieternr($portal->provider_id);

        $immobilien = [];
        foreach ($estateData as $entry) {
            $immobilien[] = $this->openImmoMapperService->mapEstate(
                $entry['estate'],
                $entry['images'],
                $entry['owner'],
                $office,
                $entry['action'],
            );
        }

        $anbieter->setImmobilie($immobilien);

        return $anbieter;
    }

    private function buildUebertragung(): Uebertragung
    {
        $uebertragung = new Uebertragung();
        $uebertragung->setArt(Uebertragung::ART_ONLINE);
        $uebertragung->setUmfang(Uebertragung::UMFANG_TEIL);
        $uebertragung->setVersion('1.2.7');
        $uebertragung->setSendersoftware('Maklr');
        $uebertragung->setSenderversion('1.0.0');
        $uebertragung->setTimestamp(new DateTime());

        return $uebertragung;
    }
}
