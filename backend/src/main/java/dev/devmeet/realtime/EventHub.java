package dev.devmeet.realtime;

import java.util.*;
import java.util.concurrent.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
public class EventHub {
  private final ConcurrentHashMap<UUID, CopyOnWriteArrayList<SseEmitter>> clients =
      new ConcurrentHashMap<>();

  public SseEmitter subscribe(UUID user) {
    var emitter = new SseEmitter(1_800_000L);
    var list = clients.computeIfAbsent(user, id -> new CopyOnWriteArrayList<>());
    while (list.size() >= 3) {
      var oldest = list.removeFirst();
      oldest.complete();
    }
    list.add(emitter);
    Runnable remove =
        () ->
            clients.computeIfPresent(
                user,
                (id, entries) -> {
                  entries.remove(emitter);
                  return entries.isEmpty() ? null : entries;
                });
    emitter.onCompletion(remove);
    emitter.onTimeout(remove);
    emitter.onError(error -> remove.run());
    try {
      emitter.send(SseEmitter.event().name("ready").data(Map.of("connected", true)));
    } catch (Exception error) {
      remove.run();
      emitter.complete();
    }
    return emitter;
  }

  public void afterCommit(UUID user, String kind, UUID peer) {
    Runnable send = () -> send(user, kind, Map.of("peerId", peer.toString()));
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.registerSynchronization(
          new TransactionSynchronization() {
            @Override
            public void afterCommit() {
              send.run();
            }
          });
    } else send.run();
  }

  private void send(UUID user, String kind, Object data) {
    for (var emitter : clients.getOrDefault(user, new CopyOnWriteArrayList<>())) {
      try {
        emitter.send(SseEmitter.event().name(kind).data(data));
      } catch (Exception error) {
        emitter.complete();
      }
    }
  }

  @Scheduled(fixedRate = 25_000)
  public void heartbeat() {
    clients.forEach(
        (id, list) -> send(id, "heartbeat", Map.of("time", System.currentTimeMillis())));
  }
}
