import os, sys, atexit
from whatstk import WhatsAppChat
import tempfile
import json
from escpos.printer import Usb
from unidecode import unidecode

def print_info(str):
    print('Python    : "' + str + '"', flush=True)  # Add flush=True here

def set_printer():
    printer = Usb(0x0fe6, 0x811e, 0)
    printer.set(bold=True, double_height=2, double_width=2)

    return printer

def parse_whatsapp_chat(text):
    chat_file = tempfile.NamedTemporaryFile(mode="wt", delete=False)
    chat_file.write(text)
    chat_file.close()

    try:
        chat = WhatsAppChat.from_source(filepath=chat_file.name, hformat='[%H:%M, %d/%m/%y] %name:')
        columns = set(chat.df.columns.tolist()) - set(['Id'])
        chat_grouped = chat.df.groupby('username')
    except Exception as e:
        print_info("Error: " + str(e))
        return None

    DELIVERY_ADDRESS = "  MIGROS\n\n"

    output = {}
    for key, grouped in chat_grouped:
        output[key] = grouped["message"].tolist()

    formatted = {}
    for username in output.keys():
        formatted[username] = {
            'delivery_address': DELIVERY_ADDRESS,
            "messages": []
        }
        for i, message in enumerate(output[username], 1):
            formatted[username]['messages'].append("%s   " %(unidecode(message.upper())))

    chat_file.close()
    os.unlink(chat_file.name)
    return json.dumps(formatted)


def cleanup():
    global printer_object
    print_info("Closing..")
    printer_object.close()


atexit.register(cleanup)
print_info("Script started")
raw_data = ""
while True:
    line = sys.stdin.readline().strip()

    if line != "@@END@@" and line != "terminate":
        raw_data += line
    else:
        if line == "terminate":
            print_info('I got a terminate request from electron (js)...terminating')
            exit(0)
        else:
            try:
                formatted_messages = parse_whatsapp_chat(raw_data)
                print(formatted_messages, flush=True)
            except Exception as e:
                print_info('Error: ' + str(e))
            finally:
                raw_data = ""
