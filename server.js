var jsonServer = require('json-server')
var faker = require('faker')
var _ = require('lodash')

var server = jsonServer.create()
var router = jsonServer.router('db.json')

server.use(jsonServer.defaults)

server.get('/api/test', function (req, res) {
  res.send('hello world!')
})

/**
 * 模拟会员体系API
 */
var mkMemberDB = function() {
  return {
    remain: 180.00,
    isSetPassword: false,
    recharges: [
      {_id: '1', price: 5000, bonus: 600 },
      {_id: '2', price: 3000, bonus: 300 },
      {_id: '3', price: 1000 },
      {_id: '4', price: 1000 },
    ],
  }
}
var memberdb = mkMemberDB()
server.get('/member/reset', function(req, res) {
  memberdb = mkMemberDB()
})
server.get('/member/me', function(req, res) {
  res.send(
    _.pick(memberdb, 'remain', 'isSetPassword')
  )
})
server.get('/member/rechargeInfo', function(req, res) {
  res.send(
    _.pick(memberdb, 'remain', 'isSetPassword', 'recharges')
  )
})
server.post('/member/redeem', function(req, res) {
  res.send(
    _.pick(memberdb, 'remain', 'isSetPassword')
  )
})
server.post('/member/setPassword', function(req, res) {
  memberdb.isSetPassword = true
  res.send(
    _.pick(memberdb, 'isSetPassword')
  )
})


/**
 * 提交问卷答案
 *
 * @apiParam {String} cellphone
 * @apiParam {Array} answers
 */
server.post('surveyRecords', function(req, res) {
  console.log('post survey...', JSON.stringify(req))
})
server.get('/surveyInfo', function (req, res) {
  //faker.locale = 'zh_CN'
  var questions = _.times(5, function(n) {
    return {
      _id: n,
      description: '美甲师是否准时到达约定地点服务？',
      choices: [
        {text: '非诚准时'},
        {text: '没有准时，但有提前联系并告知可能延误的时间和原因'},
        {text: '没有准时，也没有提前联系或告知'}
      ]
    }
  })
  var manicurist= {
    name: faker.name.firstName(),
    profileImage: faker.image.avatar(),
    grade: faker.random.number(5),
    ordersAmount: faker.random.number(500),
  }
  var order = {
    style: {
      name: faker.internet.userName(),
      image: faker.internet.avatar()
    },
    price: faker.random.number(500),
    startAt: faker.date.recent()
  }
  var coupon = {
    name: '250元优惠券'
  }
  res.send({
    questions: questions,
    order: order,
    manicurist: manicurist,
    coupon: coupon
  })
})


server.use(router)

server.listen(2333)
