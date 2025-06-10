
export interface MockLocalPeer {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastSeen: string;
  isLocal: boolean;
}

export interface MockLocalDevice {
  name: string;
  ip: string;
  port: number;
}

export class MockLocalPeersService {
  private static instance: MockLocalPeersService;
  private peers: MockLocalPeer[] = [];
  private localDevice: MockLocalDevice;

  private constructor() {
    // Simuler l'appareil local
    this.localDevice = {
      name: `ChatConnect-${Math.random().toString(36).substring(7)}`,
      ip: this.getRandomLocalIP(),
      port: 3002
    };

    // Générer quelques pairs simulés
    this.generateMockPeers();
  }

  static getInstance(): MockLocalPeersService {
    if (!MockLocalPeersService.instance) {
      MockLocalPeersService.instance = new MockLocalPeersService();
    }
    return MockLocalPeersService.instance;
  }

  private getRandomLocalIP(): string {
    const baseIPs = ['192.168.1', '192.168.0', '10.0.0'];
    const base = baseIPs[Math.floor(Math.random() * baseIPs.length)];
    const last = Math.floor(Math.random() * 254) + 1;
    return `${base}.${last}`;
  }

  private generateMockPeers() {
    const deviceNames = [
      'MacBook-Pro-Alice',
      'iPhone-Bob',
      'PC-Charlie',
      'Android-David',
      'iPad-Emma'
    ];

    this.peers = deviceNames.slice(0, Math.floor(Math.random() * 4) + 1).map((name, index) => ({
      id: `mock-${index}-${Date.now()}`,
      name,
      ip: this.getRandomLocalIP(),
      port: 3002 + index,
      lastSeen: new Date().toISOString(),
      isLocal: true
    }));
  }

  getPeersData() {
    // Simuler une variation dans les pairs connectés
    if (Math.random() < 0.1) { // 10% de chance de changer
      this.generateMockPeers();
    }

    return {
      localDevice: this.localDevice,
      peers: this.peers,
      count: this.peers.length
    };
  }

  refreshPeers() {
    this.generateMockPeers();
    console.log('🔄 Mock peers refreshed:', this.peers);
  }
}
