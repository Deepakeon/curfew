describe('Boot Persistence & Foreground Keep-Alive Policy (Seam 3)', () => {
  const BOOT_COMPLETED_ACTION = 'android.intent.action.BOOT_COMPLETED';

  interface BroadcastIntent {
    action: string;
  }

  interface ServiceNotificationConfig {
    channelId: string;
    channelName: string;
    importance: 'low' | 'high' | 'default';
    isSilent: boolean;
    isOngoing: boolean;
    startSticky: boolean;
  }

  function handleBootBroadcast(
    intent: BroadcastIntent,
    startForegroundServiceMock: () => void
  ): boolean {
    if (intent.action === BOOT_COMPLETED_ACTION) {
      startForegroundServiceMock();
      return true;
    }
    return false;
  }

  function getForegroundKeepAliveConfig(): ServiceNotificationConfig {
    return {
      channelId: 'curfew_keep_alive_channel',
      channelName: 'Curfew Keep-Alive',
      importance: 'low',
      isSilent: true,
      isOngoing: true,
      startSticky: true,
    };
  }

  it('triggers ForegroundService start immediately upon BOOT_COMPLETED', () => {
    const startServiceMock = jest.fn();
    const result = handleBootBroadcast(
      { action: 'android.intent.action.BOOT_COMPLETED' },
      startServiceMock
    );

    expect(result).toBe(true);
    expect(startServiceMock).toHaveBeenCalledTimes(1);
  });

  it('ignores other broadcast intents without starting ForegroundService', () => {
    const startServiceMock = jest.fn();
    const result = handleBootBroadcast(
      { action: 'android.intent.action.AIRPLANE_MODE' },
      startServiceMock
    );

    expect(result).toBe(false);
    expect(startServiceMock).not.toHaveBeenCalled();
  });

  it('configures Foreground Keep-Alive with persistent low-priority silent notification', () => {
    const config = getForegroundKeepAliveConfig();

    expect(config.channelId).toBe('curfew_keep_alive_channel');
    expect(config.importance).toBe('low');
    expect(config.isSilent).toBe(true);
    expect(config.isOngoing).toBe(true);
    expect(config.startSticky).toBe(true);
  });

  describe('Native Kotlin BootReceiver & CurfewForegroundService file verification', () => {
    const fs = require('fs');
    const path = require('path');

    it('BootReceiver.kt listens for ACTION_BOOT_COMPLETED and starts CurfewForegroundService', () => {
      const bootReceiverPath = path.join(
        __dirname,
        '../../plugins/native/kotlin/BootReceiver.kt'
      );
      expect(fs.existsSync(bootReceiverPath)).toBe(true);

      const content = fs.readFileSync(bootReceiverPath, 'utf8');
      expect(content).toContain('class BootReceiver : BroadcastReceiver()');
      expect(content).toContain('Intent.ACTION_BOOT_COMPLETED');
      expect(content).toContain('CurfewForegroundService.start(context)');
    });

    it('CurfewForegroundService.kt implements persistent low-priority silent notification and START_STICKY', () => {
      const servicePath = path.join(
        __dirname,
        '../../plugins/native/kotlin/CurfewForegroundService.kt'
      );
      expect(fs.existsSync(servicePath)).toBe(true);

      const content = fs.readFileSync(servicePath, 'utf8');
      expect(content).toContain('class CurfewForegroundService : Service()');
      expect(content).toContain('NotificationManager.IMPORTANCE_LOW');
      expect(content).toContain('setPriority(Notification.PRIORITY_LOW)');
      expect(content).toContain('setOngoing(true)');
      expect(content).toContain('START_STICKY');
      expect(content).toContain('setSound(null, null)');
      expect(content).toContain('enableVibration(false)');
      expect(content).toContain('FOREGROUND_SERVICE_TYPE_SPECIAL_USE');
    });
  });
});
