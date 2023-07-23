import sys
import json
from escpos.printer import Usb
from unidecode import unidecode


def print_info(str):
    print('Python    : "' + str + '"', flush=True)

def set_printer():
    try:
        printer = Usb(0x0fe6, 0x811e, 0)
        printer.set(bold=True, double_height=2, double_width=2)
    except Exception as e:
        print_info("ERROR: " + str(e))
        sys.exit(1)

    return printer

print_info("Printer script started")
raw_data = ""
while True:
    line = sys.stdin.readline().strip()

    if line != "@@END@@":
        raw_data += line
    else:
        if raw_data == "terminate":
            print_info('I got a terminate request from electron (js)...terminating')
            exit(0)
        else:
            try:
                printer = set_printer()
                data = json.loads(raw_data)

                printer.textln(data['delivery_address'])
                for index, message in enumerate(data['messages'], 1):
                    printer.textln("%s-%s" %(index, unidecode(message.upper())))
                printer.cut()

            except Exception as e:
                print_info('Error: ' + str(e))
        raw_data = ""
        exit(0)
