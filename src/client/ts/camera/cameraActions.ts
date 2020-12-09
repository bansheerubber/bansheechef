export const setCameraPicture = (picture: string, pictureBlob: Blob) => ({
  type: setCameraPicture,
  picture,
  pictureBlob,
})

export const setCameraModalShown = (shown: boolean) => ({
  type: setCameraModalShown,
  shown,
})