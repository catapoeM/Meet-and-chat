function preventBack() {
	window.history.forward();
}
setTimeout("preventBack()", 0);
window.onunload = function() {
	null
};

let socket = io();

let message = document.getElementById('message')
let form = document.getElementById('form');
let input = document.getElementById('input');
let typing = document.getElementById('typing')
let userName = document.getElementById('user').innerHTML

function mainLoad() {
	//socket.emit('Userdisconnect', name)
	//alert('saveSession')
	const Http = new XMLHttpRequest()
	getEmoji()
	getLocation()
	function getLocation() {
		console.log("getLocation Called");
		var bdcApi = "https://api.bigdatacloud.net/data/reverse-geocode-client"

		navigator.geolocation.getCurrentPosition(
			(position) => {
				bdcApi = bdcApi
					+ "?latitude=" + position.coords.latitude
					+ "&longitude=" + position.coords.longitude
					+ "&localityLanguage=en";
				getApi(bdcApi);

			},
			(err) => { 
				alert(err + ' error')
				getApi(bdcApi); },
			{
				enableHighAccuracy: true,
				timeout: 5000,
				maximumAge: 0
		});
	}
	function getApi(bdcApi) {
		Http.open("GET", bdcApi)
		Http.send();
		Http.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				const resonseJson = JSON.parse(this.responseText)
				let location = resonseJson.city
				location = userName + ' is connected from: ' + location
				// Emit to the server the user connection
				socket.emit('userLocation', location)
			}
		};
	}
}

socket.on('sendLocation', function(location) {
	let userLocation = document.getElementById('userLocation')
	let item = document.createElement('li')
	item.innerHTML = location
	userLocation.append(item)
	const timeOut = setTimeout(removeMessage, 5000)
	function removeMessage() {
		userLocation.removeChild(userLocation.lastChild)
		stopTime()
	}
	function stopTime() {
		clearTimeout(timeOut)
	}
})

socket.emit('userConnect', userName)

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
	scrollDown()
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
	item.textContent = '( ' + data.time + ' ) ' + data.name + ": " + data.msg;
	let like = document.createElement('li')
	item.setAttribute('id', data.idMsg)
	like.setAttribute('likesAmount', data.likes)
	like.innerText = 'Like'
	like.style.cursor = 'pointer';
	like.style.color = 'blue'
	like.addEventListener("click", function() {
		like.setAttribute('likesNr', 0)
		upVotes(item)
	});
	item.appendChild(like)
	if (userName == data.name) {
		let deleteMessage = document.createElement('button')
		deleteMessage.setAttribute('id', data.idMsg)
		deleteMessage.innerText = 'Detele'
		deleteMessage.style.cursor = 'pointer'
		deleteMessage.style.color = 'red'
		deleteMessage.addEventListener('click', function() {
			deleteMsg(deleteMessage)
		})
		item.appendChild(deleteMessage)
	}
	message.appendChild(item);
	scrollDown()
});
	
function upVotes(item) {
	let id = item.getAttribute('id')
	//alert(id)
	socket.emit('commentLiked', id)
}

socket.on('refreshLikes', function(data) {
	for (let i = 0; i < message.childNodes.length; ++i) {
		const idMessage = message.childNodes[i].getAttribute('id')
		if (idMessage == data.id && data.likes <= 1 && idMessage != null) {
			message.childNodes[i].children[0].innerText = data.likes + ' Like'
			message.childNodes[i].children[0].setAttribute('likesAmount', data.likes)
		}else if (idMessage == data.id && data.likes > 1 && idMessage != null) {
			message.childNodes[i].children[0].innerText = data.likes + ' Likes'
			message.childNodes[i].children[0].setAttribute('likesAmount', data.likes)
		}
	}	
})

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

socket.on('getAllMessages', function(data) {
	var item = document.createElement('li');
	item.textContent = '(' + data.date + ') ' + data.userName + ": " + data.msg;
	let like = document.createElement('li')
	item.setAttribute('id', data.idMsg)
	like.setAttribute('likesAmount', data.likes)
	if (data.likes < 1) {
		like.innerText = 'Like'
	}else if (data.likes == 1) {
		like.innerText = data.likes + ' Like'
	}else if (data.likes > 1) {
		like.innerText = data.likes + ' Likes'
	}
	like.style.cursor = 'pointer';
	like.style.color = 'blue'
	like.addEventListener("click", function() {
		like.setAttribute('likesNr', 0)
		upVotes(item)
	});
	item.appendChild(like)
	if (userName == data.userName) {
		let deleteMessage = document.createElement('button')
		deleteMessage.setAttribute('id', data.idMsg)
		deleteMessage.innerText = 'Detele'
		deleteMessage.style.cursor = 'pointer'
		deleteMessage.style.color = 'red'
		deleteMessage.addEventListener('click', function() {
			deleteMsg(deleteMessage)
		})
		item.appendChild(deleteMessage)
	}
	message.appendChild(item);
	scrollDown()
})

socket.on('alreadyLiked', function(data) {
	let likeMessageError = document.getElementById('likeMessageError')
	let alertMessage = document.createElement('h3')
	alertMessage.innerText = data.messageError
	alertMessage.style.color = 'red'
	if (likeMessageError.childNodes.length < 2) { 
		likeMessageError.appendChild(alertMessage)
		const timeOut = setTimeout(removeMessage, 3500)
		function removeMessage() {
			likeMessageError.removeChild(likeMessageError.firstElementChild)
			stopTime()
		}
		function stopTime() {
			clearTimeout(timeOut)
		}
	}
})

socket.on('anotherUser', function(data) {
	let likeMessageError = document.getElementById('likeMessageError')
	let alertMessage = document.createElement('h3')
	alertMessage.innerText = data.messageError
	alertMessage.style.color = 'red'
	if (likeMessageError.childNodes.length < 2) { 
		likeMessageError.appendChild(alertMessage)
		const timeOut = setTimeout(removeMessage, 3500)
		function removeMessage() {
			likeMessageError.removeChild(likeMessageError.firstElementChild)
			stopTime()
		}
		function stopTime() {
			clearTimeout(timeOut)
		}
	}
})

function deleteMsg(item) {
	for (let i = 0; i < message.childNodes.length; ++i) {
		const messageId = message.childNodes[i].getAttribute('id')
		const tagName = message.childNodes[i].tagName
		if (messageId == item.getAttribute('id') && messageId != null && tagName != 'BUTTON') {
			message.childNodes[i].removeAttribute('id')
			message.childNodes[i].innerHTML = '*Message deleted*'
			message.childNodes[i].style.color = 'grey'
			socket.emit('deleteMessage', messageId)
		}else if (messageId == item.getAttribute('id') && messageId != null && tagName == 'BUTTON') {
			message.childNodes[i].remove()
			socket.emit('deleteMessage', messageId)
		}
	}
}

function scrollDown() {
	const messagesContainer = document.getElementById('messagesContainer')
	if (messagesContainer.scrollHeight > messagesContainer.clientHeight) {
		messagesContainer.scrollTop = messagesContainer.scrollHeight
	}
}

function getEmoji() {
	const emojis = ['🙂', '😀', '😁', '😆', '😂', '😉', '🥰', '😘', '😜']
	var table = document.getElementById("table");
	for (let i = 0, emoji_i = 0; i < 3; ++i) {
		let row = table.insertRow(i)
		for (let j = 0; j < 3; ++j, ++emoji_i) {
			let cell = row.insertCell(j)
			cell.innerText = emojis[emoji_i]
			cell.setAttribute('id', emojis[emoji_i])
			cell.addEventListener('click', function() {
				input.value += cell.getAttribute('id')
			})
		}
	}
}

function popUpEmoji() {
	const table = document.getElementById("table");
	table.classList.toggle("show");
}