const debounceTable = {}

/**
 * debounces the specified function
 * @param func callback function
 * @param time time to debounce in seconds
 * @param args args for callback function
 */
export const debounce = (func: (...args: any[]) => any, time: number, ...args: any[]) => {
	// debounce
	if(debounceTable[func as any] !== undefined) {
		clearTimeout(debounceTable[func as any])
	}
	
	// call function
	debounceTable[func as any] = setTimeout(() => {
		func.apply(null, args)
		debounceTable[func as any] = undefined
	}, (time * 1000) | 0)
}