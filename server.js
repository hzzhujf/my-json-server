/*eslint-disable */

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
    ].concat(_.times(500, function(n) {
      return mkTrade('纯色', '支付成功', -199 + n, '2015年4月4日');
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

/**
 * 嘟一夏活动API
 * /activities/duyixia
 */

var mkDuGirlDB = function() {
  return {}
}
var duGirlDB = mkDuGirlDB()
function getDuGirlData(req) {
  var code = req.body.code;
  var phone = code ? parseInt(Math.random() * Math.pow(10, 11)) : null;
  var id = req.body.phone || phone || 'guest';
  console.log('test id ' + id);
  var data = duGirlDB[id];
  if (!data) {
    data = duGirlDB[id] = {
      phone: phone,
      canShare: true,
      remainChance: 2,
    };
  }
  return data;
}
/**
 * @apiParam {String} openid
 * @apiParam {String} code
 **/
server.get('/activities/du-girl', function (req, res) {
  var data = getDuGirlData(req);

  res.send(data)
});

/**
 * @apiParam {String} phone
 **/
server.post('/activities/du-girl/markAsShared', function (req, res) {
  var data = getDuGirlData(req);
  data.remainChance += 1;
  data.canShare = false;

  res.send(data)
});

/**
 * @apiParam {String} phone
  lotCode: { id: 'dd-100' },                       // 嘟嘟100元
  lotCode: { id: 'msm-100', code: 'bjsctga' }      // 美上门100元
  lotCode: { id: 'msm-50', code: 'bjsctgb'}        // 美上门50元
  lotCode: { id: 'lose' },
  lotCode: { id: 'master', code: '770036' },       // Master达人
  lotCode: { id: 'dd-70' },                        // 嘟嘟70元
  lotCode: { id: 'tpp', code: 'tppddmj' },         // 淘拍拍
  lotCode: { id: 'meb-200', code: 'MeBDdyzM001' }, // 美呗
 **/
server.post('/activities/du-girl/luckyDraw', function (req, res) {
  var prizes = [
    { id: 'lose' },
    { id: 'dd-100' },
    { id: 'dd-70' },
    { id: 'meb-200', code: 'MeBDdyzM001' },
    { id: 'master', code: '770036' },
    { id: 'tpp', code: 'tppddmj' },
    { id: 'msm-100', code: 'bjsctga' },
    { id: 'msm-50', code: 'bjsctgb' },
  ]

  var data = getDuGirlData(req);

  if (data.remainChance === 0) {
    data.lotCode = null;
  }
  else {
    var codeIndex = Math.floor(Math.random() * 10) + 0;
    var prize = prizes[codeIndex > 7 ? 0 : codeIndex]
    data.remainChance -= 1;
    data.lotCode = prize;
  }

  res.send(data)
});

server.get('/activities/hongbao/getMyHongbao', function (req, res) {
  res.send({
    hongBao: {
      nickname: 'ryan',
      headimgurl: '', // 用户头像
      phone: 18888888888,
      openid: '',
      amount: 25,
      comment: '嘟嘟美甲，随时随地美一下。',
      time: '2015-08-10 22:35:10', // 领取日期
    },
    status: 'success', // 'alreadyGetOne', 'noMoreHongBaos'
    // 已经领取红包的用户信息列表
    hongBaos: _.times(10, function(n) {
      return {
        nickname: 'ryan' + n,
        headimgurl: '', // 用户头像
        amount: 25,
        comment: '嘟嘟美甲，随时随地美一下。',
        time: '2015-08-10 22:35:10', // 领取日期
      };
    }),
  })
  // new DDError('noUserForOpenid');
});

server.post('/activities/hongbao/getHongbaoByPhone', function (req, res) {
  res.send({
    hongBao: {
      nickname: 'ryan',
      headimgurl: '', // 用户头像
      phone: 18888888888,
      openid: '',
      amount: 25,
      comment: '嘟嘟美甲，随时随地美一下。',
      time: '2015-08-10 22:35:10', // 领取日期
    },
    status: 'success', // 'alreadyGetOne', 'noMoreHongBaos'
    // 已经领取红包的用户信息列表
    hongBaos: _.times(10, function(n) {
      return {
        nickname: 'ryan' + n,
        headimgurl: '', // 用户头像
        amount: 25,
        comment: '嘟嘟美甲，随时随地美一下。',
        time: '2015-08-10 22:35:10', // 领取日期
      };
    }),
  })
  // new DDError('noUserForOpenid');
});

server.post('/activities/hongbao/updateCellphone', function (req, res) {
  res.send({
    phone: req.body.phone,
  });
});

server.use(router)

server.listen(2333)
