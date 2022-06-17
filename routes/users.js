const express = require('express');
const router = express.Router();
const userSchema = require('../models/users');
const bcrypt = require('bcrypt');

router.use('/css', express.static(__dirname + 'public/css'));
router.use('/js', express.static(__dirname + 'public/js'));

const cookieParser = require('cookie-parser');
const session = require('express-session');
const oneDay = 1000 * 60 * 60 * 24;

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser())
router.use(session({
  secret: 'fdfrgeggt54gg65z65rh65',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: oneDay,
    value: 'val'
  }
}))

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
    }catch {
      res.render('register', { errorMsg: 'Error!' })
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
    if (found == null) {
      res.render('login', { errorMsg: 'Username does not exist. Please register one!' } )
      return
    }try {
      const match = await bcrypt.compare(user.pass, found.pass)
      if (match) {
        req.session.userId = found.id;
        console.log(req.session.userId)
        // Route to User profile
        res.redirect(`/user/${found.id}`)
      }else if (!match) {
        res.render('login', { errorMsg: 'Incorrect password. Please try again!' } )
      }
    }catch {
      res.render('login', { errorMsg: 'Error!' } )
    }
  })
})

router.get('/user/:id', async (req, res) => {
  if (req.session.userId) {
    console.log(req.session.userId + ' user :id')
    try {
      const user = await userSchema.findById(req.params.id)
      res.render('user', {user: user.name})
    } catch {}
  }else {
    res.redirect('/login')
  }
  
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/login')
})

router.delete('/user/:id', async (req, res) => {
  try {
    let user = await userSchema.findById(req.params.id)
    await user.remove()
    console.log("user with info -" + user + "has been deleted!")
    req.session.destroy()
    res.redirect('/login')
  } catch {}
})

module.exports = router;