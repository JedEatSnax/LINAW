type EventHandler<T> = (event: T) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, EventHandler<any>[]>();

  subscribe<T>(eventName: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventName) ?? [];

    handlers.push(handler);

    this.handlers.set(eventName, handlers);
  }

  async publish<T>(eventName: string, event: T): Promise<void> {
    const handlers = this.handlers.get(eventName) ?? [];

    for (const handler of handlers) {
      await handler(event);
    }
  }
}

export const eventBus = new EventBus();
