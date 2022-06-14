let socket = io();

let message = document.getElementById('message')
let form = document.getElementById('form');
let input = document.getElementById('input');
let typing = document.getElementById('typing')
let userName = document.getElementById('user').innerHTML

socket.emit('userConnect', userName)

function mainLoad() {
	//socket.emit('Userdisconnect', name)
	//alert('saveSession')
}

socket.on('userConnected', function(data) {
	let status = document.getElementById('status')
	let allUsers = data.allUsers
	let list = document.getElementById('status')
	while (list.hasChildNodes()) {
		list.removeChild(list.firstChild)
	}
	for (let i = 0; i < allUsers.length; ++i) {
		var item = document.createElement('li');
		item.setAttribute('id', allUsers[i])
		item.textContent = allUsers[i];
		status.appendChild(item)
	}
	const onlineContainer = document.getElementById('onlineContainer')
	if (onlineContainer.scrollHeight > onlineContainer.clientHeight) {
		onlineContainer.scrollTop = onlineContainer.scrollHeight
	}
})

socket.on('user left', function(data) {
	let status = document.getElementById('status')
	let children = status.children, name = data.name;
	for (let i = 0; i < children.length; ++i) {
		let child = children[i].getAttribute('id');
		if (name === child) {
			children[i].remove()
		}
	}
})


form.addEventListener('submit', function(e) {
	e.preventDefault();
	let name = userName
	if (input.value) {
		//1- this emit the "chat message" event
		socket.emit('chat message', name, input.value);
		input.value = '';
	}
});

//4- this event is received to be written down. (displaied)
socket.on('chat message', function(data) {
	var item = document.createElement('li');
	item.textContent = '(' + data.time + ') ' + data.name + ": " + data.msg;
	message.appendChild(item);
	const messagesContainer = document.getElementById('messagesContainer')
	if (messagesContainer.scrollHeight > messagesContainer.clientHeight) {
		messagesContainer.scrollTop = messagesContainer.scrollHeight
	}
});

function userTyping() {
	let name = userName
	let val = 0;
	setInterval(checkInput, 3000)
	function checkInput() {
		if (input.value && val < 2) {
			socket.emit('is typing', name)
			val = 2
		}else if (!input.value && val != 1) {
			socket.emit('remove typing', name)
			val = 1
		}
	}
}

socket.on('remove typing', function(data) {
	let userName = data.userName + ' is typing ...'
	if (userName == typing.childNodes[0].innerText) {
		typing.removeChild(typing.children[0])
	}
})

socket.on('is typing', function(data) {
	let item = document.createElement('li')
	item.innerText = data.userName + ' is typing ...'
	if (typing.hasChildNodes()) {
		typing.replaceChild(item, typing.childNodes[0])
	}else if (!typing.hasChildNodes()) {
		typing.appendChild(item)
	}
})