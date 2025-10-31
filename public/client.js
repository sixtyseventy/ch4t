const socket = io();
const sendBtn = document.getElementById("send");
const msgInput = document.getElementById("msg");
const messages = document.getElementById("messages");

sendBtn.onclick = () => {
  const msg = msgInput.value.trim();
  if (msg) socket.emit("chat", msg);
  msgInput.value = "";
};

socket.on("chat", msg => {
  const el = document.createElement("p");
  el.textContent = msg;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
});
