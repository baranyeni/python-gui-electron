const { exec } = require("child_process");
const nodeConsole = require("console");

const terminalConsole = new nodeConsole.Console(process.stdout, process.stderr);
let parserScript = null;
let printerScript = null;
let parsed_messages = "";

const printBoth = (text) => {
  if (text.includes("Access denied (insufficient permissions)")) {
    alert("Yazıcıyı ve programı yeniden başlatın.")
  }
  console.log (243, text)
  console.log(`Javascript: ${text}`);
  terminalConsole.log(`Javascript: ${text}`);
};

const sendToParser = (str) => {
  parserScript.stdin.write(`${str}\n@@END@@\n`);

  parserScript.stdout.on("data", (data) => {
    if (data.toString().includes("Python    : ")) { return printBoth("From python: ", data) }

    parsed_messages = JSON.parse(data.toString('utf8'));
    updateCount();
    document.getElementById("order_list").innerHTML = "";

    Object.keys(parsed_messages).forEach((username) => {
      document.getElementById("order_list").innerHTML += `<div class="order" id="${username}">
        <h3 class="username">${username}</h3>
        <textarea rows="${parsed_messages[username]['messages'].length + 2}" class="messages">${parsed_messages[username]['messages'].join(`\n`)}</textarea>
        </div>`;
    });
  });
};

const updateCount = () => {
  let delivery_address = document.getElementById("delivery_address").value
  let order_count = document.getElementById("order_list").childNodes.length

  console.log(delivery_address, order_count);
  document.getElementById("order_count").innerHTML = ` ${delivery_address} için sip. sayısı: ${order_count}`;
}

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

printBoth("Initiating program: Parser");

parserScript = exec("python3 ./python/parser.py", (error, stderr) => {
  if (error || stderr) {
    printBoth(`Error while executing the Python executable: parser.py ${error}, ${stderr}`);
  }
});

printBoth("Initiating program: Printer");

printerScript = exec("python3 ./python/printer.py", (error, stderr) => {
  if (error) {
    printBoth(`Error while executing the Python executable: printer.py ${error}, ${stderr}`);
  }
});

const parseMessages = () => {
  document.getElementById("order_list").innerHTML = "Yükleniyor..";

  const stringToSend = document.getElementById("message_text").value;
  console.log("string to send", stringToSend)
  sendToParser(stringToSend);
};

const printMessages = () => {
  let orders = document.getElementsByClassName("order")
  let delivery_address = document.getElementById("delivery_address").value

  for (order of orders) {
    let username = order.getElementsByClassName("username")[0].innerHTML;
    let messages = order.getElementsByClassName("messages")[0].value.split('\n');
    let printObject = {
        username: username,
        messages: messages,
        delivery_address: delivery_address
    }

    console.log("data being sent to printer", printObject)

    setTimeout(function(){
      sendToPrinterScript(JSON.stringify(printObject));
    }, 750);
    }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("parse_messages").addEventListener("click", parseMessages);
  document.getElementById("print_orders").addEventListener("click", printMessages);
  document.getElementById("order_count").addEventListener("selectionchange", updateCount);
});

window.onbeforeunload = () => {
  parserScript.stdin.write("terminate");
  printerScript.stdin.write("terminate");

  parserScript.stdin.end();
  printerScript.stdin.end();
}