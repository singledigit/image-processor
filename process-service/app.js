// MIT License

// Copyright (c) 2018 Eric Johnson

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


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