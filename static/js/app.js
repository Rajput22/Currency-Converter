const BASE_URL = "https://api.exchangerate-api.com/v4/latest";
const fromSelect = document.getElementById("from-select");
const toSelect = document.getElementById("to-select");
const fromFlag = document.getElementById("from-flag");
const toFlag = document.getElementById("to-flag");
const fromCode = document.getElementById("from-code");
const toCode = document.getElementById("to-code");
const fromAmount = document.getElementById("from-amount");
const resultBox = document.getElementById("resultBox");
const swapBtn = document.getElementById("swap");
const btn = document.getElementById("btn");

let initialFrom = "USD";
let initialTo = "AUD";
for (let code in countryList) {
  const opt1 = new Option(code, code);
  const opt2 = new Option(code, code);
  fromSelect.add(opt1);
  toSelect.add(opt2);
}
fromSelect.value = initialFrom;
toSelect.value = initialTo;

function updateFlagLabel(selectEl, flagImgEl, codeSpanEl) {
  const code = selectEl.value;
  const countryCode = countryList[code]; 
  flagImgEl.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
  codeSpanEl.textContent = code;
}

updateFlagLabel(fromSelect, fromFlag, fromCode);
updateFlagLabel(toSelect, toFlag, toCode);

let prevFrom = fromSelect.value;
let prevTo = toSelect.value;

fromSelect.addEventListener("change", () => {
  if (fromSelect.value === toSelect.value) {
    toSelect.value = prevFrom;
    updateFlagLabel(toSelect, toFlag, toCode);
  }
  updateFlagLabel(fromSelect, fromFlag, fromCode);
  prevFrom = fromSelect.value;
    fromAmount.value = "";
    resultBox.value = "";

});

toSelect.addEventListener("change", () => {
  if (toSelect.value === fromSelect.value) {
    fromSelect.value = prevTo;
    updateFlagLabel(fromSelect, fromFlag, fromCode);
  }
  updateFlagLabel(toSelect, toFlag, toCode);
  prevTo = toSelect.value;

    fromAmount.value = "";
    resultBox.value = "";

});

swapBtn.addEventListener("click", () => {
  const a = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = a;
  updateFlagLabel(fromSelect, fromFlag, fromCode);
  updateFlagLabel(toSelect, toFlag, toCode);
  prevFrom = fromSelect.value;
  prevTo = toSelect.value;
});

btn.addEventListener("click", async () => {
  let amt = parseFloat(fromAmount.value);
  if (!amt || amt <= 0) amt = 1;

  const URL = `${BASE_URL}/${fromSelect.value}`;
  try {
    const response = await fetch(URL);
    if (!response.ok) throw new Error("Network response error");
    const data = await response.json();
    const rate = data.rates[toSelect.value];
    const finalAmt = (amt * rate).toFixed(2);
    resultBox.value = `${finalAmt} ${toSelect.value}`;

    await fetch("/converter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        from_currency: fromSelect.value,
        to_currency: toSelect.value,
        amount: amt,
        result: finalAmt,
        rate: rate
      })
    });
  } catch (err) {
    resultBox.value = "Error";
    console.error(err);
  }
});
