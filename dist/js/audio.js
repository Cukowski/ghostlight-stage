import { formatNumber, t } from './i18n.js?v=audio-1';

function clock(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const whole = Math.max(0, Math.floor(seconds));
  return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
}

export class AudioPlayer {
  constructor({ canStartShow, startShow }) {
    this.canStartShow = canStartShow;
    this.startShow = startShow;
    this.ui = Object.fromEntries(
      [...document.querySelectorAll('#audio-panel [id], #audio-panel, #open-audio')]
        .map(element => [element.id, element])
    );
    const byId = id => this.ui[id];
    this.panel = byId('audio-panel');
    this.trigger = byId('open-audio');
    this.position = byId('audio-seek');
    this.volume = byId('audio-volume');
    this.rate = byId('audio-rate');
    this.loop = byId('audio-loop');
    this.jaw = byId('audio-jaw');
    this.playButton = byId('audio-play');
    this.cueButton = byId('audio-start-show');
    this.seekControls = ['audio-restart', 'audio-back', 'audio-forward'].map(byId);
    this.samples = new Uint8Array(1024);

    this.trigger.onclick = () => this.panel.open ? this.panel.close() : this.open();
    byId('close-audio').onclick = () => this.panel.close();
    this.panel.addEventListener('close', () => {
      this.trigger.setAttribute('aria-expanded', 'false');
      (this.opener?.isConnected ? this.opener : this.trigger).focus();
    });
    this.panel.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        this.panel.close();
      }
    });
    const file = byId('audio-file');
    byId('choose-audio').onclick = () => file.click();
    file.onchange = () => {
      const track = file.files[0];
      if (track) this.load(URL.createObjectURL(track), track.name, true);
      file.value = '';
    };
    byId('audio-link-form').onsubmit = event => {
      event.preventDefault();
      const value = byId('audio-link').value.trim();
      let url;
      try { url = new URL(value); } catch { /* Report invalid links below. */ }
      if (url?.protocol !== 'https:' || url.username || url.password) {
        this.setStatus('Enter a direct HTTPS audio link.');
        return;
      }
      const filename = url.pathname.split('/').pop();
      this.load(url.href, filename || url.hostname, false);
      byId('audio-link').value = '';
      byId('audio-link-form').closest('details').open = false;
    };
    this.playButton.onclick = () => this.media.paused ? this.play() : this.pause();
    this.cueButton.onclick = () => this.play(true);
    this.position.oninput = () => this.seek(Number(this.position.value));
    this.seekControls[0].onclick = () => this.seek(0);
    this.seekControls[1].onclick = () => this.seek(this.media.currentTime - 5);
    this.seekControls[2].onclick = () => this.seek(this.media.currentTime + 5);
    this.volume.oninput = () => { this.applyVolume(); this.refresh(); };
    this.rate.onchange = () => {
      if (this.media) this.media.playbackRate = Number(this.rate.value);
      this.refresh();
    };
    this.loop.onchange = () => { if (this.media) this.media.loop = this.loop.checked; };
    this.refresh();
  }

  open() {
    if (!this.panel.open) {
      this.opener = document.activeElement;
      this.panel.show();
    }
    this.trigger.setAttribute('aria-expanded', 'true');
    this.refresh();
  }

  load(url, name, local) {
    this.pause();
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.gain?.disconnect();
    this.source = this.analyser = this.gain = undefined;
    if (this.media) {
      this.media.removeAttribute('src');
      this.media.load();
    }
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = local ? url : undefined;
    this.name = name;
    const media = new Audio();
    this.media = media;
    media.preload = 'metadata';
    media.loop = this.loop.checked;
    media.playbackRate = Number(this.rate.value);
    for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'seeking', 'play', 'pause', 'ended']) {
      media.addEventListener(event, () => {
        if (this.media !== media) return;
        if (event === 'loadedmetadata') this.setStatus('');
        else this.refresh();
      });
    }
    media.addEventListener('error', () => {
      if (this.media === media) this.setStatus('Could not load this track. Check the file or direct audio link.');
    });
    this.applyVolume();
    this.setStatus('Loading track…');
    media.src = url;
  }

  applyVolume() {
    const volume = Number(this.volume.value) / 100;
    if (this.gain) this.gain.gain.value = volume;
    else if (this.media) {
      this.media.volume = volume;
      this.media.muted = volume === 0;
    }
  }

  async play(withShow = false) {
    const media = this.media;
    if (!media || this.pending || (withShow && !this.canStartShow())) return;
    const attempt = {};
    this.pending = attempt;
    try {
      if (withShow) {
        this.rate.value = '1';
        media.playbackRate = 1;
      }
      if (this.objectUrl && !this.source) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.context ||= new AudioContext();
          this.analyser = this.context.createAnalyser();
          this.analyser.fftSize = this.samples.length;
          this.gain = this.context.createGain();
          this.source = this.context.createMediaElementSource(media);
          this.source.connect(this.analyser);
          this.analyser.connect(this.gain);
          this.gain.connect(this.context.destination);
          media.volume = 1;
          media.muted = false;
          this.applyVolume();
        }
      }
      this.setStatus('');
      const resume = this.source ? this.context.resume() : undefined;
      await Promise.all([resume, media.play()]);
      if (this.pending !== attempt) return;
      if (withShow) {
        if (this.canStartShow()) this.startShow();
        else this.pause();
      }
    } catch {
      if (this.pending === attempt) {
        media.pause();
        this.setStatus('Could not play this track. Try Play again or choose another file.');
      }
    } finally {
      if (this.pending === attempt) {
        this.pending = undefined;
        this.refresh();
      }
    }
  }

  pause() {
    this.pending = undefined;
    this.media?.pause();
    this.refresh();
  }

  seek(seconds) {
    if (Number.isFinite(this.media?.duration)) {
      this.media.currentTime = Math.max(0, Math.min(seconds, this.media.duration));
      this.refresh();
    }
  }

  jawOpening() {
    if (!this.jaw.checked || !this.analyser || this.media.paused) return null;
    this.analyser.getByteTimeDomainData(this.samples);
    let energy = 0;
    for (const value of this.samples) energy += ((value - 128) / 128) ** 2;
    const amplitude = Math.sqrt(energy / this.samples.length);
    return Math.max(0, Math.min(1, (amplitude - .012) * 7));
  }

  setStatus(message) {
    this.status = message;
    this.refresh();
  }

  localize() {
    for (const option of this.rate.options) {
      const decimals = option.value.split('.')[1]?.length || 0;
      option.textContent = formatNumber(Number(option.value), decimals) + '×';
    }
    this.refresh();
  }

  refresh() {
    const media = this.media;
    const ready = Boolean(media?.readyState && !media.error);
    const seekable = ready && Number.isFinite(media.duration) && media.duration > 0;
    const position = media?.currentTime || 0;
    const playing = ready && !media.paused;
    this.ui['audio-track'].textContent = this.name || t('No track loaded');
    const status = this.ui['audio-status'];
    const message = t(this.status || '');
    if (status.textContent !== message) status.textContent = message;
    status.hidden = !this.status;
    this.playButton.textContent = t(playing ? 'Pause audio' : 'Play audio');
    this.playButton.disabled = !ready || (Boolean(this.pending) && !playing);
    this.cueButton.disabled = !ready || Boolean(this.pending) || playing || !this.canStartShow();
    this.jaw.disabled = !this.objectUrl;
    this.position.disabled = !seekable;
    this.position.max = seekable ? media.duration : 1;
    this.position.value = seekable ? position : 0;
    const duration = Math.ceil(media?.duration);
    const time = clock(media?.ended ? duration : position) + ' / ' + clock(duration);
    this.position.setAttribute('aria-valuetext', time);
    this.ui['audio-time'].textContent = time;
    this.ui['audio-remaining'].textContent = seekable
      ? t('{time} left at this speed', { time: clock(Math.ceil((media.duration - position) / media.playbackRate)) })
      : '';
    this.ui['audio-volume-value'].textContent = formatNumber(Number(this.volume.value), 0) + '%';
    for (const control of this.seekControls) control.disabled = !seekable;
  }
}
