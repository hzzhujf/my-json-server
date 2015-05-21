var jsonServer = require('json-server')
var faker = require('faker')
var _ = require('lodash')

var server = jsonServer.create()
var router = jsonServer.router('db.json')

server.use(jsonServer.defaults)

server.get('/api/questions', function (req, res) {
  //faker.locale = 'zh_CN'
  var questions = _.times(5, function(n) {
    return {
      id: n,
      title: faker.lorem.sentence(),
      options: faker.lorem.words()
    }
  })
  res.send(questions)
})

server.use(router)

server.listen(2223)
