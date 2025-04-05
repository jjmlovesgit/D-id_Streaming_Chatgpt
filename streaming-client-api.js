// streaming-client-api.js
'use strict';

class VideoAgent {
  constructor() {
    this.peerConnection = null;
    this.streamId = null;
    this.sessionId = null;
    this.statsIntervalId = null;
    this.API_CONFIG = null;
    this.DID_API_URL = 'https://api.d-id.com';
    this.lastBytesReceived = 0;
    this.videoIsPlaying = false;

    this.idleVideo = document.getElementById('idle-video');
    this.talkVideo = document.getElementById('talk-video');

    this.init();
  }

  async init() {
    try {
      const response = await fetch('./api.json');
      this.API_CONFIG = await response.json();

      if (!this.API_CONFIG?.key) throw new Error('Missing D-ID API key in api.json');
      if (!this.API_CONFIG?.openai_key) throw new Error('Missing OpenAI API key in api.json');
      if (this.API_CONFIG.url) this.DID_API_URL = this.API_CONFIG.url;

      this.talkVideo.setAttribute('playsinline', '');
      this.setupEventListeners();

      console.log('Initialized successfully');
    } catch (error) {
      this.showError(`Initialization failed: ${error.message}`);
    }
  }

  setupEventListeners() {
    document.getElementById('connect-button').onclick = () => this.handleConnect();
    document.getElementById('talk-button').onclick = () => this.handleTalk();
    document.getElementById('destroy-button').onclick = () => this.handleDestroy();
    document.getElementById('enter-button').onclick = () => this.handleTalk();
    document.getElementById('user-input-field').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleTalk();
    });
  }

  async handleConnect() {
    const connectButton = document.getElementById('connect-button');
    connectButton.classList.add('loading');

    try {
      if (this.peerConnection?.connectionState === 'connected') return;

      this.cleanup();

      const response = await fetch(`${this.DID_API_URL}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.API_CONFIG.key + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_url: "https://raw.githubusercontent.com/jjmlovesgit/D-id_Streaming_Chatgpt/main/oracle_pic.jpg",
          stream_warmup: true
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const { id, offer, ice_servers, session_id } = await response.json();
      this.streamId = id;
      this.sessionId = session_id;

      const answer = await this.createPeerConnection(offer, ice_servers);
      await this.sendSDPAnswer(answer);

      connectButton.classList.remove('loading');
      connectButton.classList.add('connected');

      this.updateUI(true);
      document.getElementById('user-input-field').focus();
    } catch (error) {
      this.showError(`Connection failed: ${error.message}`);
      connectButton.classList.remove('loading', 'connected');
      this.cleanup();
    }
  }

  async handleTalk() {
    try {
      const userMessage = document.getElementById('user-input-field').value.trim();
      if (!userMessage) throw new Error('Please enter a message');

      const { fetchOpenAIResponse } = await import('./openai.js');
      const aiResponse = await fetchOpenAIResponse(this.API_CONFIG.openai_key, userMessage);

      const talkResponse = await fetch(`${this.DID_API_URL}/talks/streams/${this.streamId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.API_CONFIG.key + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: aiResponse,
            provider: {
              type: 'microsoft',
              voice_id: this.API_CONFIG.voice_id
            }
          },
          config: { fluent: true, stitch: true },
          driver_url: 'bank://lively/',
          session_id: this.sessionId
        })
      });

      if (!talkResponse.ok) throw new Error('Failed to send to D-ID');

      document.getElementById('user-input-field').value = '';
    } catch (error) {
      console.error('Talk Error:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async handleDestroy() {
    const connectButton = document.getElementById('connect-button');

    try {
      if (this.streamId) {
        await fetch(`${this.DID_API_URL}/talks/streams/${this.streamId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${btoa(this.API_CONFIG.key + ':')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_id: this.sessionId }),
        });
      }
    } catch (error) {
      console.error('Destroy error:', error);
    } finally {
      this.cleanup();
      this.updateUI(false);
      connectButton.classList.remove('connected', 'loading');
    }
  }

  async createPeerConnection(offer, iceServers) {
    const RTCPeerConnection = (
      window.RTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.mozRTCPeerConnection
    ).bind(window);

    this.peerConnection = new RTCPeerConnection({ iceServers });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        fetch(`${this.DID_API_URL}/talks/streams/${this.streamId}/ice`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(this.API_CONFIG.key + ':')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            session_id: this.sessionId,
          }),
        }).catch(console.error);
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (event.track.kind === 'video') {
        this.statsIntervalId = setInterval(async () => {
          const stats = await this.peerConnection.getStats(event.track);
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              const isPlaying = report.bytesReceived > this.lastBytesReceived;
              if (isPlaying !== this.videoIsPlaying) {
                this.videoIsPlaying = isPlaying;
                this.updateStatus('streaming', isPlaying ? 'streaming' : 'idle');

                if (isPlaying) {
                  this.idleVideo.style.display = 'none';
                  this.talkVideo.style.display = 'block';
                  this.talkVideo.srcObject = event.streams[0];
                  this.talkVideo.play().catch(console.error);
                } else {
                  this.talkVideo.pause();
                  this.talkVideo.srcObject = null;
                  this.talkVideo.style.display = 'none';
                  this.idleVideo.style.display = 'block';
                }
              }
              this.lastBytesReceived = report.bytesReceived;
            }
          });
        }, 500);
      }
    };

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async sendSDPAnswer(answer) {
    const response = await fetch(`${this.DID_API_URL}/talks/streams/${this.streamId}/sdp`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(this.API_CONFIG.key + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        answer: answer,
        session_id: this.sessionId
      })
    });
    if (!response.ok) throw new Error('Failed to send SDP answer');
  }

  cleanup() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.talkVideo.pause();
    this.talkVideo.srcObject = null;
    this.talkVideo.style.display = 'none';
    this.idleVideo.style.display = 'block';

    const video = document.getElementById('talk-video');
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }

    if (this.statsIntervalId) {
      clearInterval(this.statsIntervalId);
      this.statsIntervalId = null;
    }

    ['peer', 'ice', 'iceGathering', 'signaling', 'streaming'].forEach(type => {
      this.updateStatus(type, type === 'signaling' ? 'stable' : 'disconnected');
    });
  }

  updateUI(connected) {
    const connectButton = document.getElementById('connect-button');
    const talkButton = document.getElementById('talk-button');
    const destroyButton = document.getElementById('destroy-button');

    talkButton.disabled = !connected;
    destroyButton.disabled = !connected;

    if (connected) {
      connectButton.classList.add('connected');
    } else {
      connectButton.classList.remove('connected', 'loading');
    }
  }

  updateStatus(type, state) {
    const label = document.getElementById(`${type}-status-label`);
    if (!label) return;
    label.innerText = state;
    label.className = `${type}-${state}`;
  }

  showError(message) {
    alert(message);
    console.error(message);
  }
}

document.addEventListener('DOMContentLoaded', () => new VideoAgent());
