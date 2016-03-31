const jsonServer = require('json-server')
const bodyParser = require('body-parser')
const faker = require('faker') // eslint-disable-line no-unused-vars
const _ = require('lodash') // eslint-disable-line no-unused-vars

const server = jsonServer.create()
const router = jsonServer.router('db.json')

server.use(jsonServer.defaults)
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: true }))

server.all('*', (req, res, next) => {
  // res.header('Access-Control-Expose-Headers', 'X-Pagination');
  next();
});

server.get('/api/jsonp', (req, res) => {
  const callback = req.query.callback
  const data = JSON.stringify({ name: 'terry' })
  res.send(`${callback}(${data})`)
})

server.get('/api/test', (req, res) => {
  res.send('hello world')
})

server.post('/api/test', (req, res) => {
  res.send(
    { result: true }
  )
})

server.use(router)

server.listen(2333)
