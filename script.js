const sliderProps = {
	fill: "#8D00FF",
	background: "rgba(255, 255, 255, 0.214)",
};

const slider = document.querySelector(".range__slider");
const sliderValue = document.querySelector(".length__title");

// Update the slider fill and label as the user slides around
slider.querySelector("input").addEventListener("input", event => {
	sliderValue.setAttribute("data-length", event.target.value);
	applyFill(event.target);
});
applyFill(slider.querySelector("input"));

// Properly set the slider fill and label when the page loads
function applyFill(slider) {
	const percentage = (100 * (slider.value - slider.min)) / (slider.max - slider.min);
	slider.style.background = `linear-gradient(90deg, ${sliderProps.fill} ${percentage}%, ${sliderProps.background} ${percentage}%)`;
	sliderValue.setAttribute("data-length", slider.value);
}

// math.random() is not very secure
function getRandomInt(min, max) {
	const range = max - min + 1;
	const randomBuffer = new Uint32Array(1);
	window.crypto.getRandomValues(randomBuffer);
	return min + (randomBuffer[0] % range);
}

// Get a random lowercase letter, a-z
function getRandomLower() {
	return String.fromCharCode(getRandomInt(97, 122));
}

// Get a random uppercase letter, A-Z
function getRandomUpper() {
	return String.fromCharCode(getRandomInt(65, 90));
}

// Get a random digit, 0-9
function getRandomNumber() {
	return String.fromCharCode(getRandomInt(48, 57));
}

// Get random symbol (should be compatible for most websites, I know some sites don't allow certain symbols)
function getRandomSymbol() {
	const symbols = '!@#$%^&*()_+';
	return symbols[getRandomInt(0, symbols.length - 1)];
}

const randomFunc = {
	lower: getRandomLower,
	upper: getRandomUpper,
	number: getRandomNumber,
	symbol: getRandomSymbol,
};

// Grab all the DOM elements we care about
const resultBox = document.getElementById("result");
const lengthSlider = document.getElementById("slider");
const uppercaseCheckbox = document.getElementById("uppercase");
const lowercaseCheckbox = document.getElementById("lowercase");
const numberCheckbox = document.getElementById("number");
const symbolCheckbox = document.getElementById("symbol");
const generateButton = document.getElementById("generate");
const resultContainer = document.querySelector(".result");
const copyInfoText = document.querySelector(".result__info.right");
const copiedInfoText = document.querySelector(".result__info.left");

let generatedPassword = false;
let clearTimeoutId = null;

// When you click "Generate"
generateButton.addEventListener("click", () => {
	const length = +lengthSlider.value;
	const hasLower = lowercaseCheckbox.checked;
	const hasUpper = uppercaseCheckbox.checked;
	const hasNumber = numberCheckbox.checked;
	const hasSymbol = symbolCheckbox.checked;
	generatedPassword = generatePassword(length, hasLower, hasUpper, hasNumber, hasSymbol);
	resultBox.innerText = "CLICK ME!";
	copyInfoText.style.transform = "translateY(200%)";
	copyInfoText.style.opacity = "0";
	copiedInfoText.style.transform = "translateY(0%)";
	copiedInfoText.style.opacity = "0";
	if (clearTimeoutId) {
		clearTimeout(clearTimeoutId);
		clearTimeoutId = null;
	}
});

// Copy password to clipboard
document.addEventListener('DOMContentLoaded', function () {
	const copyArea = document.getElementById('copy-area');
	const result = document.getElementById('result');
	if (copyArea && result) {
		copyArea.addEventListener('click', function () {
			if (generatedPassword) {
				navigator.clipboard.writeText(generatedPassword);
				result.innerText = "COPIED NEW PASSWORD";
				if (clearTimeoutId) {
					clearTimeout(clearTimeoutId);
					clearTimeoutId = null;
				}
				// Reset the result text after 5 seconds
				generatedPassword = false;
				clearTimeoutId = setTimeout(() => {
					result.innerText = "";
					lengthSlider.value = lengthSlider.min;
					sliderValue.setAttribute("data-length", lengthSlider.value);
					applyFill(slider.querySelector("input"));
				}, 2000);
			}
		});
		copyArea.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				copyArea.click();
			}
		});
	}
});

function generatePassword(length, lower, upper, number, symbol) {
	const typesArr = [
		{ lower }, { upper }, { number }, { symbol }
	].filter(item => Object.values(item)[0]);
	const typesCount = typesArr.length;
	if (typesCount === 0) return "";

	let passwordChars = [];

	// Make sure we include at least one of each selected type
	typesArr.forEach(type => {
		const funcName = Object.keys(type)[0];
		passwordChars.push(randomFunc[funcName]());
	});

	// Fill the rest with random picks from the selected types
	for (let i = passwordChars.length; i < length; i++) {
		const randType = typesArr[getRandomInt(0, typesCount - 1)];
		const funcName = Object.keys(randType)[0];
		passwordChars.push(randomFunc[funcName]());
	}

	// Shuffle for extra randomness—no predictable patterns here!
	for (let i = passwordChars.length - 1; i > 0; i--) {
		const j = getRandomInt(0, i);
		[passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
	}

	return passwordChars.join('');
}

// Don't let the user uncheck all the boxes—at least one type must stay checked!
function disableOnlyCheckbox() {
	let totalChecked = [uppercaseCheckbox, lowercaseCheckbox, numberCheckbox, symbolCheckbox].filter(box => box.checked)
	totalChecked.forEach(box => {
		box.disabled = totalChecked.length === 1;
	})
}

// Listen for clicks on all the checkboxes to enforce the rule above
[uppercaseCheckbox, lowercaseCheckbox, numberCheckbox, symbolCheckbox].forEach(box => {
	box.addEventListener('click', () => {
		disableOnlyCheckbox()
	})
})