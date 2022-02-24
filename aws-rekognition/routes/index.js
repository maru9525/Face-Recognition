var express = require('express');
var router = express.Router();
const request = require('request');
const path = require('path');
const fs = require('fs');
const serverInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'secrets', 'server.json')));
const AwsRekognitionService = require('../src/aws-rekognition');
const rekognitionService = new AwsRekognitionService();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/image', async (req, res, next) => {
  // let bufferString = req.body.imageBuffer.toString('binary');
  let imageBuffer = Buffer.from(req.body.imageBuffer, 'binary');
	let result = await rekognitionService.indexFaces(rekognitionService.getCollectionName(), imageBuffer);
	console.log(result)  
res.json(result);
})

router.post('/regist', async (req, res, next) => {
  let imageBuffer = Buffer.from(req.body.imageBuffer, 'base64');
  let result = await rekognitionService.searchFacesByImage(imageBuffer);
  console.log(result);

  let requestSettings = {
      url: serverInfo.server.serverUrl + serverInfo.server.registPath,
      form: {
            result: JSON.stringify(result)
        },
        method: 'POST'
  };
  request(requestSettings, async (error, response, body) => {
      if(error) {
      } else {
      }
  });

    res.json({true: true})

})

router.post('/test', async (req, res, next) => {
    console.log(req.body)
  res.json({result: req.body})
});




module.exports = router;
