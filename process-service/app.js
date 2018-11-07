const AWS = require('aws-sdk');
const rek = new AWS.Rekognition();
const dc = new AWS.DynamoDB.DocumentClient();


exports.lambdaHandler = async (event) => {
  let faceDetectionPromises = [];
  let messageIds = [];
  let receiptHandles = [];
  let imageIds = [];
  let keys = [];

  // Build array of images to process
  event.Records.map(record => {
    messageIds.push(record.messageId);
    receiptHandles.push(record.receiptHandle);
    JSON.parse(record.body).Records.map(inner => {
      imageIds.push(inner.s3.object.eTag);
      keys.push(inner.s3.object.key);
      let params = {
        Image: {
          S3Object: {
            Bucket: inner.s3.bucket.name,
            Name: inner.s3.object.key,
          }
        },
        Attributes: ['ALL']
      }

      faceDetectionPromises.push(rek.detectFaces(params).promise());
    })
  })

  let detectFacesData = await Promise.all(faceDetectionPromises).catch(err => {
    console.log("Error Detecting Faces");
    Console.log(err.stack);
    return err.stack;
  })

  
  // push to dynamodb.
  let putParams = {
    RequestItems: {}
  }
  putParams.RequestItems[process.env.TABLE_NAME] = detectFacesData.map((face, i) => {
    return {
      PutRequest: {
        Item: {
          id: `${keys[i]}-${imageIds[i]}`,
          type: "detectFace",
          data: face.FaceDetails
        }
      }
    }
  })

  await dc.batchWrite(putParams).promise().catch(err => {
    console.log("Error Saving Data to Dynamo");
    console.log(err.stack);
    return err.stack;
  })

  return {success: true};
};