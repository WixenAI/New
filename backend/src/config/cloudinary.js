const { v2: cloudinary } = require("cloudinary");

const hasCloudinaryCredentials =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (hasCloudinaryCredentials) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function ensureCloudinaryConfigured() {
  if (!hasCloudinaryCredentials) {
    throw new Error("Cloudinary is not configured.");
  }
}

async function uploadImageBuffer(file, { publicId } = {}) {
  ensureCloudinaryConfigured();

  if (!file?.buffer) {
    throw new Error("No file uploaded.");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        public_id: publicId,
        overwrite: true,
        invalidate: true,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed."));
        }

        return resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(file.buffer);
  });
}

async function destroyImage(publicId) {
  if (!publicId) {
    return;
  }

  ensureCloudinaryConfigured();
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
}

async function destroyImages(publicIds = []) {
  const uniqueIds = [...new Set(publicIds.filter(Boolean))];

  for (const publicId of uniqueIds) {
    await destroyImage(publicId);
  }
}

module.exports = {
  uploadImageBuffer,
  destroyImage,
  destroyImages,
  hasCloudinaryCredentials,
};
