export interface MockSubtitleSearchResult {
  id: string;
  attributes: {
    subtitle_id: string;
    language: string;
    release: string;
    files: { file_id: number; file_name: string }[];
  };
}

export function getMockSubtitleResults(language: string): MockSubtitleSearchResult[] {
  return [
    {
      id: '1001',
      attributes: {
        subtitle_id: '1001',
        language,
        release: 'Mock.Release.720p.WEB-DL.x264',
        files: [{ file_id: 5001, file_name: `subtitle_${language}.srt` }],
      },
    },
    {
      id: '1002',
      attributes: {
        subtitle_id: '1002',
        language,
        release: 'Mock.Release.1080p.BluRay.x264',
        files: [{ file_id: 5002, file_name: `subtitle_${language}_alt.srt` }],
      },
    },
  ];
}

export function getMockSrtContent(): string {
  return `1
00:00:01,000 --> 00:00:04,000
Welcome to LetsFlix.

2
00:00:05,000 --> 00:00:08,000
This is a mock subtitle file
for testing purposes.

3
00:00:09,000 --> 00:00:12,000
The subtitles system is working correctly.

4
00:00:13,000 --> 00:00:16,500
Enjoy your movie!

5
00:01:00,000 --> 00:01:03,500
Scene continues with dialogue.

6
00:02:30,000 --> 00:02:35,000
Another line of dialogue
with multiple lines.
`;
}
