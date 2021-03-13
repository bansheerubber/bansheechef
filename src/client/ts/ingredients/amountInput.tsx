import * as React from "react"
import {
	calculateFraction,
	convertToCups,
	convertToReasonableMeasurement,
	Cups,
	lowestUnitValues,
	ReasonableFormat,
	ReasonableFormatObject,
	ValidUnits
} from "../helpers/convertUnits"

interface AmountInputProps {
	defaultInput?: number
	defaultUnits?: ValidUnits
	onChange: (cups: number) => void
	label?: string
	max?: Cups
	useRange?: boolean
}

interface AmountInputState {
	input: string
	range: number
	units: ValidUnits
}

export default class AmountInput extends React.Component<AmountInputProps, AmountInputState> {
	private cups: number // current measurement in cups
	
	constructor(props) {
		super(props)

		let input = ""
		let range = 0
		if(this.props.defaultInput) {
			const reasonable = (convertToReasonableMeasurement(
				this.props.defaultInput,
				ReasonableFormat.OBJECT_FORMAT,
				this.props.defaultUnits,
			) as ReasonableFormatObject)
			
			input = reasonable.uiValue
			range = reasonable.value
			this.cups = convertToCups(reasonable.value, this.props.defaultUnits)
		}

		this.state = {
			input,
			range,
			units: "cup",
		}
	}

	handleChange(input: string, units: ValidUnits) {
		const value = calculateFraction(input)
		if(input) {
			this.cups = convertToCups(value, units)

			if(this.props.max && this.cups > this.props.max) {
				
			}
			// only update if we have valid input
			else {
				if(this.props.onChange) {
					this.props.onChange(this.cups)
				}
			}
		}
		else {
			this.props.onChange(null) // no information to present
		}
		return value
	}
	
	render(): JSX.Element {
		return <>
			{
				this.props.useRange
					? <input
						type="range"
						onChange={(event) => {
							const value = parseFloat(event.currentTarget.value)
							// snap to reasonable values
							const reasonable = (convertToReasonableMeasurement(
								value,
								ReasonableFormat.OBJECT_FORMAT,
								this.state.units
							) as ReasonableFormatObject)

							this.handleChange(reasonable.uiValue, this.state.units)

							this.setState({
								input: reasonable.uiValue,
								range: reasonable.value,
							})
						}}
						min={lowestUnitValues[this.state.units]}
						max={this.props.max + 0.001}
						step={0.0001}
						value={this.state.range}
					/>
					: null
			}
			<div className="amount-input">
				{
					this.props.label ? <label>{this.props.label}</label> : null
				}
				<input
					onChange={
						(event) => {
							this.setState({
								input: event.currentTarget.value,
								range: this.handleChange(event.currentTarget.value, this.state.units),
							})
						}
					}
					placeholder="Amount"
					value={this.state.input}
				/>
				<select
					onChange={
						(event) => {
							const reasonable = (convertToReasonableMeasurement(
								this.cups,
								ReasonableFormat.OBJECT_FORMAT,
								event.currentTarget.value as ValidUnits
							) as ReasonableFormatObject)

							this.setState({
								input: reasonable.uiValue,
								range: reasonable.value,
								units: event.currentTarget.value as ValidUnits,
							})
						}
					}
					value={this.state.units}
				>
					<option value="cup">Cups</option>
					<option value="tablespoon">Tablespoons</option>
					<option value="teaspoon">Teaspoons</option>
				</select>
			</div>
		</>
	}
}