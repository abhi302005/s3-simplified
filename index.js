import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

export class S3Service {
  constructor(bucketName, region, credentials) {
    this._bucketName = bucketName

    this._s3 = new S3Client({
      region: region,
      credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials?.sessionToken || null,
      },
    })
  }
  async uploadFile(
    payload,
    s3path,
    fileName,
    ContentType = "application/json"
  ) {
    try {
      //code
      if (!payload || !s3path || !fileName) {
        throw new Error(
          "Missing required inputs: payload, s3path, or fileName."
        )
      }
      const s3Params = {
        Bucket: this._bucketName,
        Key: `${s3path}/${fileName}`,
        Body: payload,
        ContentType: ContentType,
      }
      const result = await this._s3.upload(s3Params).promise()
      return result
    } catch (error) {
      const errObj = {
        status: error.status || error.statusCode || 500,
        success: false,
        message: error.message || "something went wrong while uploading file",
        code: error.code || "NOT_FOUND!",
        stack: error.stack || [],
      }
      console.log(`ERROR @ uploadToS3`, errObj)
      delete errObj.stack
      delete errObj.code
      throw errObj
    }
  }

  async _streamToString(stream) {
    return new Promise((resolve, reject) => {
      const chunks = []
      stream.on("data", (chunk) => chunks.push(chunk))
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
      stream.on("error", (err) => reject(err))
    })
  }

  async readFile(s3path) {
    try {
      //code
      if (!s3path) {
        throw new Error("Missing required input: s3path")
      }
      const s3Params = {
        Bucket: this._bucketName,
        Key: s3path,
      }
      const data = await this._s3.getObject(s3Params).promise()
      return JSON.parse(data.Body.toString("utf-8"))
    } catch (error) {
      const errObj = {
        status: error.status || error.statusCode || 500,
        success: false,
        message: error.message || "something went wrong while reading file",
        code: error.code || "NOT_FOUND!",
        stack: error.stack || [],
      }
      console.log(`ERROR @ readFileFromS3`, errObj)
      delete errObj.stack
      delete errObj.code
      throw errObj
    }
  }

  async deleteFile(s3path) {
    try {
      //code
      if (!s3path) {
        throw new Error("Missing required input: s3path")
      }
      const s3Params = {
        Bucket: this._bucketName,
        Key: s3path,
      }
      const data = await this._s3.deleteObject(s3Params).promise()
      return data
    } catch (error) {
      const errObj = {
        status: error.status || error.statusCode || 500,
        success: false,
        message: error.message || "something went wrong while deleting file",
        code: error.code || "NOT_FOUND!",
        stack: error.stack || [],
      }
      console.log(`ERROR @ deleteFromS3`, errObj)
      delete errObj.stack
      delete errObj.code
      throw errObj
    }
  }

  async getFileInfo(s3path) {
    try {
      if (!s3path) {
        throw new Error("Missing required inputs: s3path")
      }
      const s3Params = {
        Bucket: this._bucketName,
        Key: s3path,
      }
      const headData = await this._s3.headObject(s3Params).promise()
      return headData
    } catch (error) {
      const errObj = {
        status: error.status || error.statusCode || 500,
        success: false,
        message:
          error.message || "something went wrong while getting file info",
        code: error.code || "NOT_FOUND!",
        stack: error.stack || [],
      }
      console.log(`ERROR @ getFileInfo`, errObj)
      delete errObj.stack
      delete errObj.code
      throw errObj
      // return errObj
    }
  }
}
