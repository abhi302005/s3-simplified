export function PutObjectMethodOptions(options = {}) {
  const methodOptions = {}
  // ACL: add only if explicitly passed
  if (options.access) {
    methodOptions.ACL = ACLString(options.access)
  }
  // Storage class
  if (options.class) {
    methodOptions.StorageClass = options.class
  }
  // Enable server-side encryption
  if (options.serverSideEncryption) {
    methodOptions.ServerSideEncryption = "AES256"
  }
  // Metadata
  if (options.metadata) {
    methodOptions.Metadata = {}
    for (const key in options.metadata) {
      if (!options.metadata[key]) {
        continue
      }
      const keyLowerCase = key.toLowerCase()
      switch (keyLowerCase) {
        case "cache-control":
          methodOptions.CacheControl = options.metadata[key]
          break
        case "content-disposition":
          methodOptions.ContentDisposition = options.metadata[key]
          break
        case "content-encoding":
          methodOptions.ContentEncoding = options.metadata[key]
          break
        case "content-language":
          methodOptions.ContentLanguage = options.metadata[key]
          break
        case "content-md5":
          methodOptions.ContentMD5 = options.metadata[key]
          break
        case "content-type":
          methodOptions.ContentType = ContentType(options.metadata[key])
          break
        default:
          methodOptions.Metadata[key] = options.metadata[key]
          break
      }
    }
  }
  return methodOptions
}

export function ACLString(access) {
  switch (access) {
    case "public-read":
    case "public":
      return "public-read"
    case "public-read-write":
    case "authenticated-read":
      return access
    case "none":
    case "private":
    default:
      return "private"
  }
}

function ContentType(type) {
  const allowedAccessType = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
    "text/plain",
    "text/rtf",
    "application/zip",
    "application/pdf",
  ]
  const defaultType = "application/octet-stream"

  return allowedAccessType.includes(type) ? type : defaultType
}
