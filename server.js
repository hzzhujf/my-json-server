var jsonServer = require('json-server')
var faker = require('faker')
var _ = require('lodash')

var server = jsonServer.create()
var router = jsonServer.router('db.json')

faker.locale = 'zh_CN'

server.get('/api/questions', function (req, res) {
  var questions = _.times(5, function(n) {
    return {
      id: n,
      title: faker.lorem.sentence(),
      options: faker.lorem.words()
    }
  })
  res.send(questions)
})

server.use(jsonServer.defaults)
server.use(router)

server.listen(1024)
