export const PREFECTURES = [
  { code: '01', name: '北海道', nameEn: 'Hokkaido', municipalityCount: 194 }, { code: '02', name: '青森県', nameEn: 'Aomori', municipalityCount: 40 }, { code: '03', name: '岩手県', nameEn: 'Iwate', municipalityCount: 33 }, { code: '04', name: '宮城県', nameEn: 'Miyagi', municipalityCount: 39 }, { code: '05', name: '秋田県', nameEn: 'Akita', municipalityCount: 25 }, { code: '06', name: '山形県', nameEn: 'Yamagata', municipalityCount: 35 }, { code: '07', name: '福島県', nameEn: 'Fukushima', municipalityCount: 59 },
  { code: '08', name: '茨城県', nameEn: 'Ibaraki', municipalityCount: 44 }, { code: '09', name: '栃木県', nameEn: 'Tochigi', municipalityCount: 25 }, { code: '10', name: '群馬県', nameEn: 'Gunma', municipalityCount: 35 }, { code: '11', name: '埼玉県', nameEn: 'Saitama', municipalityCount: 72 }, { code: '12', name: '千葉県', nameEn: 'Chiba', municipalityCount: 59 }, { code: '13', name: '東京都', nameEn: 'Tokyo', municipalityCount: 53 }, { code: '14', name: '神奈川県', nameEn: 'Kanagawa', municipalityCount: 58 },
  { code: '15', name: '新潟県', nameEn: 'Niigata', municipalityCount: 37 }, { code: '16', name: '富山県', nameEn: 'Toyama', municipalityCount: 15 }, { code: '17', name: '石川県', nameEn: 'Ishikawa', municipalityCount: 19 }, { code: '18', name: '福井県', nameEn: 'Fukui', municipalityCount: 17 }, { code: '19', name: '山梨県', nameEn: 'Yamanashi', municipalityCount: 27 }, { code: '20', name: '長野県', nameEn: 'Nagano', municipalityCount: 77 }, { code: '21', name: '岐阜県', nameEn: 'Gifu', municipalityCount: 42 },
  { code: '22', name: '静岡県', nameEn: 'Shizuoka', municipalityCount: 43 }, { code: '23', name: '愛知県', nameEn: 'Aichi', municipalityCount: 69 }, { code: '24', name: '三重県', nameEn: 'Mie', municipalityCount: 29 }, { code: '25', name: '滋賀県', nameEn: 'Shiga', municipalityCount: 19 }, { code: '26', name: '京都府', nameEn: 'Kyoto', municipalityCount: 36 }, { code: '27', name: '大阪府', nameEn: 'Osaka', municipalityCount: 72 }, { code: '28', name: '兵庫県', nameEn: 'Hyogo', municipalityCount: 49 },
  { code: '29', name: '奈良県', nameEn: 'Nara', municipalityCount: 39 }, { code: '30', name: '和歌山県', nameEn: 'Wakayama', municipalityCount: 30 }, { code: '31', name: '鳥取県', nameEn: 'Tottori', municipalityCount: 19 }, { code: '32', name: '島根県', nameEn: 'Shimane', municipalityCount: 19 }, { code: '33', name: '岡山県', nameEn: 'Okayama', municipalityCount: 30 }, { code: '34', name: '広島県', nameEn: 'Hiroshima', municipalityCount: 30 }, { code: '35', name: '山口県', nameEn: 'Yamaguchi', municipalityCount: 19 },
  { code: '36', name: '徳島県', nameEn: 'Tokushima', municipalityCount: 24 }, { code: '37', name: '香川県', nameEn: 'Kagawa', municipalityCount: 17 }, { code: '38', name: '愛媛県', nameEn: 'Ehime', municipalityCount: 20 }, { code: '39', name: '高知県', nameEn: 'Kochi', municipalityCount: 34 }, { code: '40', name: '福岡県', nameEn: 'Fukuoka', municipalityCount: 72 }, { code: '41', name: '佐賀県', nameEn: 'Saga', municipalityCount: 20 }, { code: '42', name: '長崎県', nameEn: 'Nagasaki', municipalityCount: 21 },
  { code: '43', name: '熊本県', nameEn: 'Kumamoto', municipalityCount: 49 }, { code: '44', name: '大分県', nameEn: 'Oita', municipalityCount: 18 }, { code: '45', name: '宮崎県', nameEn: 'Miyazaki', municipalityCount: 26 }, { code: '46', name: '鹿児島県', nameEn: 'Kagoshima', municipalityCount: 43 }, { code: '47', name: '沖縄県', nameEn: 'Okinawa', municipalityCount: 41 }
];

export const REGIONS = [
  { code: 'R01', name: '北海道地方', nameEn: 'Hokkaido Region', prefs: ['01'] },
  { code: 'R02', name: '東北地方', nameEn: 'Tohoku Region', prefs: ['02', '03', '04', '05', '06', '07'] },
  { code: 'R03', name: '関東地方', nameEn: 'Kanto Region', prefs: ['08', '09', '10', '11', '12', '13', '14'] },
  { code: 'R04', name: '中部地方', nameEn: 'Chubu Region', prefs: ['15', '16', '17', '18', '19', '20', '21', '22', '23'] },
  { code: 'R05', name: '近畿地方', nameEn: 'Kinki Region', prefs: ['24', '25', '26', '27', '28', '29', '30'] },
  { code: 'R06', name: '中国地方', nameEn: 'Chugoku Region', prefs: ['31', '32', '33', '34', '35'] },
  { code: 'R07', name: '四国地方', nameEn: 'Shikoku Region', prefs: ['36', '37', '38', '39'] },
  { code: 'R08', name: '九州・沖縄地方', nameEn: 'Kyushu/Okinawa Region', prefs: ['40', '41', '42', '43', '44', '45', '46', '47'] },
  { code: 'R09', name: '東海地方', nameEn: 'Tokai Region', prefs: ['21', '22', '23', '24'] }
];

export function getMapName(code: string, geoJsonPrefName: string | undefined, language: 'ja' | 'en'): string {
  if (code === 'JAPAN') {
    return language === 'en' ? 'Japan' : '全国マップ';
  }
  if (code === 'WORLD') {
    return language === 'en' ? 'World' : '世界';
  }
  if (code === 'USA') {
    return language === 'en' ? 'USA' : 'アメリカ';
  }
  if (code === 'EUROPE') {
    return language === 'en' ? 'Europe' : 'ヨーロッパ';
  }

  const pref = PREFECTURES.find(p => p.code === code);
  if (pref) {
    const suffix = language === 'en' ? ' (Municipalities)' : '（市区町村）';
    return (language === 'en' ? pref.nameEn : pref.name) + suffix;
  }

  const region = REGIONS.find(r => r.code === code);
  if (region) {
    return language === 'en' ? region.nameEn : region.name;
  }

  return geoJsonPrefName || code;
}
