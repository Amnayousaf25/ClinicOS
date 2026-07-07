export const AWS_ERROR = {
  UPLOAD_FILE: (message: string) =>
    `An error occurred while uploading the file. ${message}`,
  FILE_NOT_FOUND: 'File not found.',
  DELETE_FILE: (message: string) =>
    `An error occurred while deleting the file. ${message}`,
  INVALID_FILE: 'AWS credentials or region not configured properly',
  PRESIGNED_URL: (message: string) =>
    `An error occurred while generating presigned URL. ${message}`,
};

export enum AWS_SUCCESS {
  UPLOAD_FILE = 'File uploaded successfully.',
  DELETE_FILE = 'File deleted successfully.',
  PRESIGNED_URL = 'Presigned URL generated successfully.',
}
