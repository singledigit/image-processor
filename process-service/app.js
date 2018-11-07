exports.lambdaHandler = (event, context, callback) => {
  let images = event.Records.map(record => {
    return {
      bucket: record.body.Records[0].s3.bucket.name,
      key: record.body.Records[0].s3.object.key
    }
  })

  callback(null, images);
};