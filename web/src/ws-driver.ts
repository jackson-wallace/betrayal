import {
  appState,
  GameStatus,
  renderInProgress,
  setJoinCodeHtml,
  setPlayersInLobbyHtml,
} from "./app.js";
import { GameState } from "./objects/game.js";

type EventPayloads = {
  send_initialize_game: SendInitializeGameEvent;
  receive_initialize_game: ReceiveInitializeGameEvent;
  send_join_game: SendJoinGameEvent;
  receive_join_game: ReceiveJoinGameEvent;
  send_start_game: SendStartGameEvent;
  receive_start_game: ReceiveStartGameEvent;
};

class BaseEvent {
  type: keyof EventPayloads;
  payload: any;

  constructor(type: keyof EventPayloads, payload: any) {
    this.type = type;
    this.payload = payload;
  }
}

class Event<T extends keyof EventPayloads> extends BaseEvent {
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

class ReceiveInitializeGameEvent {
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

class ReceiveJoinGameEvent {
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

class ReceiveStartGameEvent {
  gameState: GameState;
  sent: string;

  constructor(gameState: GameState, sent: string) {
    this.gameState = gameState;
    this.sent = sent;
  }
}

export class WSDriver {
  conn: WebSocket | null;

  constructor() {
    this.conn = null;
  }

  connectWebsocket() {
    if (window["WebSocket"]) {
      console.log("supports websockets");

      // connect to ws
      this.conn = new WebSocket("wss://" + document.location.host + "/ws");

      this.conn.onopen = () => this.handleOpen();
      this.conn.onclose = () => this.handleClose();
      this.conn.onmessage = (e) => this.handleMessage(e);
    } else {
      alert("Browser does not support WebSockets");
    }
  }

  handleOpen() {
    console.log("handleOpen()");
  }

  handleClose() {
    console.log("handleClose()");
  }

  handleMessage(event: MessageEvent) {
    const eventData = JSON.parse(event.data);

    const e = Object.assign(
      new BaseEvent(eventData.type, eventData.payload),
      eventData,
    );

    this.routeEvent(e);
  }

  routeEvent(event: BaseEvent) {
    if (event.type === undefined) {
      alert("no type field in the event");
    }

    switch (event.type) {
      case "receive_initialize_game":
        const receiveInitializeGameEvent = new ReceiveInitializeGameEvent(
          event.payload.joinCode,
          event.payload.sent,
        );

        setJoinCodeHtml(receiveInitializeGameEvent.joinCode);
        setPlayersInLobbyHtml(1);
        break;

      case "receive_join_game":
        const receiveJoinGameEvent = new ReceiveJoinGameEvent(
          event.payload.playerCount,
          event.payload.sent,
        );

        setPlayersInLobbyHtml(receiveJoinGameEvent.playerCount);
        break;

      case "receive_start_game":
        const receiveStartGameEvent = new ReceiveStartGameEvent(
          event.payload.gameState,
          event.payload.sent,
        );

        appState.currentState = GameStatus.InProgress;
        renderInProgress(appState, this, receiveStartGameEvent.gameState);
        break;

      default:
        alert("unsupported message type");
    }
  }

  sendEvent<T extends keyof EventPayloads>(
    eventName: T,
    payload: EventPayloads[T],
  ) {
    const event = new Event(eventName, payload);

    if (this.conn) {
      this.conn.send(JSON.stringify(event));
    }
  }
}
