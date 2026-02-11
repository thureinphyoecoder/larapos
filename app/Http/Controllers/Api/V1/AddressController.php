<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function suggest(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        $limit = max(1, min(20, (int) $request->query('limit', 10)));

        if (mb_strlen($q) < 2) {
            return response()->json(['data' => []]);
        }

        $needle = mb_strtolower($q);
        $like = "%{$q}%";

        $static = collect($this->myanmarTownships())
            ->map(fn (array $row) => [
                'label' => "{$row['township']}, {$row['state']}",
                'township' => $row['township'],
                'state' => $row['state'],
                'source' => 'static',
            ]);

        $profileRows = DB::table('user_profiles')
            ->select(['address_line_1', 'city', 'state'])
            ->where(function ($query) use ($like) {
                $query->where('address_line_1', 'like', $like)
                    ->orWhere('city', 'like', $like)
                    ->orWhere('state', 'like', $like);
            })
            ->whereNotNull('address_line_1')
            ->limit(60)
            ->get()
            ->map(function ($row) {
                $parts = array_values(array_filter([
                    trim((string) ($row->address_line_1 ?? '')),
                    trim((string) ($row->city ?? '')),
                    trim((string) ($row->state ?? '')),
                ]));

                return [
                    'label' => implode(', ', $parts),
                    'township' => trim((string) ($row->city ?? '')),
                    'state' => trim((string) ($row->state ?? '')),
                    'source' => 'profile',
                ];
            });

        $orderRows = DB::table('orders')
            ->select(['address'])
            ->whereNotNull('address')
            ->where('address', 'like', $like)
            ->limit(60)
            ->get()
            ->map(fn ($row) => [
                'label' => trim((string) ($row->address ?? '')),
                'township' => null,
                'state' => null,
                'source' => 'order',
            ]);

        $results = $static
            ->concat($profileRows)
            ->concat($orderRows)
            ->filter(fn (array $row) => $row['label'] !== '')
            ->map(function (array $row) use ($needle) {
                $label = mb_strtolower($row['label']);
                $score = 0;
                if (str_starts_with($label, $needle)) {
                    $score += 100;
                }
                if (str_contains($label, $needle)) {
                    $score += 50;
                }
                if ($row['source'] === 'profile') {
                    $score += 20;
                }
                if ($row['source'] === 'order') {
                    $score += 15;
                }

                $row['score'] = $score;
                return $row;
            })
            ->sortByDesc('score')
            ->unique(fn (array $row) => mb_strtolower($row['label']))
            ->take($limit)
            ->values()
            ->map(fn (array $row) => [
                'label' => $row['label'],
                'township' => $row['township'],
                'state' => $row['state'],
            ]);

        return response()->json(['data' => $results]);
    }

    private function myanmarTownships(): array
    {
        return [
            ['township' => 'Yangon', 'state' => 'Yangon Region'],
            ['township' => 'Ahlone', 'state' => 'Yangon Region'],
            ['township' => 'Bahan', 'state' => 'Yangon Region'],
            ['township' => 'Dagon', 'state' => 'Yangon Region'],
            ['township' => 'Insein', 'state' => 'Yangon Region'],
            ['township' => 'Hlaing', 'state' => 'Yangon Region'],
            ['township' => 'Hlaingthaya', 'state' => 'Yangon Region'],
            ['township' => 'Kamayut', 'state' => 'Yangon Region'],
            ['township' => 'Kyauktada', 'state' => 'Yangon Region'],
            ['township' => 'Lanmadaw', 'state' => 'Yangon Region'],
            ['township' => 'Mayangone', 'state' => 'Yangon Region'],
            ['township' => 'Mingaladon', 'state' => 'Yangon Region'],
            ['township' => 'North Dagon', 'state' => 'Yangon Region'],
            ['township' => 'South Dagon', 'state' => 'Yangon Region'],
            ['township' => 'Shwepyithar', 'state' => 'Yangon Region'],
            ['township' => 'Tamwe', 'state' => 'Yangon Region'],
            ['township' => 'Thingangyun', 'state' => 'Yangon Region'],
            ['township' => 'Thaketa', 'state' => 'Yangon Region'],
            ['township' => 'Yankin', 'state' => 'Yangon Region'],
            ['township' => 'Mandalay', 'state' => 'Mandalay Region'],
            ['township' => 'Amarapura', 'state' => 'Mandalay Region'],
            ['township' => 'Chanayethazan', 'state' => 'Mandalay Region'],
            ['township' => 'Chanmyathazi', 'state' => 'Mandalay Region'],
            ['township' => 'Maha Aungmye', 'state' => 'Mandalay Region'],
            ['township' => 'Pyigyidagun', 'state' => 'Mandalay Region'],
            ['township' => 'Patheingyi', 'state' => 'Mandalay Region'],
            ['township' => 'Pyin Oo Lwin', 'state' => 'Mandalay Region'],
            ['township' => 'Naypyitaw', 'state' => 'Naypyitaw Union Territory'],
            ['township' => 'Pyinmana', 'state' => 'Naypyitaw Union Territory'],
            ['township' => 'Tatkon', 'state' => 'Naypyitaw Union Territory'],
            ['township' => 'Lewe', 'state' => 'Naypyitaw Union Territory'],
            ['township' => 'Zabuthiri', 'state' => 'Naypyitaw Union Territory'],
            ['township' => 'Taunggyi', 'state' => 'Shan State'],
            ['township' => 'Lashio', 'state' => 'Shan State'],
            ['township' => 'Muse', 'state' => 'Shan State'],
            ['township' => 'Kengtung', 'state' => 'Shan State'],
            ['township' => 'Kalaw', 'state' => 'Shan State'],
            ['township' => 'Loikaw', 'state' => 'Kayah State'],
            ['township' => 'Hpa-An', 'state' => 'Kayin State'],
            ['township' => 'Mawlamyine', 'state' => 'Mon State'],
            ['township' => 'Thaton', 'state' => 'Mon State'],
            ['township' => 'Sittwe', 'state' => 'Rakhine State'],
            ['township' => 'Kyaukpyu', 'state' => 'Rakhine State'],
            ['township' => 'Mrauk-U', 'state' => 'Rakhine State'],
            ['township' => 'Myitkyina', 'state' => 'Kachin State'],
            ['township' => 'Bhamo', 'state' => 'Kachin State'],
            ['township' => 'Hakha', 'state' => 'Chin State'],
            ['township' => 'Monywa', 'state' => 'Sagaing Region'],
            ['township' => 'Shwebo', 'state' => 'Sagaing Region'],
            ['township' => 'Sagaing', 'state' => 'Sagaing Region'],
            ['township' => 'Pakokku', 'state' => 'Magway Region'],
            ['township' => 'Magway', 'state' => 'Magway Region'],
            ['township' => 'Yenangyaung', 'state' => 'Magway Region'],
            ['township' => 'Bago', 'state' => 'Bago Region'],
            ['township' => 'Taungoo', 'state' => 'Bago Region'],
            ['township' => 'Pyay', 'state' => 'Bago Region'],
            ['township' => 'Pathein', 'state' => 'Ayeyarwady Region'],
            ['township' => 'Hinthada', 'state' => 'Ayeyarwady Region'],
            ['township' => 'Myaungmya', 'state' => 'Ayeyarwady Region'],
            ['township' => 'Dawei', 'state' => 'Tanintharyi Region'],
            ['township' => 'Myeik', 'state' => 'Tanintharyi Region'],
            ['township' => 'Kawthaung', 'state' => 'Tanintharyi Region'],
        ];
    }
}

