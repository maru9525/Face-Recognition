let express = require('express');
let request = require('request');
let router = express.Router();
let mysql2 = require('mysql2/promise');
let multer = require('multer');
let fs = require('fs');
// let bkfd2Password = require("pbkdf2-password");
let alert = require('alert-node');
// let db = require('../db.json');
let date= require('date-utils');
// let hasher = bkfd2Password();
let fetch = require('node-fetch');
let storage = multer.diskStorage({
  destination : function (req, file, cb) {
    let path = 'uploads/' + file.mimetype.split('/')[0] +'/';
    if(!fs.existsSync(path)){
      fs.mkdir(path,function (err) {
        if(err){
          console.log("failed", err);
        }
      });
    }
    cb(null, path);
  },
  filename : function (req, file, cb) {
    let path = 'uploads/' + file.mimetype.split('/')[0] + '/';

    fs.readdir(path, function (err, files) {
      if(err){
        console.log(err);
      }

      else{
        cb(null, file.originalname);
      }
    });
  }
});
let upload = multer({storage : storage});



/* GET home page. */
router.get('/', function(req, res, next) {
  let data = {
    user : req.session.user
  };
  console.log("dd",data);

  if(req.session.user) {
    res.render('index', { data: data });
  } else {
    res.render('login', { data: data });
  }

});

router.get('/main', function(req, res, next) {
  let data = {
    user : req.session.user
  };
  console.log(data);
  res.render('main', { data: data });
});


router.post('/login', async function (req, res, next) {

  let userName = req.body.username;
  let userPassword = req.body.password;
  let userLevel = req.body.level;


  let dbData = fs.readFileSync('./db.json');
  let dbJson = JSON.parse(dbData);
  let connection = await mysql2.createConnection(dbJson);

  let sql = 'SELECT * FROM users WHERE username=? AND password=? AND level=?';
  let result = await connection.query(sql, [userName,userPassword,userLevel]);
  // console.log("sss",result[0][0].id);

  if (result[0].length > 0) {

    //데이터베이스에서 사용자가 있는지 없는지 검증 필요
    if(!req.session.user) {
      req.session.user = {
        username : userName,
        password : userPassword,
        level : userLevel,
      }
    }
  }
  else {
    alert("아이디나 비밀번호가 올바르지 않습니다.");
  }
  let Datesql = `SELECT * FROM dateList`;
  let DateResult = await connection.query(Datesql);
  // console.log(DateResult[0]);
  if(req.session.user)
  {
    if(userLevel=='admin'){
      res.redirect('./login_adm');
    }
    else{
      // res.render('login_mem',{data: DateResult[0][0]});
      res.render('login_mem',{data: result[0][0]});
    }
  }
});

router.get('/login_mem',async function (req, res, next) {
  let dbData = fs.readFileSync('./db.json');
  let dbJson = JSON.parse(dbData);
  let connection = await mysql2.createConnection(dbJson);

  let userId = req.param('id');

  let sql = 'select u.id id, u.username username, u.images images, d.date date  from users u, dateList d where d.userId=u.id and d.userId= ? ';
  let result = await connection.query(sql,[userId]);
  // console.log("11",result[0]);
  res.render('userInfo',{data: result});
});

router.get('/login_adm',async function (req,res,next) {
  let dbData = fs.readFileSync('./db.json');
  let dbJson = JSON.parse(dbData);


  let connection = await mysql2.createConnection(dbJson);

  let result = await connection.query('select * from users');
  res.render('login_adm',{data:result[0]});
});

router.get('/logout',  function(req, res, next) {
  if (req.session.user) {
    console.log('로그아웃 처리');
    req.session.destroy(
        function (err) {
          if (err) {
            console.log('세션 삭제 시 에러');
            return;
          }
          console.log('세션 삭제 성공');
          res.redirect('/');
        }
    );

  } else {
    console.log('로그인 안되어 있음');
    res.redirect('/');
  }
});


router.get('/list', async function(req, res, next) {


  let dbData = fs.readFileSync('./db.json');
  let dbJson = JSON.parse(dbData);


  let connection = await mysql2.createConnection(dbJson);

  let result = await connection.query('select id, username,images from users');
  // let db = fs.readFileSync('db.json');
  // let jsondb = JSON.parse(db);
  // console.log("ggg",jsondb.db);

  console.log(result[0]);
  res.render('list', { data: result[0] });

});
router.post('/list', async function (req, res, next) {


  let connection = await mysql2.createConnection({

  });
  let userId = req.body.id;

});


router.post('/register', upload.single('cma_file'), async function(req, res) {
  let dbData = fs.readFileSync('./db.json');
  let dbJson = JSON.parse(dbData);

  let ipData = fs.readFileSync('./host.json');
  let ipJson = JSON.parse(ipData);
  let ipHost = ipJson.host;
  let urlData = 'http://'+ipHost+':3000/image';


  let connection = await mysql2.createConnection(dbJson);

  let imageBuffer = await fs.readFileSync(req.file.path.replace(/\\/gi,'/')).toString('binary');
  let body = {
    imageBuffer : imageBuffer
  };

    let requestSettings = {

        url: urlData,
        form: body,
        method: 'POST'
    };


    let fetchresult = {};
    request(requestSettings, async (error, response, body) => {
        if(error) {
            console.log(error);
        } else {
            fetchresult = JSON.parse(body);
            // let face_id = fetchresult.FaceRecords[0].Face.FaceId;
            // console.log(face_id, 'here');

            console.log(fetchresult);

            let user = {
                username: req.body.username,
                password: req.body.password,
                images: req.file.path,
                level : req.body.level,
                faceId : fetchresult.FaceRecords[0].Face.FaceId,
                imageId : fetchresult.FaceRecords[0].Face.ImageId
            };
            console.log(user.faceId);


            let result =  await connection.query('INSERT INTO users SET ?', user);

            console.log(result);
            if(result) {
               alert("회원등록이 완료되었습니다!");
            }
            res.redirect('/register');
        }
    })
});


router.get('/register',  function(req, res, next) {
  console.log('user', req.session.user);
  res.render('./register');
});

router.post('/image',  function(req, res, next) {
  res.json({
    FaceRecords : [{
      Face : {
        FaceId : 1234,
        ImageId : 5678
      }
    }]
  });
});
router.get('/test', async  function (req, res) {
  res.render('test')
})

router.post('/atdcheck', async  function (req, res, next) { //딥렌즈에서 오는 FaceId 값 POST 부분

  let dbData = fs.readFileSync('./db.json');
  let dbJson = JSON.parse(dbData);
  let connection = await mysql2.createConnection(dbJson); //DB 연동

  let reqResult = JSON.parse(req.body.result); //딥렌즈로부터 받아오는 얼굴값

  let faceId = (reqResult.FaceMatches.length > 0) ? reqResult.FaceMatches[0].Face.FaceId : '';

  if (faceId != '') {

    let sql = 'SELECT * FROM users WHERE faceId = ?';  //DB 사용자 FaceId 일치값 유무 확인

    let result = await connection.query(sql, [faceId]);
    console.log(result);
    console.log(result[0]);
    console.log(result[0][0]);
    let newDate = new Date();
    let time = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');
    let time2 = newDate.toFormat('YYYY-MM-DD HH24');

    let Insertsql = `SELECT * FROM dateList WHERE userId=? and substring(date,1,13)=?`;
    let result2 = await connection.query(Insertsql, [result[0][0].id, time2]);
    console.log(result2[0][0]);
    if (!result2[0][0]) {
      let date = await {
        userId: result[0][0].id,
        date: time
      };
      let insertResult = await connection.query('INSERT INTO dateList SET ?', date); //DB 입력 결과
    }
  }
  res.redirect('/');

});




router.get('/rekognition', async function(req, res, next) {

  let faceId = {
    FaceMatches: [{
      Similarity: 99.99999237060547,
      Face:
          {
            FaceId: '86692566-07ee-48b9-a71c-5b80a4b18d3e',
            ImageId: 'a22dc023-b08a-3341-9391-6139146f2e55',
            Confidence: 100
          }
    },
      {
        Similarity: 99.28889465332031,
        Face:
            {
              FaceId: 'd095295d-9fc0-4a8e-a4d4-7bb991ed49ec',
              ImageId: 'a42a6131-49a6-3c90-96df-83772ef5e37a',
              Confidence: 100
            }
      },
      {
        Similarity: 96.87002563476562,
        Face:
            {
              FaceId: '69c1c022-815d-4369-b74f-aa0bf379df12',
              ImageId: '35dfdd29-43c2-34b5-b079-0336c24a2b66',
              Confidence: 100
            }
      }]
  };

  let dbData = fs.readFileSync('./db.json');
  let dbJson = JSON.parse(dbData);


  let connection = await mysql2.createConnection(dbJson);

  let sql = 'SELECT * FROM users WHERE faceId = ?';
  let result = await connection.query(sql, [faceId.FaceMatches[0].Face.FaceId]);

  let newDate= new Date();
  let time = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');
  // let date = await {
  //   userId : result[0][0].id,
  //   date : time
  // };

  let selectResult =  await connection.query('select u.id id, u.username username, u.images images, d.date date  from users u, dateList d where u.id = d.userId');
  console.log(selectResult[0]);


  let data = {
    userDateList : selectResult[0],
    currentUser : {
      username : result[0].username,
      images : result[0].images,
      date : time
    }
  };

  res.render('face', { data: data });
});

/*router.post('/rekognition', async function (req, res, next) {


  let dbData = fs.readFileSync('./db.json');
  let dbJson = JSON.parse(dbData);

  let connection = await mysql2.createConnection(dbJson);

  let date = req.body.date;
  let date2 = date+"%";
  console.log(date);

  let sql ='select u.id id, u.username username, u.images images, d.date date  from users u, dateList d where u.id = d.userId and d.date like (?)';

  let selectResult =  await connection.query(sql,[date2]);
  console.log(selectResult[0]);

  let newDate= new Date();
  let time = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');

  let data = {
    userDateList : selectResult[0],
    currentUser : {
      username : selectResult[0][0].username,
      images : selectResult[0][0].images,
      date : time

    }
  };

  res.render('view', {data : data}  )

});
*/
router.get('/userInfo', async function(req, res, next) {

  let dbData = fs.readFileSync('./db.json');
  let dbJson = JSON.parse(dbData);
  let connection = await mysql2.createConnection(dbJson);

  let Id = req.param('id');
  console.log("11",Id);
  let sql = 'select u.id id, u.username username, u.images images, d.date date  from users u, dateList d where d.userId=u.id and d.userId= ?';
  let result = await connection.query(sql, [Id]);

  console.log(result[0]);
  // res.redirect('/');
  res.render('userInfo', { data: result[0]});
});


router.get("/delete/:id", async  function (req, res, next) {

  let dbData = fs.readFileSync('./db.json');
  let dbJson = JSON.parse(dbData);

  let connection = await mysql2.createConnection(dbJson);
  let result = await connection.query(`DELETE FROM users WHERE id=?`, [req.param('id')], function () {

  });
  if(result) {
    alert("삭제 완료");
  }
  res.redirect('/list');
});


router.get('/update',  async function(req, res, next) {
  let dbData = fs.readFileSync('./db.json');
  let dbJson = JSON.parse(dbData);

  let connection = await mysql2.createConnection(dbJson);
  let data = {
    Id : req.param('id')
}
  let Updatesql = `SELECT username,password,images FROM users where id=?`;
  let Updateresult = await connection.query(Updatesql,[data.Id],function () {});
  console.log("wjs",req.param('id'));
  //
  res.render('./update' ,{data: data });
});

router.post('/update', upload.single('cma_file'), async function(req, res) {

  let dbData = fs.readFileSync('./db.json');
  let dbJson = JSON.parse(dbData);

  let ipData = fs.readFileSync('./host.json');
  let ipJson = JSON.parse(ipData);
  let ipHost = ipJson.host;
  let urlData = 'http://'+ipHost+':3000/image';

  let connection = await mysql2.createConnection(dbJson);

  let imageBuffer = await fs.readFileSync(req.file.path.replace(/\\/gi,'/')).toString('binary');
  let body = {
    imageBuffer : imageBuffer
  };

  let requestSettings = {

    url: urlData,
    form: body,
    method: 'POST'
  };


  let fetchresult = {};
  request(requestSettings, async (error, response, body) => {
    if(error) {
      console.log(error);
    } else {
      fetchresult = JSON.parse(body);
      // let face_id = fetchresult.FaceRecords[0].Face.FaceId;
      // console.log(face_id, 'here');

      console.log(fetchresult);

      let user = {
        username: req.body.username,
        password: req.body.password,
        images: req.file.path,
        level : req.body.level,
        faceId : fetchresult.FaceRecords[0].Face.FaceId,
        imageId : fetchresult.FaceRecords[0].Face.ImageId,
        Id: req.param('id')
      };
      console.log(user.faceId);


      let result =  await connection.query('UPDATE users SET username=? ,password=?, faceId=? imageId=? images =? where id=?', [user.username,user.password, user.faceId, user.imageId,user.images,user.Id]);

      console.log(result);
      if(result) {
        alert("수정이 완료되었습니다.");
      }
      res.redirect('/list');
    }
  })
});


module.exports = router;
