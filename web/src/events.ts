import { GameState } from "./objects/game";

export type EventPayloads = {
  send_initialize_game: SendInitializeGameEvent;
  receive_initialize_game: ReceiveInitializeGameEvent;
  send_join_game: SendJoinGameEvent;
  receive_join_game: ReceiveJoinGameEvent;
  send_start_game: SendStartGameEvent;
  receive_start_game: ReceiveStartGameEvent;
};

export class BaseEvent {
  type: keyof EventPayloads;
  payload: any;

  constructor(type: keyof EventPayloads, payload: any) {
    this.type = type;
    this.payload = payload;
  }
}

export class Event<T extends keyof EventPayloads> extends BaseEvent {
  type: T;
  payload: EventPayloads[T];

  constructor(type: T, payload: EventPayloads[T]) {
    super(type, payload);
    this.type = type;
    this.payload = payload;
  }
}

export class SendInitializeGameEvent {
  playerID: string;

  constructor(id: string) {
    this.playerID = id;
  }
}

export class ReceiveInitializeGameEvent {
  joinCode: string;
  sent: string;

  constructor(joinCode: string, sent: string) {
    this.joinCode = joinCode;
    this.sent = sent;
  }
}

export class SendJoinGameEvent {
  playerID: string;
  joinCode: string;

  constructor(playerID: string, joinCode: string) {
    this.playerID = playerID;
    this.joinCode = joinCode;
  }
}

export class ReceiveJoinGameEvent {
  playerCount: number;
  sent: string;

  constructor(playerCount: number, sent: string) {
    this.playerCount = playerCount;
    this.sent = sent;
  }
}

export class SendStartGameEvent {
  playerID: string;

  constructor(playerID: string) {
    this.playerID = playerID;
  }
}

export class ReceiveStartGameEvent {
  gameState: GameState;
  sent: string;

  constructor(gameState: GameState, sent: string) {
    this.gameState = gameState;
    this.sent = sent;
  }
}
