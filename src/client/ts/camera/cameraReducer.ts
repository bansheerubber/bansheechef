import { setCameraModalShown, setCameraPicture } from "./cameraActions"

export interface CameraState {
	modalShown: boolean
	picture: string
	pictureBlob: Blob
}

const createDefaultState = () => ({
	modalShown: false,
	picture: null,
	pictureBlob: null,
})

const camera = (state: CameraState = createDefaultState(), action): CameraState => {
	switch(action.type) {
		case setCameraModalShown: {
			return {
				...state,
				modalShown: action.shown,
			}
		}
		
		case setCameraPicture: {
			return {
				...state,
				picture: action.picture,
				pictureBlob: action.pictureBlob,
			}
		}
		
		default: {
			return state
		}
	}
}

export default camera