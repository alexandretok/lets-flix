export function convertSrtToVtt(srtContent: string): string {
  let vtt = 'WEBVTT\n\n';

  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 2) continue;

    // Skip the sequence number line
    const timeLineIndex = lines.findIndex(l => l.includes('-->'));
    if (timeLineIndex === -1) continue;

    // Convert comma to dot in timestamps
    const timeLine = lines[timeLineIndex].replace(/,/g, '.');

    const textLines = lines.slice(timeLineIndex + 1).join('\n');

    if (textLines.trim()) {
      vtt += `${timeLine}\n${textLines}\n\n`;
    }
  }

  return vtt;
}
