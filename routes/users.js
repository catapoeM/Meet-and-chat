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

const checkAuth = (req, res, next) => {
  const userSession = req.session.user;
  console.log(userSession + ' userSession checkAuth')
  if (userSession) {
    next()
  }else {
    console.log(' return login')
    return res.redirect('/login')
  }
}

const deleteSession = (req, res, next) => {
  req.session.destroy(function(err) {
    if (err) {
      console.log(err)
    }else {
      console.log(' session deleted')
      next()
    }
  })
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
      return res.render('login', { errorMsg: 'Username does not exist. Please register one!' } )
      
    }try {
      const match = await bcrypt.compare(user.pass, found.pass)
      if (match) {
        req.session.user = req.sessionID
        console.log(req.session.user + ' sessionID 1')
        return res.redirect(`/user/${found.id}`)
      }else if (!match) {
        res.render('login', { errorMsg: 'Incorrect password. Please try again!' } )
      }
    }catch(err) {
      res.render('login', { errorMsg: err } )
    }
  })
})

router.get('/user/:id', checkAuth, async (req, res) => {
  try {
    let user = await userSchema.findById(req.params.id)
    return res.render('user', {user: user.name})
  }catch(err) {
    return res.render('login', { errorMsg: err + ' err 2'} )
  }
})

router.get('/logout', checkAuth, deleteSession, (req, res) => {
  return res.redirect('/login')
})

router.delete('/user/:id', checkAuth, deleteSession, async (req, res) => {
  try {
    let user = await userSchema.findById(req.params.id)
    await user.remove()
    console.log("user with info -" + user + "has been deleted!")
    return res.redirect('/login')
  }catch(err) {
    console.log(err)
  }
})

module.exports = router;