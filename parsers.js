/* Metadata / params helper functions */

function parseDataParams(dataParamString) {
  let cleanedParams = null;
  try {
    // Clean up Google Forms custom format for JSON parsing
    cleanedParams = dataParamString
      .replace(/&quot;/g, '"') // Replace encoded quotes with actual quotes
      .replace(/^%.@\.\[/, "[[") // Remove custom prefix
      .replace(/\]$/, "]") // Ensure it ends correctly
      .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas before array or object end
      .replace(/,(?=\s*[,}\]])/g, "null"); // Replace empty entries with null

    // Parse the cleaned string as JSON
    const parsedDataParams = JSON.parse(cleanedParams);
    return parsedDataParams;
  } catch (error) {
    console.warn("Failed to parse data-params:", error);
    console.warn("Params were: ");
    console.warn(cleanedParams);
    return null;
  }
}

// Utility function to parse common metadata
function parseMetadata(element) {
  // Parse question label
  const questionTextElement = element.querySelector('[role="heading"]');
  const questionText = questionTextElement
    ? questionTextElement.textContent.trim()
    : "Unnamed";

  // Get raw data-params text
  const rawDataParams = element
    .querySelector("[data-params]")
    ?.getAttribute("data-params");

  // Attempt to parse data-params as JSON-like structure
  let parsedDataParams = null;
  if (rawDataParams) {
    parsedDataParams = parseDataParams(rawDataParams);
  }

  return {
    question: questionText,
    rawDataParams,
    parsedDataParams,
  };
}

/**
 * Main parsers: each parser is an ItemParser
 */


class ItemParser {
  constructor(name, test, parse) {
    this.name = name;
    this.test = test;
    this.parse = parse;
  }
}


const dateParser = new ItemParser(
  "Date",
  (element) =>
    element.querySelector('input[type="text"][aria-label="Year"]') !== null,
  (element) => {
    const metadata = parseMetadata(element);
    const monthInput = element.querySelector('input[aria-label="Month"]');
    const dayInput = element.querySelector(
      'input[aria-label="Day of the month"]'
    );
    const yearInput = element.querySelector('input[aria-label="Year"]');

    return {
      ...metadata,
      type: "date",
      inputType: "date",
      metadata: {
        month: {
          min: monthInput ? monthInput.getAttribute("min") : "1",
          max: "12",
        },
        day: {
          min: dayInput ? dayInput.getAttribute("min") : "1",
          max: "31",
        },
        year: {
          min: yearInput ? yearInput.getAttribute("min") : "1900",
          max: "2100",
        },
      },
    };
  }
);


const timeParser = new ItemParser(
  "Time",
  (element) => element.querySelector('input[aria-label="Hour"]') !== null,
  (element) => {
    const metadata = parseMetadata(element);
    const hourInput = element.querySelector('input[aria-label="Hour"]');
    const minuteInput = element.querySelector('input[aria-label="Minute"]');
    const periodInput = element.querySelector('[role="listbox"]');

    return {
      ...metadata,
      type: "time",
      inputType: "time",
      metadata: {
        hour: { min: "1", max: "12" },
        minute: { min: "0", max: "59" },
        period: { options: ["AM", "PM"] },
      },
    };
  }
);


const dropdownParser = new ItemParser(
  "Dropdown",
  (element) => element.querySelector('[role="listbox"]') !== null,
  (element) => {
    const metadata = parseMetadata(element);
    const hiddenInput = element.querySelector(
      'input[type="hidden"][name*="entry"]'
    );
    const fieldId = hiddenInput ? hiddenInput.name : null;
    const options = Array.from(element.querySelectorAll('[role="option"]')).map(
      (option) => ({
        label: option.textContent.trim(),
        value: option.getAttribute("data-value"),
      })
    );

    return {
      ...metadata,
      fieldId,
      type: "dropdown",
      inputType: "select",
      options,
    };
  }
);


const textParser = new ItemParser(
  "Text",
  (element) => element.querySelector('input[type="text"]') !== null,
  (element) => {
    const metadata = parseMetadata(element);
    const textInput = element.querySelector('input[type="text"]');
    const fieldId = textInput ? textInput.name : null;

    return {
      ...metadata,
      fieldId,
      type: "text",
      inputType: "text",
    };
  }
);


const textareaParser = new ItemParser(
  "Textarea",
  (element) => element.querySelector("textarea") !== null,
  (element) => {
    const metadata = parseMetadata(element);
    const textarea = element.querySelector("textarea");
    const fieldId = textarea ? textarea.name : null;

    return {
      ...metadata,
      fieldId,
      type: "textarea",
      inputType: "textarea",
    };
  }
);


const radioParser = new ItemParser(
  "Radio",
  (element) => element.querySelector('[role="radiogroup"]') !== null,
  (element) => {
    const metadata = parseMetadata(element);
    const hiddenInput = element.querySelector(
      'input[type="hidden"][name*="entry"]'
    );
    const fieldId = hiddenInput ? hiddenInput.name : null;

    const options = Array.from(element.querySelectorAll('[role="radio"]')).map(
      (option) => ({
        label: option.getAttribute("aria-label"),
        value: option.getAttribute("data-value"),
        selected: option.getAttribute("aria-checked") === "true",
      })
    );

    // Check for an "Other" option
    const otherInput = element.querySelector(
      'input[type="text"][aria-label="Other response"]'
    );
    if (otherInput) {
      options.push({
        label: "Other",
        value: "__other_option__",
        selected: false,
        inputType: "text",
        inputFieldId: otherInput.getAttribute("name"),
      });
    }

    return {
      ...metadata,
      fieldId,
      type: "radio",
      inputType: "radio",
      options,
      hasOtherOption: Boolean(otherInput),
    };
  }
);


const fallbackParser = new ItemParser(
  "Fallback",
  () => true,
  (element) => {
    console.log("Unknown field type. Raw HTML:", element.outerHTML);
    const metadata = parseMetadata(element);
    return {
      ...metadata,
      type: "unknown",
      rawHTML: element.outerHTML,
    };
  }
);

 const parsers = [
   dateParser,
   timeParser,
   radioParser,
   dropdownParser,
   textParser,
   textareaParser,
 ];

 exports.fallbackParser = fallbackParser;
 exports.parsers = parsers;

 