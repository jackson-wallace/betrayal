import { GameState } from "./game/game.js";
import { Hex } from "./utils/utils.js";

export type EventPayloads = {
  send_initialize_game: SendInitializeGameEvent;
  receive_initialize_game: ReceiveInitializeGameEvent;
  send_join_game: SendJoinGameEvent;
  receive_join_game: ReceiveJoinGameEvent;
  send_start_game: SendStartGameEvent;
  receive_start_game: ReceiveStartGameEvent;
  send_player_move: SendPlayerMoveEvent;
  receive_player_move: ReceivePlayerMoveEvent;
  send_player_shoot: SendPlayerShootEvent;
  receive_player_shoot: ReceivePlayerShootEvent;
  send_player_increase_range: SendPlayerIncreaseRangeEvent;
  receive_player_increase_range: ReceivePlayerIncreaseRangeEvent;
  send_player_give_action_point: SendPlayerGiveActionPointEvent;
  receive_player_give_action_point: ReceivePlayerGiveActionPointEvent;
  receive_invalid_action: ReceiveInvalidActionEvent;
  receive_player_win: ReceivePlayerWinEvent;
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
  isMainClient: boolean;
  sent: string;

  constructor(playerCount: number, isMainClient: boolean, sent: string) {
    this.playerCount = playerCount;
    this.isMainClient = isMainClient;
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

export class SendPlayerMoveEvent {
  playerID: string;
  hex: Hex;

  constructor(playerID: string, hex: Hex) {
    this.playerID = playerID;
    this.hex = hex;
  }
}

export class ReceivePlayerMoveEvent {
  gameState: GameState;
  sent: string;

  constructor(gameState: GameState, sent: string) {
    this.gameState = gameState;
    this.sent = sent;
  }
}

export class SendPlayerShootEvent {
  playerID: string;
  hex: Hex;

  constructor(playerID: string, hex: Hex) {
    this.playerID = playerID;
    this.hex = hex;
  }
}

export class ReceivePlayerShootEvent {
  gameState: GameState;
  sent: string;

  constructor(gameState: GameState, sent: string) {
    this.gameState = gameState;
    this.sent = sent;
  }
}

export class SendPlayerIncreaseRangeEvent {
  playerID: string;

  constructor(playerID: string) {
    this.playerID = playerID;
  }
}

export class ReceivePlayerIncreaseRangeEvent {
  gameState: GameState;
  sent: string;

  constructor(gameState: GameState, sent: string) {
    this.gameState = gameState;
    this.sent = sent;
  }
}

export class SendPlayerGiveActionPointEvent {
  playerID: string;
  hex: Hex;

  constructor(playerID: string, hex: Hex) {
    this.playerID = playerID;
    this.hex = hex;
  }
}

export class ReceivePlayerGiveActionPointEvent {
  gameState: GameState;
  sent: string;

  constructor(gameState: GameState, sent: string) {
    this.gameState = gameState;
    this.sent = sent;
  }
}

export class ReceiveInvalidActionEvent {
  message: string;
  sent: string;

  constructor(message: string, sent: string) {
    this.message = message;
    this.sent = sent;
  }
}

export class ReceivePlayerWinEvent {
  gameState: GameState;
  playerColor: string;
  sent: string;

  constructor(gameState: GameState, playerColor: string, sent: string) {
    this.gameState = gameState;
    this.playerColor = playerColor;
    this.sent = sent;
  }
}
