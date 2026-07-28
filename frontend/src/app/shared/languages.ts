const ALL_LANGUAGES = [
  { label: 'Arabic', value: 'ar' },
  { label: 'Bengali', value: 'bn' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Catalan', value: 'ca' },
  { label: 'Chinese (Simplified)', value: 'zh' },
  { label: 'Chinese (Traditional)', value: 'zt' },
  { label: 'Croatian', value: 'hr' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Dutch', value: 'nl' },
  { label: 'English', value: 'en' },
  { label: 'Estonian', value: 'et' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Greek', value: 'el' },
  { label: 'Hebrew', value: 'he' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Icelandic', value: 'is' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Lithuanian', value: 'lt' },
  { label: 'Malay', value: 'ms' },
  { label: 'Norwegian', value: 'no' },
  { label: 'Persian', value: 'fa' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Portuguese (Brazil)', value: 'pb' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Russian', value: 'ru' },
  { label: 'Serbian', value: 'sr' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Spanish', value: 'es' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Thai', value: 'th' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Vietnamese', value: 'vi' },
];

export function getLanguageOptions(): { label: string; value: string }[] {
  const browserLangs = navigator.languages
    .map(l => l.split('-')[0].toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i);

  const preferred = ALL_LANGUAGES.filter(l => browserLangs.includes(l.value));
  const rest = ALL_LANGUAGES.filter(l => !browserLangs.includes(l.value));

  if (preferred.length === 0) return ALL_LANGUAGES;

  return [
    ...preferred.map(l => ({ ...l, label: `★ ${l.label}` })),
    ...rest,
  ];
}
