// Real-time Voice Streaming Client for Gemini 3.8 Live API (Live API)
// Bridges browser microphone (16kHz PCM) and model audio (24kHz PCM) via WebSocket

export type LiveStatus = 
  | 'idle' 
  | 'connecting' 
  | 'connected' 
  | 'listening' 
  | 'speaking' 
  | 'interrupted' 
  | 'error' 
  | 'fallback';

export interface LiveVoiceOptions {
  voice?: string; // 'Zephyr' | 'Aoede' | 'Kore' | 'Fenrir' | 'Puck' | 'Charon'
  systemInstruction?: string;
  onStatusChange?: (status: LiveStatus) => void;
  onTranscript?: (text: string, isModel: boolean) => void;
  onError?: (errMessage: string) => void;
  onUserAudioLevel?: (level: number) => void;
  onModelAudioLevel?: (level: number) => void;
}

export class GeminiLiveVoiceSession {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private activeSources: AudioBufferSourceNode[] = [];
  private nextStartTime = 0;
  private status: LiveStatus = 'idle';
  private options: LiveVoiceOptions;
  private isMuted = false;
  private reconnectAttempts = 0;

  constructor(options: LiveVoiceOptions = {}) {
    this.options = options;
  }

  public getStatus(): LiveStatus {
    return this.status;
  }

  private setStatus(newStatus: LiveStatus) {
    this.status = newStatus;
    if (this.options.onStatusChange) {
      this.options.onStatusChange(newStatus);
    }
  }

  // Connect to the server WebSocket bridge
  public async start(): Promise<void> {
    if (this.status === 'connecting' || this.status === 'connected' || this.status === 'listening') {
      return;
    }

    this.setStatus('connecting');

    try {
      // 1. Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      // 2. Establish WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        // Send initial configuration
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'config',
            voice: this.options.voice || 'Zephyr',
            systemInstruction: this.options.systemInstruction
          }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            this.setStatus('listening');
            this.initMicrophoneCapture();
          } else if (msg.type === 'audio' && msg.audio) {
            this.setStatus('speaking');
            this.playModelAudioChunk(msg.audio);
          } else if (msg.type === 'text' && msg.text) {
            if (this.options.onTranscript) {
              this.options.onTranscript(msg.text, true);
            }
          } else if (msg.type === 'interrupted') {
            this.stopAllPlayback();
            this.setStatus('listening');
          } else if (msg.type === 'turnComplete') {
            // Once playback ends, returns to listening
            if (this.activeSources.length === 0) {
              this.setStatus('listening');
            }
          } else if (msg.type === 'error') {
            console.warn('Gemini Live WS error message:', msg.error || msg.message);
            if (this.options.onError) {
              this.options.onError(msg.message || msg.error || 'خطأ في الخدمة الصوتية');
            }
          }
        } catch (err) {
          console.error('Error handling live message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
        if (this.options.onError) {
          this.options.onError('تعذر الاتصال بـ Gemini Live API عبر WebSocket.');
        }
        this.setStatus('fallback');
      };

      this.ws.onclose = () => {
        if (this.status !== 'idle' && this.status !== 'fallback') {
          this.cleanupAudio();
          this.setStatus('idle');
        }
      };

    } catch (err: any) {
      console.error('Error starting live session:', err);
      const errMsg = err?.name === 'NotAllowedError' 
        ? 'يرجى السماح بالوصول إلى الميكروفون لبدء المحادثة الصوتية.' 
        : 'تعذر تشغيل الميكروفون أو الاتصال بالخادم.';
      if (this.options.onError) {
        this.options.onError(errMsg);
      }
      this.setStatus('error');
      this.stop();
      throw err;
    }
  }

  // Setup 16kHz microphone audio capture and streaming to Gemini Live
  private initMicrophoneCapture() {
    if (!this.mediaStream) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      
      const source = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
      
      // Analyser for user audio visualizer
      this.analyserNode = this.inputAudioCtx.createAnalyser();
      this.analyserNode.fftSize = 64;
      source.connect(this.analyserNode);

      // Script processor for capturing PCM chunks
      this.processorNode = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);
      
      this.processorNode.onaudioprocess = (e) => {
        if (this.isMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputChannelData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for visualizer
        let sum = 0;
        for (let i = 0; i < inputChannelData.length; i++) {
          sum += inputChannelData[i] * inputChannelData[i];
        }
        const rms = Math.sqrt(sum / inputChannelData.length);
        const level = Math.min(1, rms * 5); // Boost scale
        if (this.options.onUserAudioLevel) {
          this.options.onUserAudioLevel(level);
        }

        // Convert Float32Array to 16-bit PCM Little Endian
        const base64Pcm = this.floatTo16BitPCMBase64(inputChannelData);
        
        // Stream to Gemini Live
        this.ws.send(JSON.stringify({
          type: 'audio',
          audio: base64Pcm
        }));
      };

      source.connect(this.processorNode);
      this.processorNode.connect(this.inputAudioCtx.destination);
    } catch (err) {
      console.error('Error initializing microphone capture:', err);
    }
  }

  // Play gapless 24kHz audio from Gemini Live
  private playModelAudioChunk(base64Pcm: string) {
    try {
      if (!this.outputAudioCtx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      }

      if (this.outputAudioCtx.state === 'suspended') {
        this.outputAudioCtx.resume();
      }

      const binaryStr = window.atob(base64Pcm);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      
      let sum = 0;
      for (let i = 0; i < int16Array.length; i++) {
        const val = int16Array[i] / 32768.0;
        float32Array[i] = val;
        sum += val * val;
      }

      // Model audio level for visualizer
      const rms = Math.sqrt(sum / int16Array.length);
      const level = Math.min(1, rms * 4);
      if (this.options.onModelAudioLevel) {
        this.options.onModelAudioLevel(level);
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioCtx.destination);

      // Gapless scheduling
      const now = this.outputAudioCtx.currentTime;
      if (this.nextStartTime < now) {
        this.nextStartTime = now;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(source);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          if (this.options.onModelAudioLevel) {
            this.options.onModelAudioLevel(0);
          }
          if (this.status === 'speaking') {
            this.setStatus('listening');
          }
        }
      };
    } catch (e) {
      console.error('Error playing model audio chunk:', e);
    }
  }

  // Interruption: immediately stop speaking and listen
  public interrupt() {
    this.stopAllPlayback();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'interrupt' }));
    }
    this.setStatus('listening');
  }

  private stopAllPlayback() {
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {}
    }
    this.activeSources = [];
    this.nextStartTime = 0;
    if (this.options.onModelAudioLevel) {
      this.options.onModelAudioLevel(0);
    }
  }

  // Send a text prompt over the live session
  public sendText(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text', text }));
      if (this.options.onTranscript) {
        this.options.onTranscript(text, false);
      }
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Convert Float32Array to 16-bit PCM Little Endian base64 string
  private floatTo16BitPCMBase64(input: Float32Array): string {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private cleanupAudio() {
    this.stopAllPlayback();

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch (e) {}
      this.processorNode = null;
    }

    if (this.inputAudioCtx) {
      try {
        this.inputAudioCtx.close();
      } catch (e) {}
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx) {
      try {
        this.outputAudioCtx.close();
      } catch (e) {}
      this.outputAudioCtx = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  // Gracefully stop the entire Live API voice session
  public stop() {
    this.cleanupAudio();

    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'end' }));
        }
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    this.setStatus('idle');
  }
}
