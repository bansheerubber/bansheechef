export const resolveUrl = (url) => {
	let match
	if(match = url?.match(/^local:(.+)/)) {
		return `https://localhost:5000/images/${match[1]}`
	}
	else {
		return url
	}
}