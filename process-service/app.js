const AWS = require('aws-sdk');
const rek = new AWS.Rekognition();


exports.lambdaHandler = async (event) => {
  let faceDetectionPromises = []

  // Build array of images to process
  let images = event.Records.map(record => {
    return {
      bucket: record.body.Records[0].s3.bucket.name,
      key: record.body.Records[0].s3.object.key
    }
  })

  images.map(image => {
    let params = {
      Image: {
        S3Object: {
          Bucket: images[0].bucket,
          Name: images[0].key,
        }
      },
      Attributes: ['ALL']
    }

    faceDetectionPromises.push(rek.detectFaces(params).promise());
  })

  let detectFacesData = await Promise.all(faceDetectionPromises).catch(err => {
    console.log("Error Detecting Faces");
    Console.log(err.stack);
    return err.stack;
  })

  // push to dynamodb.

  return detectFacesData;
};