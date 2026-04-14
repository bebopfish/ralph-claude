import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { apiRalph } from '../api/ralph';

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const {
    updateStoryInPrd,
    appendLog,
    setRalphRunning,
    setPrdDirty,
    fetchPrd,
    setWsConnected,
  } = useAppStore.getState();

  useEffect(() => {
    function connect() {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setWsConnected(true);
        // Sync running state from backend on (re)connect
        apiRalph.getStatus().then((status) => {
          setRalphRunning(status.running, status.pid);
        }).catch(() => {/* ignore */});
      };

      ws.current.onclose = () => {
        setWsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; [k: string]: unknown };
          switch (msg.type) {
            case 'log':
              appendLog({
                level: (msg.level as 'info' | 'warn' | 'error') ?? 'info',
                message: String(msg.message ?? ''),
                timestamp: String(msg.timestamp ?? new Date().toISOString()),
              });
              break;
            case 'story:update':
              updateStoryInPrd(
                String(msg.storyId),
                msg.status as import('../types').StoryStatus,
                msg.commitHash ? String(msg.commitHash) : undefined
              );
              break;
            case 'ralph:started':
              setRalphRunning(true, msg.pid as number | undefined);
              break;
            case 'ralph:completed':
            case 'ralph:failed':
              setRalphRunning(false);
              break;
            case 'prd:changed':
              setPrdDirty(true);
              fetchPrd();
              break;
            case 'progress:changed':
              // handled per-page
              break;
            default:
              break;
          }
        } catch {
          // ignore parse errors
        }
      };
    }

    connect();

    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.current?.close();
    };
  }, []);
}
