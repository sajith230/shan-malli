export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  originalFilename?: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  original_filename?: string;
  error?: {
    message?: string;
  };
};

type UploadProgressCallback = (progress: number) => void;

function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
    );
  }

  return { cloudName, uploadPreset };
}

export function uploadCvToCloudinary(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "job-cvs");

    const request = new XMLHttpRequest();
    request.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      let data: CloudinaryUploadResponse = {};
      try {
        data = JSON.parse(request.responseText) as CloudinaryUploadResponse;
      } catch {
        reject(new Error("Cloudinary returned an invalid response."));
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(data.error?.message ?? "CV upload failed."));
        return;
      }

      if (!data.secure_url || !data.public_id) {
        reject(new Error("Cloudinary upload did not return a file URL."));
        return;
      }

      resolve({
        secureUrl: data.secure_url,
        publicId: data.public_id,
        originalFilename: data.original_filename,
      });
    };

    request.onerror = () => {
      reject(new Error("Could not upload CV. Please check your connection."));
    };

    request.send(formData);
  });
}
