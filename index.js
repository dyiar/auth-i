const express = require('express')
const helmet = require('helmet');
const cors = require('cors')
const bcrypt= require('bcrypt')
const session = require('express-session')
const KnexSessionsStore = require('connect-session-knex')(session)

const knex = require('knex')
const knexConfig = require('./knexfile')
const db = knex(knexConfig.development);

const server = express();
const sessionConfig = {
    name: 'austin',
    secret: 'nas;lkjsienaslcmmas;lkjfeiscnna;12349icm;alksdf',
    cookie: {
        maxAge: 1000 * 60,
        secure: false,
    },
    httpOnly: true,
    resave: false,
    saveUninitialized: false,
    store: new KnexSessionsStore({
        tablename: 'sessions',
        sidfieldname: 'sid',
        knex: db,
        createtable: true,
        clearInterval: 1000 * 60 * 10
    })
}

server.use(express.json());
server.use(cors());
server.use(helmet());
server.use(session(sessionConfig))

//middleware

function protected(req, res, next) {
    //if the user is logged in NEXT()
    if (req.session && req.session.user) {
        next()
    } else {
        res.status(401).json({ message: 'you shall not pass, not authenticated.' })
    }
}

//endpoints


server.get('/', (req,res) => {
    res.send('its alive')
})

server.get('/api/users', protected, (req, res) => {
    db('users')
    .select('id', 'username')
    .then(users => {
        res.json(users)
    })
    .catch(() => {
        res.send('Error')
    })
})

server.post('/api/register', (req, res) => {
    const creds = req.body
    const hash = bcrypt.hashSync(creds.password, 14)
    creds.password = hash;

    db('users').insert(creds).then(ids => {
        res.status(201).json(ids)
    }).catch(() => res.status(500).send('error'))
})

server.post('/api/login', (req, res) => {
    const creds = req.body;

    db('users')
    .where({ username: creds.username })
    .first()
    .then(user => {
        if (user && bcrypt.compareSync(creds.password, user.password)) {
            req.session.user = user;
            res.status(200).json({ message: `Welcome ${user.username}` })
        } else {
            res.status(401).json({ message: 'you shall not pass' })
        }
    })
    .catch(() => res.status(500).send( 'error' ))
})

server.get('/api/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if(err) {
                res.status(500).send('error, cant logout')
            } else {
                res.status(200).send('bon voyage')
            }
        })
    } else {
        res.json({ message: 'already logged out' })
    }
})

server.listen(3000, () => console.log('server running'))