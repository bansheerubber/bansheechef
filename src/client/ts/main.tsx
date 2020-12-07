import * as React from "react"
import * as ReactDOM from "react-dom"
import Ingredient from "./ingredients/ingredient"
import "../scss/main.scss"
import IngredientSelection from "./ingredients/ingredientSelection"
import { createStore } from "redux"
import reducer from "./reducer"
import { Provider } from "react-redux"
import IngredientDraggable from "./ingredients/ingredientDraggable"
import IngredientsSettings from "./ingredients/ingredientSettings"
import Header from "./header/header"

const store = createStore(reducer)
window["store"] = store

ReactDOM.render(
	<Provider store={store}>
		<IngredientsSettings />

		<Header />

		<IngredientSelection>
			<IngredientDraggable />
			<Ingredient
				data={{
					image: "https://d1e3z2jco40k3v.cloudfront.net/-/media/mccormick-us/products/mccormick/c/800/chili-powder.png",
					name: "Chili Powder",
					amount: "1 bottle",
					percentLeft: "50% left",
				}}
			/>
			<Ingredient
				data={{
					image: "https://d1e3z2jco40k3v.cloudfront.net/-/media/mccormick-us/products/mccormick/c/800/chili-powder.png",
					name: "Chili Powder",
					amount: "1 bottle",
					percentLeft: "50% left",
				}}
			/>
			<Ingredient
				data={{
					image: "https://d1e3z2jco40k3v.cloudfront.net/-/media/mccormick-us/products/mccormick/c/800/chili-powder.png",
					name: "Chili Powder",
					amount: "1 bottle",
					percentLeft: "50% left",
				}}
			/>
			<Ingredient
				data={{
					image: "https://d1e3z2jco40k3v.cloudfront.net/-/media/mccormick-us/products/mccormick/c/800/chili-powder.png",
					name: "Chili Powder",
					amount: "1 bottle",
					percentLeft: "50% left",
				}}
			/>
			<Ingredient
				data={{
					image: "https://d1e3z2jco40k3v.cloudfront.net/-/media/mccormick-us/products/mccormick/c/800/chili-powder.png",
					name: "Chili Powder",
					amount: "1 bottle",
					percentLeft: "50% left",
				}}
			/>
			<Ingredient
				data={{
					image: "https://d1e3z2jco40k3v.cloudfront.net/-/media/mccormick-us/products/mccormick/c/800/chili-powder.png",
					name: "Chili Powder",
					amount: "1 bottle",
					percentLeft: "50% left",
				}}
			/>
			<Ingredient
				data={{
					image: "https://d1e3z2jco40k3v.cloudfront.net/-/media/mccormick-us/products/mccormick/c/800/chili-powder.png",
					name: "Chili Powder",
					amount: "1 bottle",
					percentLeft: "50% left",
				}}
			/>
			<Ingredient
				data={{
					image: "https://d1e3z2jco40k3v.cloudfront.net/-/media/mccormick-us/products/mccormick/c/800/chili-powder.png",
					name: "Chili Powder",
					amount: "1 bottle",
					percentLeft: "50% left",
				}}
			/>
			<Ingredient
				data={{
					image: "https://d1e3z2jco40k3v.cloudfront.net/-/media/mccormick-us/products/mccormick/c/800/chili-powder.png",
					name: "Chili Powder",
					amount: "1 bottle",
					percentLeft: "50% left",
				}}
			/>
			<Ingredient
				data={{
					image: "https://d1e3z2jco40k3v.cloudfront.net/-/media/mccormick-us/products/mccormick/c/800/chili-powder.png",
					name: "Chili Powder",
					amount: "1 bottle",
					percentLeft: "50% left",
				}}
			/>
			<Ingredient
				data={{
					image: "https://d1e3z2jco40k3v.cloudfront.net/-/media/mccormick-us/products/mccormick/c/800/chili-powder.png",
					name: "Chili Powder",
					amount: "1 bottle",
					percentLeft: "50% left",
				}}
			/>
		</IngredientSelection>
	</Provider>,
	document.getElementById("react")
)