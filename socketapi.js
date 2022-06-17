const io = require( "socket.io" )();
const socketapi = {
    io: io
};


// Add your socket.io logic here!
//1- "io.on" sends events from server

const allUsers = []
io.on('connection', (socket) => {
	const user = {}
	socket.on('userConnect', (name) => {
		user[socket.id] = name
		allUsers.push(name)
		console.log(allUsers)
		
		io.emit('userConnected', {name: user[socket.id], allUsers: allUsers})
		console.log(name + ' connected')
	})
	socket.on('disconnect', (name) => {
		name = user[socket.id]
		for (let i = 0; i < allUsers.length; ++i) {
				if (allUsers[i] == name)
						allUsers.splice(i, 1)
		}
		io.emit('user left', {name: user[socket.id]})
		console.log(name + ' disconnected');
	});
	//2- this receive the "chat message" event emited by client 
	socket.on('chat message', (name, msg) => {
		let today = new Date()
		let time = today.getHours() + ":" + today.getMinutes();
		name = user[socket.id]
		//3- this emits to the client what has been received and the client writes it down
		io.emit('chat message', {name: name, msg: msg, time: time, id: socket.id})
		console.log('(' + time + ') ' + name + ': ' + msg)
	})

	socket.on('is typing', (userName) => {
		io.emit('is typing', {userName})
	})

	socket.on('remove typing', (userName) => {
		io.emit('remove typing', {userName})
	})

	socket.on('commentLiked', (id) => {
		console.log(user[socket.id] + ' liked the ' + id + 'th comment')
	})
	
});
// end of socket.io logic

module.exports = socketapi;