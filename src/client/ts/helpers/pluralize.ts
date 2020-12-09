export const pluralize = (amount: number, name: string) => {
	if(amount != 1) {
		return `${name}s`
	}
	else {
		return name
	}
}