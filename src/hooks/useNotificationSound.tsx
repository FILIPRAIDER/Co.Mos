'use client';

import { useEffect, useCallback, useRef } from 'react';

export type SoundType = 'newOrder' | 'urgent' | 'ready' | 'completed' | 'error' | 'notification';

interface NotificationSoundOptions {
  vibrate?: boolean;
  volume?: number;
  repeat?: number;
}

/**
 * Hook para reproducir sonidos de notificación
 * Incluye generación de tonos con Web Audio API
 */
export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabledRef = useRef(true);

  useEffect(() => {
    // Inicializar AudioContext
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  /**
   * Reproduce un tono generado
   */
  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine'
  ) => {
    if (!isEnabledRef.current || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.error('Error al reproducir tono:', error);
    }
  }, []);

  /**
   * Reproduce una secuencia de tonos
   */
  const playSequence = useCallback((
    frequencies: number[],
    duration: number = 0.15,
    gap: number = 0.05
  ) => {
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        playTone(freq, duration);
      }, index * (duration + gap) * 1000);
    });
  }, [playTone]);

  /**
   * Sonidos predefinidos
   */
  const sounds = {
    newOrder: () => {
      // Melodía ascendente
      playSequence([523, 659, 784], 0.15, 0.05);
    },
    
    urgent: () => {
      // Alarma insistente
      playSequence([880, 988, 880, 988, 880], 0.2, 0.1);
    },
    
    ready: () => {
      // Ding suave
      playTone(1047, 0.3, 'sine');
    },
    
    completed: () => {
      // Melodía de éxito
      playSequence([523, 659, 784, 1047], 0.12, 0.03);
    },
    
    error: () => {
      // Tono de error
      playSequence([392, 330], 0.25, 0.15);
    },
    
    notification: () => {
      // Tono simple
      playSequence([659, 784], 0.15, 0.05);
    },
  };

  /**
   * Reproduce un sonido por tipo
   */
  const playSound = useCallback((
    type: SoundType,
    options: NotificationSoundOptions = {}
  ) => {
    if (!isEnabledRef.current) return;

    const { vibrate = false, repeat = 1 } = options;

    // Reproducir sonido
    for (let i = 0; i < repeat; i++) {
      setTimeout(() => {
        sounds[type]();
      }, i * 800);
    }

    // Vibración en dispositivos móviles
    if (vibrate && 'vibrate' in navigator) {
      const patterns: Record<SoundType, number | number[]> = {
        newOrder: [200, 100, 200],
        urgent: [300, 100, 300, 100, 300],
        ready: 200,
        completed: [100, 50, 100, 50, 100],
        error: [400],
        notification: [150],
      };
      navigator.vibrate(patterns[type]);
    }
  }, [sounds]);

  /**
   * Habilita/deshabilita sonidos
   */
  const setEnabled = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
    // Guardar preferencia en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundsEnabled', enabled ? '1' : '0');
    }
  }, []);

  /**
   * Verifica si los sonidos están habilitados
   */
  const isEnabled = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('soundsEnabled');
      return stored === null || stored === '1';
    }
    return true;
  }, []);

  // Restaurar preferencia al montar
  useEffect(() => {
    isEnabledRef.current = isEnabled();
  }, [isEnabled]);

  return {
    playSound,
    playTone,
    playSequence,
    setEnabled,
    isEnabled: isEnabled(),
  };
}

/**
 * Hook para solicitar permisos de notificaciones push
 */
export function useWebPushNotifications() {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions
  ) => {
    const hasPermission = await requestPermission();
    
    if (!hasPermission) {
      console.warn('Permisos de notificación no concedidos');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/Logo.svg',
        badge: '/Logo.svg',
        tag: 'comos-notification',
        requireInteraction: false,
        ...options,
      });

      // Auto-cerrar después de 5 segundos
      setTimeout(() => notification.close(), 5000);

      return notification;
    } catch (error) {
      console.error('Error al mostrar notificación:', error);
    }
  }, [requestPermission]);

  return {
    requestPermission,
    showNotification,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    permission: typeof window !== 'undefined' ? Notification.permission : 'default',
  };
}

/**
 * Componente de configuración de sonidos
 */
export function SoundSettings() {
  const { isEnabled, setEnabled, playSound } = useNotificationSound();

  return (
    <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm mb-1">🔊 Sonidos de Notificación</h3>
          <p className="text-xs text-gray-400">Alertas audibles para nuevas órdenes</p>
        </div>
        <button
          onClick={() => setEnabled(!isEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-orange-500' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => playSound('newOrder')}
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs transition"
          disabled={!isEnabled}
        >
          🔔 Nueva
        </button>
        <button
          onClick={() => playSound('urgent', { repeat: 2 })}
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs transition"
          disabled={!isEnabled}
        >
          ⚠️ Urgente
        </button>
        <button
          onClick={() => playSound('ready')}
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs transition"
          disabled={!isEnabled}
        >
          ✅ Lista
        </button>
      </div>
    </div>
  );
}
