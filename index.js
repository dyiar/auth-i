const express = require('express')
const cors = require('cors')
const bcrypt= require('bcrypt')

const knex = require('knex')
const knexConfig = require('./knexfile')
const db = knex(knexConfig.development);

const server = express();

server.use(express.json());
server.use(cors());

server.get('/', (req,res) => {
    res.send('its alive')
})

server.get('/api/users', (req, res) => {
    db('users')
    .select('id', 'username', 'password')
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
            res.status(200).json({ message: 'welcome' })
        } else {
            res.status(401).json({ message: 'you shall not pass' })
        }
    })
    .catch(() => res.status(500).send( 'error' ))
})

server.listen(3000, () => console.log('server running'))