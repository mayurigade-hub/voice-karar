/**
 * frontend/src/services/audioUtils.js
 *
 * Utility functions for working with audio data.
 * The AI Agent (via the backend) requires audio as a base64-encoded string.
 */

/**
 * Converts a Blob (from MediaRecorder or file input) to a base64-encoded string.
 *
 * @param {Blob} blob - The audio blob to convert
 * @returns {Promise<string>} - Base64 string (without the data URI prefix)
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // result is: "data:audio/webm;base64,<data>"
      // We strip the prefix and return only the base64 data
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Returns the MIME type for a given audio Blob or File.
 * Falls back to 'audio/webm' if the type is not set (common for MediaRecorder output).
 *
 * @param {Blob|File} blob
 * @returns {string}
 */
export const getAudioMimeType = (blob) => {
  const type = (blob?.type || 'audio/webm').split(';')[0].trim().toLowerCase()
  return type || 'audio/webm'
}
