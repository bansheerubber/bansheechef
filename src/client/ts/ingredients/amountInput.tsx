import * as React from "react"
import { convertToCups, ValidUnits } from "../helpers/convertUnits"

interface AmountInputProps {
	onChange: (cups: number) => void
	label?: string
}

interface AmountInputState {
	input: string
	units: ValidUnits
}

export default class AmountInput extends React.Component<AmountInputProps, AmountInputState> {
	private cups: number // current measurement in cups
	
	constructor(props) {
		super(props)

		this.state = {
			input: "",
			units: "cups",
		}
	}

	handleChange(input: string, units: ValidUnits) {
		// users are allowed to divide integers
		const match = input.match(/([0-9]+)\s*\/\s*([0-9+]+)/)
		let value
		if(match) {
			const integer1 = parseInt(match[1])
			const integer2 = parseInt(match[2])
			value = integer1 / integer2
		}
		else if(!input.match(/[^0-9\s\/]/g) && !isNaN(parseInt(input))) {
			value = parseInt(input)
		}

		if(input) {
			this.cups = convertToCups(value, units)
			if(this.props.onChange) {
				this.props.onChange(this.cups)
			}
		}
	}
	
	render(): JSX.Element {
		return <div className="amount-input">
			{
				this.props.label ? <label>{this.props.label}</label> : null
			}
			<input
				onChange={
					(event) => {
						this.setState({
							input: event.currentTarget.value,
						})
						this.handleChange(event.currentTarget.value, this.state.units)
					}
				}
				placeholder="Amount"
				value={this.state.input}
			/>
			<select
				onChange={
					(event) => {
						this.setState({
							units: event.currentTarget.value as ValidUnits,
						})
						this.handleChange(this.state.input, event.currentTarget.value as ValidUnits)
					}
				}
				value={this.state.units}
			>
				<option value="cups">Cups</option>
				<option value="tablespoons">Tablespoons</option>
				<option value="teaspoons">Teaspoons</option>
			</select>
		</div>
	}
}