const socket = io();

const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const joinForm = document.getElementById('join-form');
const joinContainer = document.getElementById('join-container');
const chatContainer = document.querySelector('.chat-container');
const leaveBtn = document.getElementById('leave-btn');


let username = '';
let room = '';


joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  username = e.target.elements.username.value.trim();
  room = e.target.elements.room.value;
  
  if (!username) return;
  
  joinContainer.style.display = 'none';
  chatContainer.style.display = 'block';
  
  socket.emit('joinRoom', { username, room });
});


leaveBtn.addEventListener('click', () => {
  socket.emit('leaveRoom');
  
  chatContainer.style.display = 'none';
  joinContainer.style.display = 'block';
  
  chatMessages.innerHTML = '';
});


chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const msg = e.target.elements.msg.value.trim();
  
  if (!msg) return;
  
  socket.emit('chatMessage', msg);
  
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  
  if (message.isPrivate) {
    div.classList.add('private-message');
  } else if (message.username === 'Système') {
    div.classList.add('system-message');
  }
  
  div.innerHTML = `
    <p class="meta">${message.username} ${message.time}

    <p class="text">${message.text}

  `;
  chatMessages.appendChild(div);
  
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateRoomName(room) {
  roomName.innerText = room;
}

function updateUserList(users) {
  userList.innerHTML = users.map(user => `<li>${user.username}</li>`).join('');
}

socket.on('message', (message) => {
  outputMessage(message);
});

socket.on('roomUsers', ({ room, users }) => {
  updateRoomName(room);
  updateUserList(users);
});

socket.on('connect_error', (error) => {
  console.error('Erreur de connexion:', error);
  alert('Erreur de connexion au serveur. Veuillez réessayer.');
});