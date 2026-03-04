<?php

namespace App\Controllers\Estate;

use App\Models\Estate;
use App\Models\EstateImage;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Response;
use BaseApi\Storage\Storage;

class EstateImageServeController extends Controller
{
    public string $id = '';

    public string $imageId = '';

    public function get(): JsonResponse|Response
    {
        $officeId = $this->request->user['office_id'] ?? null;

        $estate = Estate::where('id', '=', $this->id)
            ->where('office_id', '=', $officeId)
            ->first();

        if (!$estate instanceof Estate) {
            return JsonResponse::notFound('Estate not found');
        }

        $image = EstateImage::where('id', '=', $this->imageId)
            ->where('estate_id', '=', $this->id)
            ->first();

        if (!$image instanceof EstateImage) {
            return JsonResponse::notFound('Image not found');
        }

        if (!Storage::exists($image->file_path)) {
            return JsonResponse::notFound('File not found on disk');
        }

        $content = Storage::get($image->file_path);

        return new Response(
            status: 200,
            headers: [
                'Content-Type' => $image->mime_type,
                'Content-Disposition' => 'inline; filename="' . $image->file_name . '"',
                'Content-Length' => (string) $image->file_size,
                'Cache-Control' => 'public, max-age=86400',
            ],
            body: $content,
        );
    }
}
