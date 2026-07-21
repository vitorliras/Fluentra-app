import { Injectable } from '@angular/core';
import { encodeWav, mergeFloat32Arrays, resampleTo16kHz } from '../../../shared/audio/wav-encoder';

const SPEECH_RMS_THRESHOLD = 0.02;
const SILENCE_DURATION_MS = 1200;
const TARGET_SAMPLE_RATE = 16000;

@Injectable({ providedIn: 'root' })
export class AudioRecorderService {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private samples: Float32Array[] = [];
  private hasDetectedSpeech = false;
  private silenceStartedAt: number | null = null;
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private onStopped: ((audio: Blob) => void) | null = null;

  async start(maxDurationMs: number, onStopped: (audio: Blob) => void): Promise<void> {
    this.samples = [];
    this.hasDetectedSpeech = false;
    this.silenceStartedAt = null;
    this.onStopped = onStopped;

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (event) => this.handleAudioProcess(event);
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.maxDurationTimer = setTimeout(() => this.stop(), maxDurationMs);
  }

  stop(): void {
    if (!this.audioContext) {
      return;
    }

    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }

    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());

    const sampleRate = this.audioContext.sampleRate;
    const merged = mergeFloat32Arrays(this.samples);
    const resampled = resampleTo16kHz(merged, sampleRate);
    const wav = encodeWav(resampled, TARGET_SAMPLE_RATE);

    void this.audioContext.close();
    this.audioContext = null;

    const callback = this.onStopped;
    this.onStopped = null;
    callback?.(wav);
  }

  private handleAudioProcess(event: AudioProcessingEvent): void {
    const input = event.inputBuffer.getChannelData(0);
    this.samples.push(new Float32Array(input));

    const rms = calculateRms(input);
    if (rms >= SPEECH_RMS_THRESHOLD) {
      this.hasDetectedSpeech = true;
      this.silenceStartedAt = null;
      return;
    }

    if (!this.hasDetectedSpeech) {
      return;
    }

    if (this.silenceStartedAt === null) {
      this.silenceStartedAt = Date.now();
      return;
    }

    if (Date.now() - this.silenceStartedAt >= SILENCE_DURATION_MS) {
      this.stop();
    }
  }
}

function calculateRms(samples: Float32Array): number {
  let sum = 0;
  for (const sample of samples) {
    sum += sample * sample;
  }
  return Math.sqrt(sum / samples.length);
}
