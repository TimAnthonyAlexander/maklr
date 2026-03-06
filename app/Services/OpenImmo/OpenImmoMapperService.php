<?php

namespace App\Services\OpenImmo;

use Ujamii\OpenImmo\API\Land;
use Ujamii\OpenImmo\API\Fahrstuhl;
use Ujamii\OpenImmo\API\Unterkellert;
use Ujamii\OpenImmo\API\Moebliert;
use DateTime;
use App\Models\Contact;
use App\Models\Estate;
use App\Models\EstateImage;
use App\Models\Office;
use Ujamii\OpenImmo\API\Aktion;
use Ujamii\OpenImmo\API\Anhang;
use Ujamii\OpenImmo\API\Anhaenge;
use Ujamii\OpenImmo\API\Ausstattung;
use Ujamii\OpenImmo\API\BueroPraxen;
use Ujamii\OpenImmo\API\Daten;
use Ujamii\OpenImmo\API\Flaechen;
use Ujamii\OpenImmo\API\Freitexte;
use Ujamii\OpenImmo\API\Geo;
use Ujamii\OpenImmo\API\Geokoordinaten;
use Ujamii\OpenImmo\API\Grundstueck;
use Ujamii\OpenImmo\API\Haus;
use Ujamii\OpenImmo\API\Immobilie;
use Ujamii\OpenImmo\API\Kontaktperson;
use Ujamii\OpenImmo\API\Nutzungsart;
use Ujamii\OpenImmo\API\Objektart;
use Ujamii\OpenImmo\API\Objektkategorie;
use Ujamii\OpenImmo\API\Parken;
use Ujamii\OpenImmo\API\Kaufpreis;
use Ujamii\OpenImmo\API\Preise;
use Ujamii\OpenImmo\API\Vermarktungsart;
use Ujamii\OpenImmo\API\VerwaltungTechn;
use Ujamii\OpenImmo\API\Wohnung;

class OpenImmoMapperService
{

    /**
     * Map a Maklr Estate to an OpenImmo Immobilie.
     *
     * @param array<EstateImage> $images
     * @param string $action CHANGE or DELETE
     */
    public function mapEstate(
        Estate $estate,
        array $images,
        ?Contact $contact,
        Office $office,
        string $action = Aktion::AKTIONART_CHANGE,
    ): Immobilie {
        $immobilie = new Immobilie();
        $immobilie->setObjektkategorie($this->mapObjektkategorie($estate));
        $immobilie->setGeo($this->mapGeo($estate));
        $immobilie->setKontaktperson($this->mapKontaktperson($contact, $office));
        $immobilie->setPreise($this->mapPreise($estate));
        $immobilie->setFlaechen($this->mapFlaechen($estate));
        $immobilie->setAusstattung($this->mapAusstattung($estate));
        $immobilie->setFreitexte($this->mapFreitexte($estate));
        $immobilie->setVerwaltungTechn($this->mapVerwaltungTechn($estate, $action));

        if ($images !== []) {
            $immobilie->setAnhaenge($this->mapAnhaenge($images));
        }

        return $immobilie;
    }

    public function mapObjektkategorie(Estate $estate): Objektkategorie
    {
        $nutzungsart = $this->mapNutzungsart($estate->property_type);
        $vermarktungsart = $this->mapVermarktungsart($estate->marketing_type);
        $objektart = $this->mapObjektart($estate->property_type);

        return new Objektkategorie($nutzungsart, $vermarktungsart, $objektart);
    }

    public function mapGeo(Estate $estate): Geo
    {
        $geo = new Geo();
        $geo->setPlz($estate->zip);
        $geo->setOrt($estate->city);
        $geo->setStrasse($estate->street);
        $geo->setHausnummer($estate->house_number);

        if ($estate->country !== null) {
            $land = new Land();
            $land->setIsoLand($estate->country);
            $geo->setLand($land);
        }

        if ($estate->latitude !== null && $estate->longitude !== null) {
            $geo->setGeokoordinaten(
                new Geokoordinaten($estate->latitude, $estate->longitude),
            );
        }

        if ($estate->floor !== null) {
            $geo->setEtage($estate->floor);
        }

        if ($estate->floors_total !== null) {
            $geo->setAnzahlEtagen($estate->floors_total);
        }

        return $geo;
    }

    public function mapKontaktperson(?Contact $contact, Office $office): Kontaktperson
    {
        $kontaktperson = new Kontaktperson();
        $kontaktperson->setFirma($office->name);
        $kontaktperson->setStrasse($office->address);
        $kontaktperson->setPlz($office->zip);
        $kontaktperson->setOrt($office->city);
        $kontaktperson->setEmailZentrale($office->email);
        $kontaktperson->setTelZentrale($office->phone);

        if ($contact instanceof Contact) {
            $kontaktperson->setName($contact->last_name ?? '');
            $kontaktperson->setVorname($contact->first_name);
            $kontaktperson->setAnrede($contact->salutation);
            $kontaktperson->setEmailDirekt($contact->email);
            $kontaktperson->setTelDurchw($contact->phone);
            $kontaktperson->setTelHandy($contact->mobile);
        }

        return $kontaktperson;
    }

    public function mapPreise(Estate $estate): Preise
    {
        $preise = new Preise();

        if ($estate->price === null) {
            return $preise;
        }

        if ($estate->marketing_type === 'sale') {
            $preise->setKaufpreis(new Kaufpreis(value: $estate->price));
        } else {
            $preise->setNettokaltmiete($estate->price);
        }

        return $preise;
    }

    public function mapFlaechen(Estate $estate): Flaechen
    {
        $flaechen = new Flaechen();

        if ($estate->area_total !== null) {
            $flaechen->setGesamtflaeche($estate->area_total);
        }

        if ($estate->area_living !== null) {
            $flaechen->setWohnflaeche($estate->area_living);
        }

        if ($estate->area_plot !== null) {
            $flaechen->setGrundstuecksflaeche($estate->area_plot);
        }

        if ($estate->rooms !== null) {
            $flaechen->setAnzahlZimmer((float) $estate->rooms);
        }

        if ($estate->bedrooms !== null) {
            $flaechen->setAnzahlSchlafzimmer((float) $estate->bedrooms);
        }

        if ($estate->bathrooms !== null) {
            $flaechen->setAnzahlBadezimmer((float) $estate->bathrooms);
        }

        if ($estate->parking_spaces !== null) {
            $flaechen->setAnzahlStellplaetze($estate->parking_spaces);
        }

        if ($estate->balcony) {
            $flaechen->setAnzahlBalkone(1.0);
        }

        return $flaechen;
    }

    public function mapAusstattung(Estate $estate): Ausstattung
    {
        $ausstattung = new Ausstattung();

        if ($estate->garden) {
            $ausstattung->setGartennutzung(true);
        }

        if ($estate->elevator) {
            $ausstattung->setFahrstuhl(
                new Fahrstuhl()
            );
        }

        if ($estate->cellar) {
            $ausstattung->setUnterkellert(
                new Unterkellert()
            );
        }

        if ($estate->furnished) {
            $ausstattung->setMoebliert(
                new Moebliert()
            );
        }

        return $ausstattung;
    }

    public function mapFreitexte(Estate $estate): Freitexte
    {
        $freitexte = new Freitexte();
        $freitexte->setObjekttitel($estate->title);

        if ($estate->description !== null && $estate->description !== '') {
            $freitexte->setObjektbeschreibung($estate->description);
        }

        return $freitexte;
    }

    /**
     * @param array<EstateImage> $images
     */
    public function mapAnhaenge(array $images): Anhaenge
    {
        $attachments = [];

        foreach ($images as $image) {
            $gruppe = $this->mapImageCategory($image->category, $image->is_primary);

            $anhang = new Anhang(
                location: Anhang::LOCATION_EXTERN,
                gruppe: $gruppe,
                anhangtitel: $image->title ?? $image->file_name,
                format: $image->mime_type,
            );
            $anhang->setDaten(new Daten(pfad: $image->file_name));

            $attachments[] = $anhang;
        }

        return new Anhaenge($attachments);
    }

    public function mapVerwaltungTechn(Estate $estate, string $action): VerwaltungTechn
    {
        $verwaltungTechn = new VerwaltungTechn();
        $verwaltungTechn->setObjektnrIntern($estate->id);
        $verwaltungTechn->setObjektnrExtern($estate->external_id ?? $estate->id);
        $verwaltungTechn->setOpenimmoObid($estate->id);
        $verwaltungTechn->setAktion(new Aktion($action));
        $verwaltungTechn->setStandVom(new DateTime());

        return $verwaltungTechn;
    }

    private function mapNutzungsart(string $propertyType): Nutzungsart
    {
        $wohnen = in_array($propertyType, ['apartment', 'house'], true);
        $gewerbe = $propertyType === 'commercial';

        return new Nutzungsart(wohnen: $wohnen, gewerbe: $gewerbe);
    }

    private function mapVermarktungsart(string $marketingType): Vermarktungsart
    {
        return new Vermarktungsart(
            kauf: $marketingType === 'sale',
            mietePacht: in_array($marketingType, ['rent', 'lease'], true),
        );
    }

    private function mapObjektart(string $propertyType): Objektart
    {
        $objektart = new Objektart();

        match ($propertyType) {
            'apartment' => $objektart->setWohnung([new Wohnung()]),
            'house' => $objektart->setHaus([new Haus()]),
            'commercial' => $objektart->setBueroPraxen([new BueroPraxen()]),
            'land' => $objektart->setGrundstueck([new Grundstueck()]),
            'garage' => $objektart->setParken([new Parken()]),
            default => $objektart->setWohnung([new Wohnung()]),
        };

        return $objektart;
    }

    private function mapImageCategory(string $category, bool $isPrimary): string
    {
        if ($isPrimary) {
            return Anhang::GRUPPE_TITELBILD;
        }

        return match ($category) {
            'exterior' => Anhang::GRUPPE_AUSSENANSICHTEN,
            'interior' => Anhang::GRUPPE_INNENANSICHTEN,
            'floor_plan' => Anhang::GRUPPE_GRUNDRISS,
            default => Anhang::GRUPPE_BILD,
        };
    }
}
