import Modal from "./modal";

export const pushModal = (modal: typeof Modal) => ({
	type: pushModal,
	modal,
})

export const popModal = (modal: typeof Modal) => ({
	type: popModal,
	modal,
})