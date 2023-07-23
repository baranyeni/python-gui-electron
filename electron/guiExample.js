const { exec } = require("child_process");
const nodeConsole = require("console");
const { ipcRenderer } = require("electron");

const terminalConsole = new nodeConsole.Console(process.stdout, process.stderr);
let child;
let printerScript;
let parsed_messages = "";

ipcRenderer.send("run-command", "ls");
ipcRenderer.on("run-command-result", (event, result) => {
  if (result.error) {
    console.error("Error:", result.error);
  } else {
    console.log("Output:", result.output);
  }
});

const printBoth = (str) => {
  console.log(`Javascript: ${str}`);
  terminalConsole.log(`Javascript: ${str}`);
};

const sendToProgram = (str) => {
  child.stdin.write(`${str}\n@@END@@\n`);

  child.stdout.on("data", (data) => {
    if (data.toString().includes("Python    : ")) {
      return
    }

    parsed_messages = JSON.parse(data.toString('utf8'));
    document.getElementById("order_list").innerHTML = "";

    Object.keys(parsed_messages).forEach((username) => {
      console.log (parsed_messages[username]);
      document.getElementById("order_list").innerHTML += `<div class="order">
        <h3 class="username">${username}</h3>
        <ul class="messages">
            ${parsed_messages[username]['messages'].map((message) => `<li contentEditable="true">${message}</li>`).join("")}
        </ul>
        </div>`;
    });
  });
};

const sendToPrinterScript = (messages) => {
  printerScript.stdin.write(`${messages}\n@@END@@\n`);

  printerScript.stdout.on("data", (data) => {
    console.log("Printer script: ", data.toString('utf8'));
    if (data.toString().includes("Python    : ")) {
      if (data.toString().includes('ERROR: ')) {
        alert(data.toString().replace('Python    : ', ''));
      }
    }
  });
};

const startCodeFunction = () => {
  printBoth("Initiating program: Parser");

  child = exec("python3 -i ./python/parser.py", (error) => {
    if (error) {
      printBoth(`Error while executing the Python executable: parser.py ${error}`);
    }
  });
};

const startPrinterScript = () => {
  printBoth("Initiating program: Printer");

  printerScript = exec("python3 -i ./python/printer.py", (error) => {
    if (error) {
      printBoth(`Error while executing the Python executable: printer.py ${error}`);
    }
  });
};

const parseMessages = () => {
  document.getElementById("order_list").innerHTML = "Yükleniyor..";
  startCodeFunction();
  const stringToSend = document.getElementById("message_text").value;
  sendToProgram(stringToSend);

  stopCodeFunction();
};

const printMessages = () => {
  startPrinterScript();
  let orders = document.getElementsByClassName("order")

  for (order of orders) {
    let username = order.getElementsByClassName("username")[0].innerHTML;
    let messages = order.getElementsByClassName("messages")[0].innerHTML;
    let messagesToSend = messages.replace(/<li>/g, "").replace(/<\/li>/g, "").split("\n").filter((message) => message !== "");

    printObject = {
        username: username,
        messages: messagesToSend,
        delivery_address: document.getElementById("delivery_address").value
    }

    setTimeout(function(){
      sendToPrinterScript(JSON.stringify(printObject));
    }, 1500);

    }

  stopPrinterScript();
}

const stopCodeFunction = () => {
  child.stdin.end();
};

const stopPrinterScript = () => {
  printerScript.stdin.end();
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("parse_messages").addEventListener("click", parseMessages);
  document.getElementById("print_orders").addEventListener("click", printMessages);
});
