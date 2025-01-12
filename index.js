import fs from "fs"
import * as S3 from "@aws-sdk/client-s3"
import { PutObjectMethodOptions, ACLString } from "./utils.js"

// #### START-SECTION: Error-Codes ####################
// Description:
const ERROR_CODES = {
  UPLOAD_FILE_ERROR: "UPLOAD_FILE_ERROR",
  READ_FILE_ERROR: "READ_FILE_ERROR",
  GET_FILE_INFO_ERROR: "GET_FILE_INFO_ERROR",
  DELETE_FILE_ERROR: "DELETE_FILE_ERROR",
  CREATE_BUCKET_ERROR: "CREATE_BUCKET_ERROR",
}
// #### END-SECTION: Error-Codes ####################

// #### START-SECTION: class S3Service ####################
// Description: ready-to-go functions to use S3 service
export class S3Service {
  constructor(region, credentials, defaultBucketName = null) {
    this._bucketName = defaultBucketName
    this._region = region
    this._s3 = new S3.S3Client({
      region: region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials?.sessionToken || null,
      },
    })
  }
  _isBucketExists() {
    if (this._bucketName === null) throw new Error("bucket not found!")
  }
  async _streamToString(stream) {
    return new Promise((resolve, reject) => {
      const chunks = []
      stream.on("data", (chunk) => chunks.push(chunk))
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
      stream.on("error", (err) => reject(err))
    })
  }

  // #### START-SECTION: addData() ####################
  // Description: function to add data in json format
  async addData(payload, s3path, fileName) {
    try {
      //code
      _isBucketExists()
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
        ContentType: ContentType, // bug : it's wrong | may give error
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

  // #### END-SECTION: addData() ####################

  // #### START-SECTION: readData() ####################
  // Description: function to read-data
  async readData(s3path) {
    try {
      //code
      _isBucketExists()
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
  // #### END-SECTION: readData() ####################

  // #### START-SECTION: deleteFile() ####################
  // Description: delete a particular file using file-path
  async deleteFile(s3path) {
    try {
      //code
      _isBucketExists()
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
  // #### END-SECTION: deleteFile() ####################

  // #### START-SECTION: getFileInfo() ####################
  // Description: get file info using file-path
  async getFileInfo(s3path) {
    try {
      _isBucketExists()
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
  // #### END-SECTION: getFileInfo() ####################

  // #### START-SECTION: uploadFile() ####################
  // Description: upload single file on s3 // testingInProgress : true;
  async uploadFile(file, s3Path, bucketName = this._bucketName, options = {}) {
    try {
      //code
      _isBucketExists()
      if (!file || typeof file !== "object" || s3Path)
        throw new Error("file or s3Path missing!")
      const metadata = Object.assign({}, options?.metadata)
      metadata["content-type"] =
        metadata["content-type"] ?? "application/octet-stream"

      const s3Key = `${s3Path}/${file?.originalname}`

      const s3Params = Object.assign(
        {},
        {
          BucketName: bucketName ?? this._bucketName,
          Body: fs.createReadStream(file?.path),
          Key: s3Path,
        },
        PutObjectMethodOptions({ metadata })
      )
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
      console.log(`ERROR @ uploadFile`, errObj)
      delete errObj.stack
      delete errObj.code
      throw errObj
      // return errObj
    }
  }
  // #### END-SECTION: uploadFile() ####################

  // #### START-SECTION: uploadMultipleFIles() ####################
  // Description: upload multiple files in a folder // testingInProgress : true;
  async uploadMultipleFiles(
    files,
    s3Path,
    bucketName = this._bucketName,
    options = {}
  ) {
    try {
      //code
      _isBucketExists()
      if (!files || !Array.isArray(files) || !s3Path)
        throw new Error("missing files or s3Path")
      const respArr = new Array()
      await Promise.all(
        files.map(async (file) => {
          const resp = this.uploadFile(file, s3Path, bucketName, options)
          respArr.push(resp)
        })
      )
      return respArr
    } catch (error) {
      const errObj = {
        success: false,
        message: error.message || ERROR_CODES.UPLOAD_FILE_ERROR,
        code: error.code || "NOT_FOUND!",
        stack: error.stack || [],
      }
      console.log(`ERROR @ uploadMultipleFiles`, errObj)
      delete errObj.stack
      delete errObj.code
      throw errObj
      // return errObj
    }
  }
  // #### END-SECTION: uploadMultipleFIles() ####################

  // #### START-SECTION: createBucket() ####################
  // Description: create new bucket // testingInProgress : true;
  async createBucket(bucketName, access = "private", isDefault = false) {
    try {
      //code
      if (!bucketName) throw new Error("bucketName missing")
      const s3Params = {
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: this._region,
        },
        ACL: ACLString(access),
      }
      const command = new S3.CreateBucketCommand(s3Params)
      const result = this._s3.send(command)
      if (isDefault) {
        this._bucketName = bucketName
      }
      return { ...result, success: true }
    } catch (error) {
      const errObj = {
        success: false,
        message: error.message || ERROR_CODES.CREATE_BUCKET_ERROR,
        code: error.code || "NOT_FOUND!",
        stack: error.stack || [],
      }
      console.log(`ERROR @ `, errObj)
      delete errObj.stack
      delete errObj.code
      throw errObj
      // return errObj
    }
  }
  // #### END-SECTION: createBucket() ####################
}
// #### END-SECTION: class S3Service ####################
