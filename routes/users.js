const express = require('express');
const router = express.Router();
const userSchema = require('../models/users');
const bcrypt = require('bcrypt');

router.use('/css', express.static(__dirname + 'public/css'));
router.use('/js', express.static(__dirname + 'public/js'));

const cookieParser = require('cookie-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session)
const oneDay = 1000 * 60 * 60 * 24;

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser())
const SESS_NAME = 'sid'
router.use(session({
  name: SESS_NAME,
  secret: 'fdfrgeggt54gg65z65rh65',
  resave: false,  
  saveUninitialized: false,
  cookie: {
    maxAge: oneDay,
    value: 'val'
  },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}))
const store = new MemoryStore

const redirectLogin = (req, res, next) => {

  let s = ''
  if (s) {
    res.redirect('/login')
  }else {
    next()
  }
}

const redirectHome = (req, res, next) => {
  if (req.session.userId) {
    let userId = req.session.userId
    res.redirect(`/user/${userId}`)
  }else {
    next()
  }
}

router.get('/', (req, res) => {
  res.redirect('/login')
})

router.get('/register', (req, res) => {
  res.render('register')
})

router.post('/register', async (req, res) => {
  const user = {
    name: req.body.name,
    pass: req.body.psw
  }
  const repeatPass = req.body.pswRepeat
  // "i" from RegExp stands for insensitive case
  userSchema.findOne({name: new RegExp('^'+ user.name +'$', 'i')}, async function(err, found) {
    if (found != null) {
      res.render('register', { errorMsg: 'The username is already registered. Please choose another one!' } )
    }try {
      if (found == null && user.pass == repeatPass) {
        // Save user
        const hashedPassword = await bcrypt.hash(user.pass, 10)
        const newUser = userSchema({
          name: user.name,
          pass: hashedPassword
        })
        newUser.save()
        console.log(newUser)
        res.render('register', { msg: 'You are successfully registered! You can now log in' })
      }else if (found == null && user.pass != repeatPass) {
        res.render('register', { errorMsg: 'The "Repeat Password" must be the same as the "Password"' })
      }
    }catch(err) {
      res.render('register', { errorMsg: err })
    }
  })
  // Show all the registered users
  const allUsers = await userSchema.find();
  console.log(allUsers)
})

router.get('/login', (req, res) => {
  res.render('login')
})

router.post('/login', (req, res) => {
  const user = {
    name: req.body.name,
    pass: req.body.psw
  }
  //await userSchema.deleteMany()
  // "i" from RegExp stands for insensitive case 
  userSchema.findOne({name: new RegExp('^'+ user.name +'$', 'i')}, async function (err, found) {
    console.log(found + " found")
    if (err) {
      console.log('err: ' + err)
    }
    if (found == null) {
      res.render('login', { errorMsg: 'Username does not exist. Please register one!' } )
      return
    }try {
      const match = await bcrypt.compare(user.pass, found.pass)
      if (match) {
        console.log(req.sessionID + ' sessionID 1')
        let userSession = {sid: req.sessionID, uid: found.id, uName: found.name}
        let sessionId = JSON.stringify(userSession.sid)
        req.session.user = sessionId
        store.set(sessionId, userSession, function(err){
          if (err) {
            console.log(err + ' save store err')
          }else if (!err) {
            console.log(sessionId + ' saved STORE sid 1')
            console.log(userSession.uid + ' saved STORE uid 1')
          }
        })
        return res.redirect(`/user/${found.id}`)
      }else if (!match) {
        res.render('login', { errorMsg: 'Incorrect password. Please try again!' } )
      }
    }catch(err) {
      res.render('login', { errorMsg: err } )
    }
  })
})

router.get('/user/:id', async (req, res) => {
  console.log(req.sessionID + ' sessionID 2')
  let sessionId = JSON.stringify(req.sessionID)
  store.get(sessionId, function(err, session) {
    if (!err) {
      console.log(JSON.stringify(session) + ' store.get session ')
    }else if (err) {
      console.log(err + ' store.get err')
    }
  })
  try {
    let user = await userSchema.findById(req.params.id)
    res.render('user', {user: user.name})
  }catch(err) {
    res.render('login', { errorMsg: err + ' err 2'} )
  }
})

router.get('/logout', (req, res) => {
  let user = req.session.user
  console.log(user.sid + ' sid 3')
  let userIdString = JSON.stringify(user.sid)
  console.log(userIdString + ' userSID string 3')
  store.destroy(userIdString, function(err) {
    if (err) {
      console.log(err + ' destroy store err')
    }else if (!err) {
      console.log(' session destroyed!!!')
    }
  })
  req.session.destroy()
  res.clearCookie(SESS_NAME)
  return res.redirect('/login')
})

router.delete('/user/:id', async (req, res) => {
  try {
    let user = await userSchema.findById(req.params.id)
    await user.remove()
    console.log("user with info -" + user + "has been deleted!")
    
  }catch(err) {
      console.log(err)
  }
})

module.exports = router;