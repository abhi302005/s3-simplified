import * as S3 from "@aws-sdk/client-s3"

const ERROR_CODES = {
  UPLOAD_FILE_ERROR: "UPLOAD_FILE_ERROR",
  READ_FILE_ERROR: "READ_FILE_ERROR",
  GET_FILE_INFO_ERROR: "GET_FILE_INFO_ERROR",
  DELETE_FILE_ERROR: "DELETE_FILE_ERROR",
}
export class S3Service {
  constructor(bucketName, region, credentials) {
    this._bucketName = bucketName

    this._s3 = new S3.S3Client({
      region: region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials?.sessionToken || null,
      },
    })
  }

  async _streamToString(stream) {
    return new Promise((resolve, reject) => {
      const chunks = []
      stream.on("data", (chunk) => chunks.push(chunk))
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
      stream.on("error", (err) => reject(err))
    })
  }

  async addData(payload, s3path, fileName) {
    try {
      //code
      if (!payload || !s3path || !fileName) {
        throw new Error(
          "Missing required inputs: payload, s3path, or fileName."
        )
      }
      if (typeof payload !== "object")
        throw new Error("Payload must be an object")

      const extension = "json"
      const ContentType = "application/json"
      fileName = String(fileName).split(/[./]/)[0]
      const s3Key = `${s3path}/${fileName}.${extension}`

      const s3Params = {
        Bucket: this._bucketName,
        Key: s3Key,
        Body: JSON.stringify(payload),
        ContentType: ContentType,
      }
      const command = new S3.PutObjectCommand(s3Params)
      const result = await this._s3.send(command)
      return { ...result, s3Key, success: true }
    } catch (error) {
      const errObj = {
        success: false,
        message: error.message || ERROR_CODES.UPLOAD_FILE_ERROR,
        code: error.code || "NOT_FOUND!",
        stack: error.stack || [],
      }
      // console.log(`ERROR @ uploadToS3`, errObj)
      delete errObj.stack
      delete errObj.code
      throw errObj
    }
  }

  async readData(s3path) {
    try {
      //code
      if (!s3path) {
        throw new Error("Missing required input: s3path")
      }
      const command = new S3.GetObjectCommand({
        Bucket: this._bucketName,
        Key: s3path,
      })
      const data = await this._s3.send(command)
      const bodyContents = await this._streamToString(data.Body)
      return JSON.parse(bodyContents)
    } catch (error) {
      const errObj = {
        success: false,
        message: error.message || ERROR_CODES.READ_FILE_ERROR,
        code: error.code || "NOT_FOUND!",
        stack: error.stack || [],
      }
      // console.log(`ERROR @ readFile`, errObj)
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
      const command = new S3.DeleteObjectCommand(s3Params)
      const data = await this._s3.send(command)
      return { ...data, success: true }
    } catch (error) {
      const errObj = {
        success: false,
        message: error.message || ERROR_CODES.DELETE_FILE_ERROR,
        code: error.code || "NOT_FOUND!",
        stack: error.stack || [],
      }
      // console.log(`ERROR @ deleteFile`, errObj)
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
      const command = new S3.HeadObjectCommand(s3Params)
      const headData = await this._s3.send(command)
      return { ...headData }
    } catch (error) {
      const errObj = {
        success: false,
        message: error.message || ERROR_CODES.GET_FILE_INFO_ERROR,
        code: error.code || "NOT_FOUND!",
        stack: error.stack || [],
      }
      // console.log(`ERROR @ getFileInfo`, errObj)
      delete errObj.stack
      delete errObj.code
      throw errObj
    }
  }
}
