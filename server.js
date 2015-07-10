var jsonServer = require('json-server')
var bodyParser = require('body-parser')
var faker = require('faker')
var _ = require('lodash')

var server = jsonServer.create()
var router = jsonServer.router('db.json')

server.use(jsonServer.defaults)
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: true }))

server.all('*', function (req, res, next) {
  res.header('Access-Control-Expose-Headers', 'X-Pagination');
  next();
});

server.get('/api/test', function (req, res) {
  res.send('hello world!')
})

/**
 * 模拟会员体系API
 */
var mkMoney = function() {
  return Number(faker.finance.amount())
}
var mkTrade = function(title, desc, fee, time) {
  return {
    _id: faker.finance.account(),
    title: title,
    description: desc,
    fee: fee,
    time: time,
  }
}
var mkMemberDB = function() {
  return {
    verifyCode: '1234',
    password: '123123',
    remain: mkMoney(),
    isSetPassword: false,
    memberGuide: 'http://dev.dudumeijia.com/member-guide',
    recharges: [
      {_id: faker.finance.account(), price: 5000, bonus: 600 },
      {_id: faker.finance.account(), price: 3000, bonus: 300 },
      {_id: faker.finance.account(), price: 1000, bonus: 0 },
    ],
    trades: [
      mkTrade('充值', '充值成功', 3000, '2015年4月1日'),
      mkTrade('充值', '充值成功', 2000, '2015年4月2日'),
      mkTrade('充值', '充值成功', 1000, '2015年4月3日'),
      mkTrade('纯色', '支付成功', -168, '2015年4月3日'),
      mkTrade('纯色', '支付成功', -199, '2015年4月4日'),
      mkTrade('充值', '充值成功', 299,  '2015年4月7日'),
    ].concat(_.times(100, function(n) {
      return mkTrade('纯色', '支付成功', -199, '2015年4月4日');
    })),
  }
}
var memberdb = mkMemberDB()
server.get('/debug', function(req, res) {
  if (req.query.reset) {
    memberdb = mkMemberDB()
  }
  res.send( memberdb )
})
server.get('/user/userAccounts/me', function(req, res) {
  res.send(
    _.pick(memberdb, 'remain', 'isSetPassword')
  )
})
server.get('/user/userAccounts/rechargeInfo', function(req, res) {
  res.send(
    _.pick(memberdb, 'remain', 'isSetPassword', 'recharges', 'memberGuide')
  )
})
server.post('/user/redeem', function(req, res) {
  if (req.body.password != '1234') {
    return res.send(403, {
      message: 'verify_code_match',
      errtext: '兑换码无效',
    })
  }
  var amount = 100
  memberdb.trades.push(
    mkTrade('充值', '充值成功', amount, new Date().toString())
  )
  memberdb.remain += amount
  res.send(
    _.pick(memberdb, 'remain', 'isSetPassword')
  )
})
server.post('/user/userAccounts/pay', function(req, res) {
  console.log(req.body);
  var chargeInfo = _.find(memberdb.recharges, {_id: req.body.chargeId})
  var amount = chargeInfo.price + chargeInfo.bonus
  memberdb.trades.push(
    mkTrade('充值', '充值成功', amount, new Date().toString())
  )
  memberdb.remain += amount
  res.send(
    _.pick(memberdb, 'remain', 'isSetPassword')
  )
})
server.post('/user/userAccounts/setPassword', function(req, res) {
  memberdb.isSetPassword = true
  memberdb.password = req.body.password
  res.send(
    _.pick(memberdb, 'isSetPassword')
  )
})
server.post('/user/userAccounts/checkPassword', function(req, res) {
  if (memberdb.password != req.body.password) {
    return res.send({ result: false })
  }
  res.send(
    {result: true}
  )
})
server.post('/user/userAccounts/changePassword', function(req, res) {
  if (memberdb.password != req.body.oldPassword) {
    return res.send(403, {
      message: 'password_not_match',
      errtext: '输入密码错误，请重试',
    })
  }
  memberdb.password = req.body.newPassword
  memberdb.isSetPassword = true
  res.send(
    {message: 'success'}
  )
})
server.post('/user/userAccounts/forgetPassword', function(req, res) {
  if (memberdb.verifyCode != req.body.verifyCode) {
    return res.send(403, {
      message: 'verify_code_invalid',
      errtext: '验证码错误',
    })
  }
  memberdb.password = req.body.newPassword
  memberdb.isSetPassword = true
  res.send(
    {message: 'success'}
  )
})
server.get('/user/tradeRecords/dudu', function(req, res) {
  var page = req.query.page
  var per_page = req.query.per_page
  var start = (page - 1) * per_page
  var end = page * per_page
  var data = memberdb.trades.filter(function(item, i) {
    return start <= i && i < end;
  })
  res.setHeader('X-Pagination', JSON.stringify({
    page: parseInt(page),
    per_page: parseInt(per_page),
    page_num: Math.ceil(memberdb.trades.length / per_page),
    total_num: memberdb.trades.length,
  }))
  res.send(data)
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
