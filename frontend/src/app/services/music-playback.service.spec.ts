import { TestBed } from '@angular/core/testing';
import { MusicPlaybackService } from './music-playback.service';

class MockAudio {
  src = '';
  volume = 1;
  loop = false;
  currentTime = 0;
  duration = 0;
  paused = false;
  private listeners: Record<string, Function[]> = {};

  addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }

  emit(event: string) {
    (this.listeners[event] || []).forEach(fn => fn());
  }
}

describe('MusicPlaybackService', () => {
  let service: MusicPlaybackService;
  let mockAudio: MockAudio;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MusicPlaybackService] });
    service = TestBed.inject(MusicPlaybackService);

    mockAudio = new MockAudio();
    jest.spyOn(globalThis, 'Audio').mockImplementation(() => mockAudio as any);

    // Disable fading for predictable tests
    service.setFadeDuration(0);
  });

  afterEach(() => {
    service.stopAll();
    jest.restoreAllMocks();
  });

  describe('getMasterState', () => {
    it('should return default master state', () => {
      const state = service.getMasterState('w1');
      expect(state.volume).toBe(100);
      expect(state.muted).toBe(false);
    });
  });

  describe('setMasterVolume', () => {
    it('should update master volume', () => {
      service.setMasterVolume('w1', 50);
      expect(service.getMasterState('w1').volume).toBe(50);
    });

    it('should mute when volume set to 0', () => {
      service.setMasterVolume('w1', 0);
      expect(service.getMasterState('w1').muted).toBe(true);
    });
  });

  describe('toggleMasterMute', () => {
    it('should toggle muted state', () => {
      service.toggleMasterMute('w1');
      expect(service.getMasterState('w1').muted).toBe(true);

      service.toggleMasterMute('w1');
      expect(service.getMasterState('w1').muted).toBe(false);
    });
  });

  describe('play', () => {
    const files = [{ fileName: 'a.mp3', fileDataUrl: 'data:audio/mp3;base64,abc' }];

    it('should start playback and track state', () => {
      service.play('w1', 'm1', files, 80, false, false, false);

      const state = service.getPlaybackState('w1', 'm1');
      expect(state).toBeDefined();
      expect(state!.isPlaying).toBe(true);
      expect(state!.isPaused).toBe(false);
    });

    it('should not play with empty files', () => {
      service.play('w1', 'm1', [], 80, false, false, false);

      expect(service.getPlaybackState('w1', 'm1')).toBeUndefined();
    });

    it('should not play files without dataUrl', () => {
      service.play('w1', 'm1', [{ fileName: 'a.mp3', fileDataUrl: '' }], 80, false, false, false);

      expect(service.getPlaybackState('w1', 'm1')).toBeUndefined();
    });

    it('should stop other tracks when allowMultiple is false', () => {
      service.play('w1', 'm1', files, 80, false, false, false);
      service.play('w1', 'm2', files, 80, false, false, false);

      expect(service.getPlaybackState('w1', 'm1')).toBeUndefined();
      expect(service.getPlaybackState('w1', 'm2')).toBeDefined();
    });

    it('should allow multiple tracks when allowMultiple is true', () => {
      service.play('w1', 'm1', files, 80, false, false, true);
      service.play('w1', 'm2', files, 80, false, false, true);

      expect(service.getPlaybackState('w1', 'm1')).toBeDefined();
      expect(service.getPlaybackState('w1', 'm2')).toBeDefined();
    });
  });

  describe('pause / resume', () => {
    const files = [{ fileName: 'a.mp3', fileDataUrl: 'data:audio/mp3;base64,abc' }];

    it('should pause and resume playback', () => {
      service.play('w1', 'm1', files, 80, false, false, false);

      service.pause('w1', 'm1');
      expect(service.isPaused('w1', 'm1')).toBe(true);
      expect(service.isPlaying('w1', 'm1')).toBe(false);

      service.resume('w1', 'm1');
      expect(service.isPlaying('w1', 'm1')).toBe(true);
      expect(service.isPaused('w1', 'm1')).toBe(false);
    });
  });

  describe('stop', () => {
    it('should cleanup playback state', () => {
      const files = [{ fileName: 'a.mp3', fileDataUrl: 'data:audio/mp3;base64,abc' }];
      service.play('w1', 'm1', files, 80, false, false, false);

      service.stop('w1', 'm1');

      expect(service.getPlaybackState('w1', 'm1')).toBeUndefined();
      expect(service.isPlaying('w1', 'm1')).toBe(false);
    });
  });

  describe('stopAll', () => {
    it('should stop all active playback', () => {
      const files = [{ fileName: 'a.mp3', fileDataUrl: 'data:audio/mp3;base64,abc' }];
      service.play('w1', 'm1', files, 80, false, false, true);
      service.play('w1', 'm2', files, 80, false, false, true);

      service.stopAll();

      expect(service.getPlaybackState('w1', 'm1')).toBeUndefined();
      expect(service.getPlaybackState('w1', 'm2')).toBeUndefined();
    });
  });

  describe('setTrackVolume', () => {
    it('should update track volume', () => {
      const files = [{ fileName: 'a.mp3', fileDataUrl: 'data:audio/mp3;base64,abc' }];
      service.play('w1', 'm1', files, 80, false, false, false);

      service.setTrackVolume('w1', 'm1', 50);

      expect(service.getPlaybackState('w1', 'm1')!.volume).toBe(50);
    });
  });

  describe('toggleLoop', () => {
    it('should toggle loop state', () => {
      const files = [{ fileName: 'a.mp3', fileDataUrl: 'data:audio/mp3;base64,abc' }];
      service.play('w1', 'm1', files, 80, false, false, false);

      service.toggleLoop('w1', 'm1');
      expect(service.getPlaybackState('w1', 'm1')!.loop).toBe(true);

      service.toggleLoop('w1', 'm1');
      expect(service.getPlaybackState('w1', 'm1')!.loop).toBe(false);
    });
  });

  describe('getProgress / getElapsed / getDuration', () => {
    it('should return 0 for nonexistent playback', () => {
      expect(service.getProgress('w1', 'm1')).toBe(0);
      expect(service.getElapsed('w1', 'm1')).toBe(0);
      expect(service.getDuration('w1', 'm1')).toBe(0);
    });
  });

  describe('getAllStatesForWidget', () => {
    it('should return all states for a widget', () => {
      const files = [{ fileName: 'a.mp3', fileDataUrl: 'data:audio/mp3;base64,abc' }];
      service.play('w1', 'm1', files, 80, false, false, true);
      service.play('w1', 'm2', files, 80, false, false, true);
      service.play('w2', 'm3', files, 80, false, false, true);

      const states = service.getAllStatesForWidget('w1');

      expect(states.size).toBe(2);
      expect(states.has('m1')).toBe(true);
      expect(states.has('m2')).toBe(true);
    });
  });

  describe('stateChanges', () => {
    it('should emit on state changes', () => {
      let emitCount = 0;
      service.stateChanges.subscribe(() => emitCount++);

      const files = [{ fileName: 'a.mp3', fileDataUrl: 'data:audio/mp3;base64,abc' }];
      const before = emitCount;
      service.play('w1', 'm1', files, 80, false, false, false);

      expect(emitCount).toBeGreaterThan(before);
    });
  });
});
