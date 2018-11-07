exports.lambdaHandler = (event, context, callback) => {
  let images = event.Records.map(record => {
    return {
      bucket: record.s3.bucket.name,
      key: record.s3.object.key,
    }
  })

  callback(null, images);
};