const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const { parsers, fallbackParser } = require("./parsers.js");

async function fetchForm(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "text/html" },
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const formElement = document.querySelector("form");
    if (!formElement) {
      console.log("No form element found.");
      return;
    }

    const formStructure = {
      action: formElement.action,
      fields: [],
      hiddenFields: [],
    };
    
  
    // Parse each list item
    const listItems = Array.from(
      document.querySelectorAll('[role="listitem"]')
    );
    const parsedFields = listItems.map((listItem) => {
      for (const parser of parsers) {
        if (parser.test(listItem)) {
          let value = parser.parse(listItem);
          return value;
        }
      }
      return fallbackParser.parse(listItem);
    });

    // Add parsed fields to form structure
    formStructure.fields = parsedFields;

    // Capture hidden fields
    const hiddenInputs = formElement.querySelectorAll('input[type="hidden"]');
    hiddenInputs.forEach((input) => {
      formStructure.hiddenFields.push({ name: input.name, value: input.value });
    });

    console.log(
      "\nParsed Form Structure:",
      JSON.stringify(formStructure, null, 2)
    );
  } catch (error) {
    console.error("Error fetching form:", error);
  }
}

const formUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSdW21MRyhWq9DqivBIJKGZ7Mp7qn10I8XTRz8_iC-7KOMNXuQ/viewform";
fetchForm(formUrl);
