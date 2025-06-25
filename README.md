```markdown
# 🔐 Secure Chat (No Login, End-to-End Encrypted)

A simple, lightweight, and secure web-based chat app that enables **end-to-end encrypted communication** between users — with **no login required**.

Messages are encrypted in the browser using **ECDH + AES-GCM** and relayed via WebSockets. The server has **zero knowledge** of message content.

---

## 🚀 Features

- ✅ No registration or login required
- 🔐 End-to-end encryption (ECDH + AES-GCM)
- 📡 Real-time chat via WebSockets
- 🧩 Peer-to-peer key exchange
- 🔒 Server never sees unencrypted messages
- 🌐 Works on LAN or can be hosted online (e.g., Railway + Cloudflare Pages)


---

## 🗂 Project Structure

```

secure-chat/
├── server/              # Backend server (Node.js + socket.io)
│   └── server.js
├── public/              # Frontend assets (served as static files)
│   ├── index.html
│   └── main.js
└── README.md

````

---

## ⚙️ How It Works

1. Each browser tab generates an **ephemeral ECDH key pair**
2. Public keys are exchanged via WebSocket
3. Each tab derives a **shared AES-GCM key**
4. Messages are encrypted/decrypted client-side
5. Server simply relays encrypted blobs

---

## 🧪 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/your-username/secure-chat.git
cd secure-chat
````

### 2. Install Dependencies

```bash
npm install express socket.io
```

### 3. Run the Server

```bash
node server.js
```

By default, the app is served at:
`http://localhost:3000`

To allow LAN access, modify `server.js` to listen on `0.0.0.0`:

```js
server.listen(3000, '0.0.0.0');
```

### 4. Access from Another Device (on Same Network)

Find your local IP:

```bash
ipconfig getifaddr en0   # macOS
```

Then visit:
`http://your-local-ip:3000` on another device

---

## 🌐 Deploy to Production

### 🔹 Frontend (Static Files)

You can deploy the `/public` folder using:

* **Cloudflare Pages**
* **Vercel**
* **Netlify**

### 🔹 Backend (Node.js + WebSocket)

Deploy the `server/` folder using:

* [Railway](https://railway.app)
* [Render](https://render.com)
* [Glitch](https://glitch.com)

Make sure to update the WebSocket URL in `main.js`:

```js
const socket = io("https://your-backend-url");
```

---

## 🔒 Security Notes

* Ephemeral keys are generated per session
* Shared key is derived using ECDH (P-256)
* AES-GCM (256-bit) is used for message encryption
* No messages are logged or stored on the server
* Messages are deleted on page refresh or tab close

---

## 🧰 Built With

* [Node.js](https://nodejs.org/)
* [Express.js](https://expressjs.com/)
* [socket.io](https://socket.io/)
* [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

## 📜 License

This project is licensed under the MIT License.

---

## 📬 Contact

Created by [Faheem](https://github.com/your-username) – feel free to reach out!

---

## ⭐️ Star This Project

If you found this helpful, give it a ⭐️ to support the project!

```

---

Would you like this file:
- As a downloadable `.md`?
- Added to your project folder?
- With custom screenshots or QR setup instructions?
```
