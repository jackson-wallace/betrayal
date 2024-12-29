type EventPayloads = {
  // send_message: SendMessageEvent;
  // receive_message: ReceiveMessageEvent;
  // change_room: ChangeChatRoomEvent;
  send_initialize_game: SendInitializeGameEvent;
};

class Event<T extends keyof EventPayloads> {
  type: T;
  payload: EventPayloads[T];

  constructor(type: T, payload: EventPayloads[T]) {
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
  playerID: string;
  joinCode: string;
  sent: string;

  constructor(playerID: string, joinCode: string, sent: string) {
    this.playerID = playerID;
    this.joinCode = joinCode;
    this.sent = sent;
  }
}

// class SendMessageEvent {
//   message: string;
//   from: string;
//
//   constructor(message: string, from: string) {
//     this.message = message;
//     this.from = from;
//   }
// }
//
// class ReceiveMessageEvent {
//   message: string;
//   from: string;
//   sent: string;
//
//   constructor(message: string, from: string, sent: string) {
//     this.message = message;
//     this.from = from;
//     this.sent = sent;
//   }
// }
//
// class ChangeChatRoomEvent {
//   name: string;
//
//   constructor(name: string) {
//     this.name = name;
//   }
// }

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

    console.log("eventData", eventData);

    // const e = Object.assign(new Event(), eventData);

    // this.routeEvent(e);
  }

  routeEvent(event: MessageEvent) {
    if (event.type === undefined) {
      alert("no type field in the event");
    }

    switch (event.type) {
      case "receive_initialize_game":
        console.log("receive_initialize_game");

      // case "receive_message":
      //   const messageEvent = Object.assign(
      //     new NewMessageEvent(),
      //     event.payload,
      //   );
      //   appendChatMessage(messageEvent);
      //   break;
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
