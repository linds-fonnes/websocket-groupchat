/** Functionality related to chatting. */

// Room is an abstraction of a chat channel
const Room = require('./Room');

/** ChatUser is a individual connection from client -> server to chat. */

class ChatUser {
  /** make chat: store connection-device, rooom */

  constructor(send, roomName) {
    this._send = send; // "send" function for this user
    this.room = Room.get(roomName); // room user will be in
    this.name = null; // becomes the username of the visitor
    this.jokes = ["3 Database SQL walk into a NoSQL bar. A little while later, they walked out. They couldn't find a table.", "I could tell you a joke about UDP but I don't know if you would get it.", ".titanic { float: none;}", " Q: Whats the object-oriented way to become wealthy? A: Inheritance", "Q: Why did the programmer quit his job? A: Because he didn't get arrays"]

    console.log(`created chat in ${this.room.name}`);
  }

  /** send msgs to this client using underlying connection-send-function */

  send(data) {
    try {
      this._send(data);
    } catch {
      // If trying to send to a user fails, ignore it
    }
  }

  /** handle joining: add to room members, announce join */

  handleJoin(name) {
    this.name = name;
    this.room.join(this);
    this.room.broadcast({
      type: 'note',
      text: `${this.name} joined "${this.room.name}".`
    });
  }

  /** handle a chat: broadcast to room. */

  handleChat(text) {
    this.room.broadcast({
      name: this.name,
      type: 'chat',
      text: text
    });
  }

  /** handle client request for a joke, displays only to user who requested the joke  */
  

  handleJoke(){
    this.room.personal(this.name,{
      type: "get-joke",
      text: this.jokes[Math.floor(Math.random() * this.jokes.length)]
    })
  }
  /** Handle messages from client:
   *
   * - {type: "join", name: username} : join
   * - {type: "chat", text: msg }     : chat
   */

  handleMessage(jsonData) {
    let msg = JSON.parse(jsonData);

    if (msg.type === 'join') this.handleJoin(msg.name);
    else if (msg.type === 'chat') this.handleChat(msg.text);
    else if (msg.type === "get-joke") this.handleJoke();
    else if (msg.type === "note") this.listMembers();
    else throw new Error(`bad message: ${msg.type}`);
  }

  listMembers(){
    let members_list = []
    this.room.members.forEach(member => members_list.push(member.name))
    this.room.personal(this.name, {
      type: "note",
      text: `Members: ${members_list}`
    })
  }

  /** Connection was closed: leave room, announce exit to others */

  handleClose() {
    this.room.leave(this);
    this.room.broadcast({
      type: 'note',
      text: `${this.name} left ${this.room.name}.`
    });
  }
}

module.exports = ChatUser;
