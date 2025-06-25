const socket = io();
const roomId = window.location.hash.substring(1) || crypto.randomUUID();
window.location.hash = roomId;

let sharedKey;
let myKeyPair;
let myPublicKeyBytes;

async function generateKeys() {
  myKeyPair = await crypto.subtle.generateKey({
    name: "ECDH",
    namedCurve: "P-256",
  }, true, ["deriveKey"]);

  myPublicKeyBytes = new Uint8Array(await crypto.subtle.exportKey("raw", myKeyPair.publicKey));

  socket.emit("join-room", roomId);

  // Send our key after a slight delay
  setTimeout(() => {
    sendPublicKey();
  }, 300);
}

function sendPublicKey() {
  socket.emit("signal", {
    roomId,
    data: {
      type: "public-key",
      key: Array.from(myPublicKeyBytes),
    },
  });
}

let peerKeySet = false;

socket.on("signal", async (data) => {
  if (data.type === "public-key") {
    const peerKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(data.key),
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );

    if (!sharedKey) {
      sharedKey = await crypto.subtle.deriveKey({
        name: "ECDH",
        public: peerKey,
      }, myKeyPair.privateKey, {
        name: "AES-GCM",
        length: 256,
      }, false, ["encrypt", "decrypt"]);

      console.log("Shared key derived");

      // Respond with our public key if we haven’t sent it
      if (!peerKeySet) {
        sendPublicKey(); // respond back
        peerKeySet = true;
      }
    }
  }

  if (data.type === "message") {
    const { ciphertext, iv } = data;
    const decrypted = await crypto.subtle.decrypt({
      name: "AES-GCM",
      iv: new Uint8Array(iv),
    }, sharedKey, new Uint8Array(ciphertext));

    const message = new TextDecoder().decode(decrypted);
    document.getElementById("chat").innerHTML += `<div><b>Peer:</b> ${message}</div>`;
  }
});

async function sendMessage() {
  if (!sharedKey) {
    alert("Waiting for secure connection to be established...");
    return;
  }

  const input = document.getElementById("message");
  const text = input.value;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  const encrypted = await crypto.subtle.encrypt({
    name: "AES-GCM",
    iv,
  }, sharedKey, encoded);

  socket.emit("signal", {
    roomId,
    data: {
      type: "message",
      ciphertext: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
    },
  });

  document.getElementById("chat").innerHTML += `<div><b>You:</b> ${text}</div>`;
  input.value = "";
}

document.getElementById("send").onclick = sendMessage;

generateKeys();
