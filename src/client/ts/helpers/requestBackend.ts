type QueryObject = {
	[index: string]: string | number | Blob,
}

/*const encodeQueryObject = (queryObject?: QueryObject) => {
	if(!queryObject) {
		return ""
	}
	
	const output = []
	for(let index in queryObject) {
		output.push(`${index}=${encodeURIComponent(queryObject[index])}`)
	}
	
	if(output.length) {
		return `?${output.join("&")}`
	}
	else {
		return ""
	}
}*/

type QueryType = "GET" | "POST"

export default async function requestBackend(
	endpoint: string,
	queryType?: QueryType,
	queryObject?: QueryObject,
	host: string = "https://0.0.0.0:5000",
): Promise<{}> {
	return new Promise((resolve, reject) => {
		let request = new XMLHttpRequest()
		request.open(queryType || "GET", `${host}${endpoint}`, true)
		request.responseType = "text"

		request.onload = (event) => {
			resolve(JSON.parse(request.response))
		}

		if(queryObject) {
			const formData = new FormData()
			for(const index in queryObject) {
				if(queryObject[index] === null || queryObject[index] === undefined) {
					continue
				}
				
				if(typeof queryObject[index] === "number") {
					formData.append(index, `${queryObject[index]}`)
				}
				else {
					formData.append(index, queryObject[index] as string | Blob)
				}
			}
			request.send(formData)
		}
		else {
			request.send()
		}
	})
}