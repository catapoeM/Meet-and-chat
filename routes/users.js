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
let store = new MemoryStore

// Checks if the user is authenticated or not
// If user auth then it goes next and get the user routes and user informations from the DB.
// If not then redirects back to the login page
const checkAuth = (req, res, next) => {
  console.log(req.session.user + ' userSession checkAuth')
  if (req.session.user) {
    next()
  }else {
    console.log(' return login')
    return res.redirect('/login')
  }
}

// If user is already logged in then always user is redirected to the user main page.
// If not then it simple goes to that specific page "ex: register / login"
const checkLoggedIn = (req, res, next) => {
  if (req.session.user) {
  store.get(req.session.user, function(err, session) {
    if (err) {
      console.log(err)
    }else if (session) {
      const userId = session.uid
      console.log(userId + ' userId ***')
      return res.redirect(`/user/${userId}`)
    }
  })
  }else {
    next()
  }
}

// It is used to delete session in 2 cases: 1. Delete account 2. Log out.
const deleteSession = (req, res, next) => {
  let userSession = req.session.user
  store.destroy(userSession, function(err) {
    if (err) {
      return res.render('login', { errorMsg: err } )
    }else {
      console.log(userSession + ' destroyed from store')
    }
  })
  req.session.destroy(function(err) {
    if (err) {
      console.log(err)
      return res.render('login', { errorMsg: err } )
    }else {
      console.log(' session deleted')
      next()
    }
  })
}

router.get('/', checkLoggedIn, (req, res) => {
  res.redirect('/login')
})

router.get('/register', checkLoggedIn, (req, res) => {
  res.render('register')
})

router.post('/register', checkLoggedIn, (req, res) => {
  const user = {
    name: req.body.name,
    pass: req.body.psw
  }
  const repeatPass = req.body.pswRepeat
  // "i" from RegExp stands for insensitive case
  userSchema.findOne({name: new RegExp('^'+ user.name +'$', 'i')}, async function(err, found) {
    if (err) {
      return res.render('register', { errorMsg: err })
    }
    else if (!err && found != null) {
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
        return res.render('register', { msg: 'You are successfully registered! You can now log in' })
      }else if (found == null && user.pass != repeatPass) {
        return res.render('register', { errorMsg: 'The "Repeat Password" must be the same as the "Password"' })
      }
    }catch(err) {
      return res.render('register', { errorMsg: err })
    }
  })
  // Show all the registered users
  //const allUsers = await userSchema.find();
  //console.log(allUsers)
})

router.get('/login', checkLoggedIn, (req, res) => {
  return res.render('login')
})

router.post('/login', checkLoggedIn, (req, res) => {
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
        req.session.save(function(err) {
          if (err) {
            return res.render('login', { errorMsg: err } )
          }else {
            req.session.user = req.sessionID
            const userSession = {sid: req.sessionID, uid: found.id, name: found.name}
            store.set(req.sessionID, userSession, function(err) {
              if (err) {
                return res.render('login', { errorMsg: err } )
              }else {
                console.log(req.session.user + ' sessionID 1')
                return res.redirect(`/user/${found.id}`)
              }
            })
          }
        })
      }else if (!match) {
        return res.render('login', { errorMsg: 'Incorrect password. Please try again!' } )
      }
    }catch(err) {
      return res.render('login', { errorMsg: err } )
    }
  })
})

router.get('/user/:id', checkAuth, (req, res) => {
  try {
    store.get(req.session.user, async function(err, session) {
      if (err) {
        console.log(err)
        return res.render('login', { errorMsg: err } )
      }else if (session) {
        console.log(JSON.stringify(session) + ' user session ***')
        let user = await userSchema.findById(req.params.id)
        return res.render('user', {user: user.name})
      }
    })
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