'use strict';
// const fetch = require('node-fetch');

const AwsRekognitionService = require('../src/aws-rekognition');
const path = require('path');
const fs = require('fs');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../routes/index');
const request = require('request');
chai.use(chaiHttp);
chai.should();


describe('HBNRekognition', function () {

    // beforeEach(() => {
    //     this.service = new Rekognition();
    // });


    it('create', async () => {

        let sourceImageBuffer, targetImageBuffer;
        const imagePaths = [
            path.join(__dirname, '..', 'public', 'images', 'sh.jpeg'),
            path.join(__dirname, '..', 'public', 'images', 'sh.jpeg')
        ]
        sourceImageBuffer = fs.readFileSync(imagePaths[0]);
        targetImageBuffer = fs.readFileSync(imagePaths[1]);
        let service = new AwsRekognitionService()._getService();

        // let uploatResult = await service.uploadToS3(path.join(__dirname, '..', 'images', 'sh.jpeg'), 'deeplense-test');
        let targetImg = {SourceImage: {
            S3Object: {
                Bucket: "deeplense-test",
                    Name: "deeplense-test1555314640661-sh.jpeg"
            }
        }};
        let compareResult = await service.compareFaces(sourceImageBuffer,targetImageBuffer)
        console.log(compareResult);
    });

    it('createCollection',async () => {
        let service = new AwsRekognitionService();

        let result = await service._createCollection();
        console.log(result);
    });

    it('indexFaces', async () => {
        let service = new AwsRekognitionService();
        let sourceImageBuffer;

        const imagePaths = [
            path.join(__dirname, '..', 'public', 'images', 'sh3.jpeg')
        ];
        sourceImageBuffer = fs.readFileSync(imagePaths[0]);
        console.log(sourceImageBuffer);

        let result = await service.indexFaces(service.getCollectionName(), sourceImageBuffer);
        console.log(result.toString());
    });

    it('listFaces', async () => {
        let service = new AwsRekognitionService();
        console.log((await service.listFaces()).Faces);
    });

    it('searchFacesByImage', async() => {
        let service = new AwsRekognitionService();
        let sourceImageBuffer;
        const imagePaths = [
            path.join(__dirname, '..', 'public', 'images', 'zico2.jpeg')
        ];
        sourceImageBuffer = fs.readFileSync(imagePaths[0]);
        console.log((await service.searchFacesByImage(sourceImageBuffer)).FaceMatches[0].Face.FaceId);
    });


    it('/image POST API', async(done) => {
        let sourceImageBuffer;
        const imagePaths = [
            path.join(__dirname, '..', 'public', 'images', 'zico2.jpeg')
        ];
        sourceImageBuffer = fs.readFileSync(imagePaths[0]);
        console.log(sourceImageBuffer);

        var requestSettings = {

            url: 'http://localhost:3000/image',
            form: {
                imageBuffer:sourceImageBuffer.toString("binary")
            },
            method: 'POST'
        };
        request(requestSettings, async (error, response, body) => {
            if(error) {
            } else {
                console.log(body);
            }
        })
        // done();


    })

    it('send faceId POST API', async() => {
        const imagePaths = [
            path.join(__dirname, '..', 'public', 'images', 'zico.jpeg')
        ];
        let sourceImageBuffer = fs.readFileSync(imagePaths[0]);
        var requestSettings = {

            url: 'http://localhost:3000/regist',
            form: {
                imageBuffer:sourceImageBuffer.toString("binary")
            },
            method: 'POST'
        };
        request(requestSettings, async (error, response, body) => {
            if(error) {
            } else {
                console.log(body);
            }
        })
    })

    it('send image to s3', async() => {
        let obj = new AwsRekognitionService();
        let service = obj._getService();

        let s3Image = await service.uploadToS3(path.join(__dirname, '..', 'public', 'images', 'zico.jpeg'), 'deeplense-test');
        console.log(s3Image)
        // let result = await service.indexFaces('test-collection23', 'https://deeplense-test.s3.us-east-2.amazonaws.com/deeplense-test1555634792999-zico.jpeg');
        // console.log(result)


    })


});