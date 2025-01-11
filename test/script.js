import { S3Service } from "s3-simplified"

const bucket = ""
const region = ""
const s3 = new S3Service(bucket, region, {
  accessKeyId: "",
  secretAccessKey: "",
  sessionToken: "" || null,
})

const s3path = ""
try {
  console.log(await s3.readData(s3path))
  console.log(await s3.getFileInfo(s3path))
  console.log(
    await s3.addData(
      {
        id: "b5ee0086-10af-446a-b4e4-51b00d8b6a10",
        name: "test",
        type: "json",
      },
      "test/s3",
      "test"
    )
  )
  console.log(await s3.deleteFile(s3path))
} catch (error) {
  console.log(error)
}
