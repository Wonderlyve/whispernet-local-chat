
export interface WebRTCCall {
  id: string;
  peerId: string;
  type: 'audio' | 'video';
  status: 'initiating' | 'ringing' | 'active' | 'ended';
  isIncoming: boolean;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onCallEndCallback?: () => void;
  private onIncomingCallCallback?: (call: WebRTCCall) => void;

  constructor() {
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate:', event.candidate);
        // En production, envoyer via signaling server
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Remote stream received');
      this.remoteStream = event.streams[0];
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      if (this.peerConnection?.connectionState === 'disconnected') {
        this.endCall();
      }
    };

    // Créer un data channel pour les messages
    this.dataChannel = this.peerConnection.createDataChannel('messages');
    this.dataChannel.onopen = () => console.log('Data channel opened');
    this.dataChannel.onmessage = (event) => console.log('Data channel message:', event.data);
  }

  async startCall(peerId: string, type: 'audio' | 'video'): Promise<WebRTCCall> {
    try {
      // Obtenir les médias locaux
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });

      // Ajouter les tracks à la peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Créer une offre
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      console.log('Call initiated with offer:', offer);

      const call: WebRTCCall = {
        id: Date.now().toString(),
        peerId,
        type,
        status: 'initiating',
        isIncoming: false
      };

      // Simuler la réponse après 2 secondes
      setTimeout(() => {
        this.simulateCallAnswer(call);
      }, 2000);

      return call;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  private async simulateCallAnswer(call: WebRTCCall) {
    try {
      // Simuler une réponse
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setRemoteDescription(answer);
      
      // Simuler un stream distant
      const remoteStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.type === 'video'
      });
      
      this.remoteStream = remoteStream;
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(remoteStream);
      }
      
      console.log('Call answered successfully');
    } catch (error) {
      console.error('Error answering call:', error);
    }
  }

  async answerCall(call: WebRTCCall): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.type === 'video'
      });

      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      
      console.log('Call answered with answer:', answer);
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  endCall() {
    // Arrêter tous les tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Fermer la peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.setupPeerConnection(); // Recréer pour le prochain appel
    }

    if (this.onCallEndCallback) {
      this.onCallEndCallback();
    }

    console.log('Call ended');
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onCallEnd(callback: () => void) {
    this.onCallEndCallback = callback;
  }

  onIncomingCall(callback: (call: WebRTCCall) => void) {
    this.onIncomingCallCallback = callback;
  }

  sendMessage(message: string) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
    }
  }
}
