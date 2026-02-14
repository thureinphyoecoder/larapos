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
        $user = $request->user();

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

        $profileRows = collect();
        $orderRows = collect();
        if ($user) {
            $profileRows = DB::table('user_profiles')
                ->select(['address_line_1', 'city', 'state'])
                ->where('user_id', $user->id)
                ->where(function ($query) use ($like) {
                    $query->where('address_line_1', 'like', $like)
                        ->orWhere('city', 'like', $like)
                        ->orWhere('state', 'like', $like);
                })
                ->whereNotNull('address_line_1')
                ->limit(30)
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
                ->where('user_id', $user->id)
                ->whereNotNull('address')
                ->where('address', 'like', $like)
                ->limit(30)
                ->get()
                ->map(fn ($row) => [
                    'label' => trim((string) ($row->address ?? '')),
                    'township' => null,
                    'state' => null,
                    'source' => 'order',
                ]);
        }

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
            ['township' => 'ရန်ကုန်', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Ahlone', 'state' => 'Yangon Region'],
            ['township' => 'အလုံ', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Bahan', 'state' => 'Yangon Region'],
            ['township' => 'ဗဟန်း', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Dagon', 'state' => 'Yangon Region'],
            ['township' => 'ဒဂုံ', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Insein', 'state' => 'Yangon Region'],
            ['township' => 'အင်းစိန်', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Hlaing', 'state' => 'Yangon Region'],
            ['township' => 'လှိုင်', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Hlaingthaya', 'state' => 'Yangon Region'],
            ['township' => 'လှိုင်သာယာ', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Kamayut', 'state' => 'Yangon Region'],
            ['township' => 'ကမာရွတ်', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Kyauktada', 'state' => 'Yangon Region'],
            ['township' => 'ကျောက်တံတား', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Lanmadaw', 'state' => 'Yangon Region'],
            ['township' => 'လမ်းမတော်', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Mayangone', 'state' => 'Yangon Region'],
            ['township' => 'မရမ်းကုန်း', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Mingaladon', 'state' => 'Yangon Region'],
            ['township' => 'မင်္ဂလာဒုံ', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'North Dagon', 'state' => 'Yangon Region'],
            ['township' => 'မြောက်ဒဂုံ', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'South Dagon', 'state' => 'Yangon Region'],
            ['township' => 'တောင်ဒဂုံ', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Shwepyithar', 'state' => 'Yangon Region'],
            ['township' => 'ရွှေပြည်သာ', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Tamwe', 'state' => 'Yangon Region'],
            ['township' => 'တာမွေ', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Thingangyun', 'state' => 'Yangon Region'],
            ['township' => 'သင်္ဃန်းကျွန်း', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Thaketa', 'state' => 'Yangon Region'],
            ['township' => 'သာကေတ', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Yankin', 'state' => 'Yangon Region'],
            ['township' => 'ရန်ကင်း', 'state' => 'ရန်ကုန်တိုင်း'],
            ['township' => 'Mandalay', 'state' => 'Mandalay Region'],
            ['township' => 'မန္တလေး', 'state' => 'မန္တလေးတိုင်း'],
            ['township' => 'Amarapura', 'state' => 'Mandalay Region'],
            ['township' => 'အမရပူရ', 'state' => 'မန္တလေးတိုင်း'],
            ['township' => 'Chanayethazan', 'state' => 'Mandalay Region'],
            ['township' => 'ချမ်းအေးသာဇံ', 'state' => 'မန္တလေးတိုင်း'],
            ['township' => 'Chanmyathazi', 'state' => 'Mandalay Region'],
            ['township' => 'ချမ်းမြသာစည်', 'state' => 'မန္တလေးတိုင်း'],
            ['township' => 'Maha Aungmye', 'state' => 'Mandalay Region'],
            ['township' => 'မဟာအောင်မြေ', 'state' => 'မန္တလေးတိုင်း'],
            ['township' => 'Pyigyidagun', 'state' => 'Mandalay Region'],
            ['township' => 'ပြည်ကြီးတံခွန်', 'state' => 'မန္တလေးတိုင်း'],
            ['township' => 'Patheingyi', 'state' => 'Mandalay Region'],
            ['township' => 'ပုသိမ်ကြီး', 'state' => 'မန္တလေးတိုင်း'],
            ['township' => 'Pyin Oo Lwin', 'state' => 'Mandalay Region'],
            ['township' => 'ပြင်ဦးလွင်', 'state' => 'မန္တလေးတိုင်း'],
            ['township' => 'Naypyitaw', 'state' => 'Naypyitaw Union Territory'],
            ['township' => 'နေပြည်တော်', 'state' => 'ပြည်ထောင်စုနယ်မြေ'],
            ['township' => 'Pyinmana', 'state' => 'Naypyitaw Union Territory'],
            ['township' => 'ပျဉ်းမနား', 'state' => 'ပြည်ထောင်စုနယ်မြေ'],
            ['township' => 'Tatkon', 'state' => 'Naypyitaw Union Territory'],
            ['township' => 'တပ်ကုန်း', 'state' => 'ပြည်ထောင်စုနယ်မြေ'],
            ['township' => 'Lewe', 'state' => 'Naypyitaw Union Territory'],
            ['township' => 'လယ်ဝေး', 'state' => 'ပြည်ထောင်စုနယ်မြေ'],
            ['township' => 'Zabuthiri', 'state' => 'Naypyitaw Union Territory'],
            ['township' => 'ဇမ္ဗူသီရိ', 'state' => 'ပြည်ထောင်စုနယ်မြေ'],
            ['township' => 'Taunggyi', 'state' => 'Shan State'],
            ['township' => 'တောင်ကြီး', 'state' => 'ရှမ်းပြည်နယ်'],
            ['township' => 'Lashio', 'state' => 'Shan State'],
            ['township' => 'လားရှိုး', 'state' => 'ရှမ်းပြည်နယ်'],
            ['township' => 'Muse', 'state' => 'Shan State'],
            ['township' => 'မူဆယ်', 'state' => 'ရှမ်းပြည်နယ်'],
            ['township' => 'Kengtung', 'state' => 'Shan State'],
            ['township' => 'ကျိုင်းတုံ', 'state' => 'ရှမ်းပြည်နယ်'],
            ['township' => 'Kalaw', 'state' => 'Shan State'],
            ['township' => 'ကလော', 'state' => 'ရှမ်းပြည်နယ်'],
            ['township' => 'Loikaw', 'state' => 'Kayah State'],
            ['township' => 'လွိုင်ကော်', 'state' => 'ကယားပြည်နယ်'],
            ['township' => 'Hpa-An', 'state' => 'Kayin State'],
            ['township' => 'ဘားအံ', 'state' => 'ကရင်ပြည်နယ်'],
            ['township' => 'Mawlamyine', 'state' => 'Mon State'],
            ['township' => 'မော်လမြိုင်', 'state' => 'မွန်ပြည်နယ်'],
            ['township' => 'Thaton', 'state' => 'Mon State'],
            ['township' => 'သထုံ', 'state' => 'မွန်ပြည်နယ်'],
            ['township' => 'Sittwe', 'state' => 'Rakhine State'],
            ['township' => 'စစ်တွေ', 'state' => 'ရခိုင်ပြည်နယ်'],
            ['township' => 'Kyaukpyu', 'state' => 'Rakhine State'],
            ['township' => 'ကျောက်ဖြူ', 'state' => 'ရခိုင်ပြည်နယ်'],
            ['township' => 'Mrauk-U', 'state' => 'Rakhine State'],
            ['township' => 'မြောက်ဦး', 'state' => 'ရခိုင်ပြည်နယ်'],
            ['township' => 'Myitkyina', 'state' => 'Kachin State'],
            ['township' => 'မြစ်ကြီးနား', 'state' => 'ကချင်ပြည်နယ်'],
            ['township' => 'Bhamo', 'state' => 'Kachin State'],
            ['township' => 'ဗန်းမော်', 'state' => 'ကချင်ပြည်နယ်'],
            ['township' => 'Hakha', 'state' => 'Chin State'],
            ['township' => 'ဟားခါး', 'state' => 'ချင်းပြည်နယ်'],
            ['township' => 'Monywa', 'state' => 'Sagaing Region'],
            ['township' => 'မုံရွာ', 'state' => 'စစ်ကိုင်းတိုင်း'],
            ['township' => 'Shwebo', 'state' => 'Sagaing Region'],
            ['township' => 'ရွှေဘို', 'state' => 'စစ်ကိုင်းတိုင်း'],
            ['township' => 'Sagaing', 'state' => 'Sagaing Region'],
            ['township' => 'စစ်ကိုင်း', 'state' => 'စစ်ကိုင်းတိုင်း'],
            ['township' => 'Pakokku', 'state' => 'Magway Region'],
            ['township' => 'ပခုက္ကူ', 'state' => 'မကွေးတိုင်း'],
            ['township' => 'Magway', 'state' => 'Magway Region'],
            ['township' => 'မကွေး', 'state' => 'မကွေးတိုင်း'],
            ['township' => 'Yenangyaung', 'state' => 'Magway Region'],
            ['township' => 'ရေနံချောင်း', 'state' => 'မကွေးတိုင်း'],
            ['township' => 'Bago', 'state' => 'Bago Region'],
            ['township' => 'ပဲခူး', 'state' => 'ပဲခူးတိုင်း'],
            ['township' => 'Taungoo', 'state' => 'Bago Region'],
            ['township' => 'တောင်ငူ', 'state' => 'ပဲခူးတိုင်း'],
            ['township' => 'Pyay', 'state' => 'Bago Region'],
            ['township' => 'ပြည်', 'state' => 'ပဲခူးတိုင်း'],
            ['township' => 'Pathein', 'state' => 'Ayeyarwady Region'],
            ['township' => 'ပုသိမ်', 'state' => 'ဧရာဝတီတိုင်း'],
            ['township' => 'Hinthada', 'state' => 'Ayeyarwady Region'],
            ['township' => 'ဟင်္သာတ', 'state' => 'ဧရာဝတီတိုင်း'],
            ['township' => 'Myaungmya', 'state' => 'Ayeyarwady Region'],
            ['township' => 'မြောင်းမြ', 'state' => 'ဧရာဝတီတိုင်း'],
            ['township' => 'Dawei', 'state' => 'Tanintharyi Region'],
            ['township' => 'ထားဝယ်', 'state' => 'တနင်္သာရီတိုင်း'],
            ['township' => 'Myeik', 'state' => 'Tanintharyi Region'],
            ['township' => 'မြိတ်', 'state' => 'တနင်္သာရီတိုင်း'],
            ['township' => 'Kawthaung', 'state' => 'Tanintharyi Region'],
            ['township' => 'ကော့သောင်း', 'state' => 'တနင်္သာရီတိုင်း'],
        ];
    }
}
