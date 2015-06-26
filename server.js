var jsonServer = require('json-server')
var bodyParser = require('body-parser')
var faker = require('faker')
var _ = require('lodash')

var server = jsonServer.create()
var router = jsonServer.router('db.json')

server.use(jsonServer.defaults)
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: true }))

server.get('/api/test', function (req, res) {
  res.send('hello world!')
})

/**
 * 模拟会员体系API
 */
var mkMoney = function() {
  return Number(faker.finance.amount())
}
var mkTrade = function(name, status, amount, date) {
  return {
    name     : name   || '纯色',
    status   : status || 'order',
    amount   : amount || mkMoney(),
    create_at: date   || faker.date.past(),
  }
}
var mkMemberDB = function() {
  return {
    verifyCode: '1234',
    password: '123123',
    remain: mkMoney(),
    isSetPassword: false,
    recharges: [
      {_id: faker.finance.account(), price: 5000, bonus: 600 },
      {_id: faker.finance.account(), price: 3000, bonus: 300 },
      {_id: faker.finance.account(), price: 1000, bonus: 0 },
    ],
    trades: [
      mkTrade('充值', 'recharge'),
      mkTrade('充值', 'recharge'),
      mkTrade('充值', 'recharge'),
      mkTrade('纯色', 'pay'),
      mkTrade('纯色', 'refund'),
      mkTrade('充值', 'recharge'),
    ]
  }
}
var memberdb = mkMemberDB()
server.get('/reset', function(req, res) {
  memberdb = mkMemberDB()
})
server.get('/userAccounts/me', function(req, res) {
  res.send(
    _.pick(memberdb, 'remain', 'isSetPassword')
  )
})
server.get('/userAccounts/rechargeInfo', function(req, res) {
  res.send(
    _.pick(memberdb, 'remain', 'isSetPassword', 'recharges')
  )
})
server.post('/userAccounts/redeem', function(req, res) {
  if (req.body.password != '1234') {
    return res.send(403, {message: 'verify_code_match'})
  }
  var amount = 100
  memberdb.trades.push(
    mkTrade('兑换', 'recharge', amount, new Date())
  )
  memberdb.remain += amount
  res.send(
    _.pick(memberdb, 'remain', 'isSetPassword')
  )
})
server.post('/userAccounts/pay', function(req, res) {
  console.log(req.body);
  var chargeInfo = _.find(memberdb.recharges, {_id: req.body.chargeId})
  var amount = chargeInfo.price + chargeInfo.bonus
  memberdb.trades.push(
    mkTrade('充值', 'recharge', amount, new Date())
  )
  memberdb.remain += amount
  res.send(
    _.pick(memberdb, 'remain', 'isSetPassword')
  )
})
server.post('/userAccounts/setPassword', function(req, res) {
  memberdb.isSetPassword = true
  memberdb.password = req.body.password
  res.send(
    _.pick(memberdb, 'isSetPassword')
  )
})
server.post('/userAccounts/checkPassword', function(req, res) {
  if (memberdb.password != req.body.password) {
    return res.send(403, {message: 'password_not_match'})
  }
  res.send(
    {message: 'success'}
  )
})
server.post('/userAccounts/changePassword', function(req, res) {
  if (memberdb.password != req.body.oldPassword) {
    return res.send(403, {message: 'password_not_match'})
  }
  memberdb.password = req.body.newPassword
  memberdb.isSetPassword = true
  res.send(
    {message: 'success'}
  )
})
server.post('/userAccounts/resetPassword', function(req, res) {
  if (memberdb.verifyCode != req.body.verifyCode) {
    return res.send(403, {message: 'verify_code_invalid'})
  }
  memberdb.password = req.body.newPassword
  memberdb.isSetPassword = true
  res.send(
    {message: 'success'}
  )
})
server.get('/userAccounts/trades', function(req, res) {
  res.send(
    _.pick(memberdb, 'trades')
  )
})
server.post('/user/verify/sms', function(req, res) {
  res.send(
    {message: 'success'}
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
