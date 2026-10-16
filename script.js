const CHARSETS = {
	lowercase: "abcdefghijklmnopqrstuvwxyz",
	number: "0123456789",
	uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
};

// Modes are exclusive, so symbols never count as two required classes.
const SYMBOLS = {
	all: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
	common: "!@#$%^&*()-_=+",
	off: "",
};

const MAX_LENGTH = 1024;

// Rejection sampling avoids modulo bias. No Math.random fallback, by design.
function randomIndex(max) {
	const limit = 2 ** 32 - (2 ** 32 % max);
	const value = new Uint32Array(1);
	do {
		crypto.getRandomValues(value);
	} while (value[0] >= limit);
	return value[0] % max;
}

// Rejection keeps all valid passwords equally likely. Invalid input throws RangeError.
function generatePassword(length, options) {
	if (options === null || typeof options !== "object") throw new RangeError("Invalid password options");
	const mode = options.symbols ?? "off";
	if (typeof mode !== "string" || !Object.hasOwn(SYMBOLS, mode)) throw new RangeError("Invalid symbol mode");

	const sets = Object.keys(CHARSETS)
		.filter(name => options[name] === true)
		.map(name => CHARSETS[name]);
	if (SYMBOLS[mode]) sets.push(SYMBOLS[mode]);

	if (!sets.length || !Number.isSafeInteger(length) || length < sets.length || length > MAX_LENGTH) {
		throw new RangeError("Invalid password options");
	}

	const alphabet = sets.join("");
	const indices = new Uint8Array(length);
	let password;

	try {
		do {
			for (let i = 0; i < length; i++) {
				indices[i] = randomIndex(alphabet.length);
			}
			password = Array.from(indices, idx => alphabet[idx]).join("");
		} while (!sets.every(set => [...set].some(char => password.includes(char))));
	} finally {
		// Best effort: JS strings cannot be wiped.
		indices.fill(0);
	}
	return password;
}

const boxes = [...document.querySelectorAll(".setting input")];
const copyButton = document.getElementById("copy");
const lengthLabel = document.querySelector(".length__title");
const lengthSlider = document.getElementById("slider");
const statusText = document.getElementById("status");
const symbolRadios = [...document.querySelectorAll(".symbols input")];

let password = "";
// Lets a slow copy detect that a newer password replaced it.
let generation = 0;

function show(message) {
	copyButton.textContent = statusText.textContent = message;
}

function updateLength() {
	lengthLabel.dataset.length = lengthSlider.value;
	lengthSlider.style.setProperty("--fill", (lengthSlider.value - lengthSlider.min) / (lengthSlider.max - lengthSlider.min));
}

lengthSlider.addEventListener("input", updateLength);
updateLength();

document.getElementById("generate").addEventListener("click", () => {
	password = "";
	generation++;

	if (!window.isSecureContext) {
		return show("Secure context required (HTTPS/localhost)");
	}

	const options = Object.fromEntries(boxes.map(box => [box.id, box.checked]));
	options.symbols = symbolRadios.find(radio => radio.checked).value;
	if (!Object.keys(CHARSETS).some(name => options[name]) && options.symbols === "off") {
		return show("Select at least one character type");
	}

	try {
		password = generatePassword(+lengthSlider.value, options);
		show("click to copy");
	} catch (error) {
		show(error instanceof RangeError ? "Invalid password settings" : "Secure random generator unavailable");
	}
});

copyButton.addEventListener("click", async () => {
	const copied = password;
	const started = generation;
	if (!copied) return show("Generate a password first");

	try {
		await navigator.clipboard.writeText(copied);
	} catch {
		if (started === generation) show("Copy failed, click to retry");
		return;
	}

	if (started !== generation) return;
	password = "";
	show("Copied new password");
});

const symbolSwitch = document.querySelector(".switch3");
let dragStart = null;
let dragged = false;

if (symbolSwitch) {
	symbolSwitch.addEventListener("pointerdown", event => {
		dragStart = event.clientX;
		dragged = false;
		symbolSwitch.setPointerCapture(event.pointerId);
	});

	symbolSwitch.addEventListener("pointermove", event => {
		if (dragStart === null || (Math.abs(event.clientX - dragStart) < 6 && !dragged)) return;
		dragged = true;
		const { left, width } = symbolSwitch.getBoundingClientRect();
		const index = Math.min(2, Math.max(0, Math.round(((event.clientX - left - 14) / (width - 28)) * 2)));
		if (symbolRadios[index]) symbolRadios[index].checked = true;
	});

	symbolSwitch.addEventListener("pointerup", () => (dragStart = null));

	document.querySelector(".symbols")?.addEventListener("click", event => {
		if (dragged || event.target.closest("input")) return void (dragged = false);
		const currentIndex = symbolRadios.findIndex(radio => radio.checked);
		const nextIndex = (currentIndex + 1) % symbolRadios.length;
		if (symbolRadios[nextIndex]) symbolRadios[nextIndex].checked = true;
	});
}