// Create floating particles
function createParticles() {
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 10 + 's';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
    document.body.appendChild(particle);
  }
}
createParticles();

// Chat functionality
const socket = io();
const roomId = window.location.hash.substring(1) || crypto.randomUUID();
window.location.hash = roomId;

let sharedKey;
let myKeyPair;
let myPublicKeyBytes;
let isConnected = false;

// DOM elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const roomIdEl = document.getElementById('roomId');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Initialize
roomIdEl.textContent = roomId.substring(0, 8) + '...';

function updateStatus(status, message) {
  statusText.textContent = message;
  if (status === 'connected') {
    statusDot.classList.add('connected');
    sendButton.disabled = false;
    isConnected = true;
  } else if (status === 'waiting') {
    statusDot.classList.remove('connected');
    sendButton.disabled = true;
  }
}

function addMessage(sender, text, isOwn = false) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${isOwn ? 'own' : 'peer'}`;
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  messageEl.innerHTML = `
    <div class="message-sender">${sender}</div>
    <div class="message-bubble">${text}</div>
    <div class="message-time">${time}</div>
  `;
  
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'message peer typing-indicator';
  indicator.innerHTML = `
    <div class="message-sender">Peer</div>
    <div class="message-bubble">
      <div class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
    </div>
  `;
  chatMessages.appendChild(indicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  setTimeout(() => {
    indicator.remove();
  }, 2000);
}

async function generateKeys() {
  updateStatus('generating', 'Generating encryption keys...');
  
  myKeyPair = await crypto.subtle.generateKey({
    name: "ECDH",
    namedCurve: "P-256",
  }, true, ["deriveKey"]);

  myPublicKeyBytes = new Uint8Array(await crypto.subtle.exportKey("raw", myKeyPair.publicKey));

  socket.emit("join-room", roomId);
  updateStatus('waiting', 'Waiting for peer to join...');

  setTimeout(() => {
    sendPublicKey();
  }, 500);
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
    updateStatus('connecting', 'Establishing secure connection...');
    
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

      updateStatus('connected', 'Secure connection established ✓');
      addMessage('System', 'Peer joined! All messages are now end-to-end encrypted. 🔐');

      if (!peerKeySet) {
        sendPublicKey();
        peerKeySet = true;
      }
    }
  }

  if (data.type === "message") {
    try {
      const { ciphertext, iv } = data;
      const decrypted = await crypto.subtle.decrypt({
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      }, sharedKey, new Uint8Array(ciphertext));

      const message = new TextDecoder().decode(decrypted);
      addMessage('Peer', message);
    } catch (error) {
      addMessage('System', '⚠️ Failed to decrypt message');
    }
  }
});

async function sendMessage() {
  if (!sharedKey) {
    updateStatus('waiting', 'Waiting for secure connection...');
    return;
  }

  const text = messageInput.value.trim();
  if (!text) return;

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  try {
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

    addMessage('You', text, true);
    messageInput.value = "";
  } catch (error) {
    addMessage('System', '⚠️ Failed to encrypt message');
  }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Initialize the app
generateKeys();