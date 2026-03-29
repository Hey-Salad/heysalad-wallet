/**
 * Terminal BLE Service for HeySalad Wallet
 * Handles Bluetooth Low Energy connections to HeySalad payment terminals
 */

import { BleManager, Device } from 'react-native-ble-plx';

// Nordic UART Service UUIDs (used by ESP32 terminals)
const NORDIC_UART_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const NORDIC_UART_RX_CHAR_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
const NORDIC_UART_TX_CHAR_UUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';

export interface Terminal {
  id: string;
  name: string;
  rssi?: number;
  isConnected: boolean;
}

export interface TerminalCommand {
  command: string;
  amount?: string;
  currency?: string;
  cardId?: string;
  [key: string]: any;
}

export interface TerminalResponse {
  status: 'success' | 'error';
  message?: string;
  txid?: string;
  [key: string]: any;
}

export class TerminalBLEService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private scanning: boolean = false;
  private responseListener: ((response: TerminalResponse) => void) | null = null;

  constructor() {
    try {
      this.manager = new BleManager();
    } catch (error) {
      console.error('[TerminalBLE] Failed to initialize:', error);
    }
  }

  /**
   * Initialize BLE manager
   */
  async initialize(): Promise<boolean> {
    if (!this.manager) return false;

    try {
      const state = await this.manager.state();
      console.log('[TerminalBLE] State:', state);

      if (state !== 'PoweredOn') {
        console.error('[TerminalBLE] Bluetooth not ready:', state);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[TerminalBLE] Initialize error:', error);
      return false;
    }
  }

  /**
   * Scan for HeySalad terminals
   */
  async scanForTerminals(
    onTerminalFound: (terminal: Terminal) => void,
    durationMs: number = 10000
  ): Promise<void> {
    if (!this.manager) {
      throw new Error('BLE not initialized');
    }

    if (this.scanning) {
      console.warn('[TerminalBLE] Already scanning');
      return;
    }

    console.log('[TerminalBLE] Starting scan...');
    this.scanning = true;

    try {
      this.manager.startDeviceScan(
        [NORDIC_UART_SERVICE_UUID],
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('[TerminalBLE] Scan error:', error);
            this.scanning = false;
            return;
          }

          if (device && device.name && device.name.startsWith('HeySalad-Terminal')) {
            console.log(`[TerminalBLE] Found terminal: ${device.name}`);

            const terminal: Terminal = {
              id: device.id,
              name: device.name,
              rssi: device.rssi || undefined,
              isConnected: false,
            };

            onTerminalFound(terminal);
          }
        }
      );

      // Stop scan after duration
      setTimeout(() => {
        this.stopScan();
      }, durationMs);

    } catch (error) {
      console.error('[TerminalBLE] Scan error:', error);
      this.scanning = false;
      throw error;
    }
  }

  /**
   * Stop scanning
   */
  stopScan(): void {
    if (this.manager && this.scanning) {
      console.log('[TerminalBLE] Stopping scan');
      this.manager.stopDeviceScan();
      this.scanning = false;
    }
  }

  /**
   * Connect to terminal
   */
  async connect(terminalId: string): Promise<void> {
    if (!this.manager) {
      throw new Error('BLE not initialized');
    }

    console.log(`[TerminalBLE] Connecting to ${terminalId}...`);

    try {
      // Connect
      const device = await this.manager.connectToDevice(terminalId, {
        autoConnect: false,
        requestMTU: 512,
      });

      console.log(`[TerminalBLE] Connected to ${device.name}`);

      // Discover services
      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevice = device;

      // Set up notification listener
      await this.setupNotifications(device);

      // Handle disconnect
      device.onDisconnected(() => {
        console.log('[TerminalBLE] Device disconnected');
        this.connectedDevice = null;
      });

    } catch (error) {
      console.error('[TerminalBLE] Connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from terminal
   */
  async disconnect(): Promise<void> {
    if (this.connectedDevice && this.manager) {
      console.log('[TerminalBLE] Disconnecting...');
      try {
        await this.manager.cancelDeviceConnection(this.connectedDevice.id);
        this.connectedDevice = null;
      } catch (error) {
        console.error('[TerminalBLE] Disconnect error:', error);
      }
    }
  }

  /**
   * Send payment command to terminal
   */
  async sendPaymentCommand(
    amount: string,
    currency: string = 'TRX'
  ): Promise<TerminalResponse> {
    if (!this.connectedDevice) {
      throw new Error('No terminal connected');
    }

    const command: TerminalCommand = {
      command: 'payment',
      amount,
      currency,
    };

    return await this.sendCommand(command);
  }

  /**
   * Send command to terminal
   */
  private async sendCommand(command: TerminalCommand): Promise<TerminalResponse> {
    if (!this.connectedDevice) {
      throw new Error('No terminal connected');
    }

    try {
      const commandJson = JSON.stringify(command);
      const commandBase64 = btoa(commandJson);

      console.log(`[TerminalBLE] Sending: ${commandJson}`);

      // Write to RX characteristic
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        NORDIC_UART_SERVICE_UUID,
        NORDIC_UART_RX_CHAR_UUID,
        commandBase64
      );

      // Wait for response
      return await this.waitForResponse(5000);

    } catch (error) {
      console.error('[TerminalBLE] Send command error:', error);
      throw error;
    }
  }

  /**
   * Setup notification listener
   */
  private async setupNotifications(device: Device): Promise<void> {
    try {
      device.monitorCharacteristicForService(
        NORDIC_UART_SERVICE_UUID,
        NORDIC_UART_TX_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('[TerminalBLE] Notification error:', error);
            return;
          }

          if (characteristic?.value) {
            try {
              const data = atob(characteristic.value);
              const response: TerminalResponse = JSON.parse(data);

              console.log('[TerminalBLE] Response:', response);

              if (this.responseListener) {
                this.responseListener(response);
                this.responseListener = null;
              }
            } catch (e) {
              console.error('[TerminalBLE] Parse error:', e);
            }
          }
        }
      );
    } catch (error) {
      console.error('[TerminalBLE] Setup notifications error:', error);
      throw error;
    }
  }

  /**
   * Wait for response from terminal
   */
  private waitForResponse(timeoutMs: number): Promise<TerminalResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseListener = null;
        reject(new Error('Response timeout'));
      }, timeoutMs);

      this.responseListener = (response) => {
        clearTimeout(timeout);
        resolve(response);
      };
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  /**
   * Get connected terminal name
   */
  getConnectedTerminalName(): string | null {
    return this.connectedDevice?.name || null;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopScan();
    if (this.connectedDevice) {
      this.disconnect();
    }
    if (this.manager) {
      this.manager.destroy();
    }
  }
}

// Singleton instance
let terminalBLEServiceInstance: TerminalBLEService | null = null;

export function getTerminalBLEService(): TerminalBLEService {
  if (!terminalBLEServiceInstance) {
    terminalBLEServiceInstance = new TerminalBLEService();
  }
  return terminalBLEServiceInstance;
}
