import { describe, it, expect } from 'vitest';
import { convertSrtToVtt } from '../src/utils/srt-to-vtt.js';

describe('SRT to VTT Conversion', () => {
  it('should add WEBVTT header', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Hello world`;

    const vtt = convertSrtToVtt(srt);
    expect(vtt.startsWith('WEBVTT\n\n')).toBe(true);
  });

  it('should convert comma timestamps to dots', () => {
    const srt = `1
00:00:01,500 --> 00:00:04,750
Test subtitle`;

    const vtt = convertSrtToVtt(srt);
    expect(vtt).toContain('00:00:01.500 --> 00:00:04.750');
  });

  it('should preserve subtitle text', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:05,000 --> 00:00:08,000
Second subtitle`;

    const vtt = convertSrtToVtt(srt);
    expect(vtt).toContain('Hello world');
    expect(vtt).toContain('Second subtitle');
  });

  it('should handle multi-line subtitles', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Line one
Line two`;

    const vtt = convertSrtToVtt(srt);
    expect(vtt).toContain('Line one\nLine two');
  });

  it('should handle Windows line endings', () => {
    const srt = "1\r\n00:00:01,000 --> 00:00:04,000\r\nHello\r\n\r\n2\r\n00:00:05,000 --> 00:00:08,000\r\nWorld";

    const vtt = convertSrtToVtt(srt);
    expect(vtt).toContain('WEBVTT');
    expect(vtt).toContain('Hello');
    expect(vtt).toContain('World');
  });

  it('should skip sequence numbers', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
First

2
00:00:05,000 --> 00:00:08,000
Second`;

    const vtt = convertSrtToVtt(srt);
    expect(vtt).not.toMatch(/^1$/m);
    expect(vtt).not.toMatch(/^2$/m);
  });
});
