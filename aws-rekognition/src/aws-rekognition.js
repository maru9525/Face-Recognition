const Rekognition = require('node-rekognition');
const fs = require('fs');
const path = require('path');
const AwsInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'secrets', 'aws-key.json')));



class AwsRekognitionService {
    constructor(options) {
        this._options = Object.assign({}, {
            "accessKeyId": AwsInfo.aws.accessKeyId,
            "secretAccessKey": AwsInfo.aws.secretAccessKey,
            "region": AwsInfo.aws.region,
            "bucket": AwsInfo.aws.bucket,
            "collection": AwsInfo.aws.collection
        }, options);
        this.service = new Rekognition(this._options);

    }

    _getService() {
        return this.service;
    }

    async _createCollection() { //사용자 이미지의 Collection 생성
        try {
            let result = await this.service.createCollection(this._options.collection);
            return result;
        } catch(error) {
            return error.message
        }

    }

    async indexFaces(collectionId, sourceImageFile) { //얼굴 특징에 대한 다차원 정보를 추출함
        try {
            await this._createCollection();
            return await this.service.indexFaces(collectionId, sourceImageFile)
        } catch(error) {
            return error.message
        }

    }

    getCollectionName() {
        return this._options.collection;
    }
    async listFaces() { //지정된 컬렉션의 얼굴에 대한 메타 데이터를 반환.
        return await this.service.listFaces(this._options.collection);
    }
    async searchFacesByImage(image) { //이미지의 가장 큰면을 감지 한 다음 Collection에서 일치하는 면 검색
        let result;
        try {
            result = await this.service.searchFacesByImage(this._options.collection, image)
        }  catch(error) {
            return false;
        }
        return result;

    }
}

module.exports = AwsRekognitionService;
