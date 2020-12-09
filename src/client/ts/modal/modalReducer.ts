import Modal from "./modal"
import { popModal, pushModal } from "./modalActions"

export interface ModalState {
	// 'currentModal' is referenced directly or indirectly in its own type annotation.
	// ???????????????????????????????????????????????????????????????????????????????
	// @ts-ignore
	currentModal: typeof Modal
	modalStack: typeof Modal[]
}

const createDefaultState = () => ({
	currentModal: null,
	modalStack: [],
})

const modal = (state: ModalState = createDefaultState(), action): ModalState => {
	switch(action.type) {
		case pushModal: {
			return {
				...state,
				modalStack: [
					...state.modalStack,
					action.modal,
				],
				currentModal: action.modal, // current modal is always the one on the top
			}
		}

		case popModal: {
			state.modalStack.splice(state.modalStack.indexOf(action.modal), 1)
			const currentModal = state.modalStack.length != 0 ? state.modalStack[state.modalStack.length - 1] : null
			return {
				...state,
				modalStack: [...state.modalStack],
				currentModal,
			}
		}
		
		default: {
			return state
		}
	}
}

export default modal