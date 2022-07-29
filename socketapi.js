const io = require( "socket.io" )();
const socketapi = {
    io: io
};

const messagesSchema = require('./models/messages')

// Add your socket.io logic here!
//1- "io.on" sends events from server

const allUsers = []
io.on('connection', async (socket) => {
 // await messagesSchema.deleteMany()
	const allMessages = await messagesSchema.find()
	for (let i = 0; i < allMessages.length; ++i) {
		// Get all messages from the DB and send to the client
		io.emit('getAllMessages', {userName: allMessages[i].userName, date: allMessages[i].date, msg: allMessages[i].message, likes: allMessages[i].likes, idMsg: allMessages[i].id})
		console.log(allMessages[i].userName + ' : ' + allMessages[i].date + ' -> ' + allMessages[i].message + " _idMsg " + allMessages[i].id + " likes " + allMessages[i].likes)
	}
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
		const theTime = new Date().toLocaleString('en-AT', {timeZone: 'UTC'})
		console.log(theTime)
		name = user[socket.id]
		const likes = 0
		const newMessage = messagesSchema({
			message: msg,
			userName: name,
			date: theTime,
			likes: likes
		})
		newMessage.save()
		console.log(newMessage + ' new message - ' + newMessage.id)
		//3- this emits to the client what has been received and the client writes it down
		io.emit('chat message', {name: name, msg: msg, time: theTime, idMsg: newMessage.id, likes: newMessage.likes})
		console.log(theTime + ' Today')
	})

	socket.on('is typing', (userName) => {
		io.emit('is typing', {userName})
	})

	socket.on('remove typing', (userName) => {
		io.emit('remove typing', {userName})
	})

	// search throw the list and find if liked exists. If not, add, otherwise don't
	socket.on('commentLiked', async (id) => {
		console.log(user[socket.id] + ' liked the ' + id + ' message')
		const likes = await messagesSchema.findById(id)
		let nrOfLikes = likes.likes + 1
		likes.likes = nrOfLikes
		await likes.save()
		console.log(nrOfLikes + ' send likes')
		// messagesSchema.where({ _id: id }).update({ likes: likes})
		await io.emit('refreshLikes', {id: id, likes: nrOfLikes})
		// loop the outer array
	})
});
// end of socket.io logic

module.exports = socketapi;