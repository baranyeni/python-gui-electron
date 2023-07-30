import sys, json, time, atexit
from escpos.printer import Usb
from unidecode import unidecode


printer_object = False


def print_info(info):
    print('Python    : "' + info + '"', flush=True)


def set_printer():
    global printer_object
    while not printer_object:
        try:
            printer_object = Usb(0x0fe6, 0x811e, 0)
            if printer_object:
                print_info("Printer mounted succesfully!")
        except Exception as e:
            print_info(str(e))
        finally:
            time.sleep(3)

    return printer_object


def print_header(printer_object, text):
    printer_object.set(bold=True, font=0, custom_size=True, smooth=True, height=2, width=2, align="center")
    printer_object.textln("\n| %s |\n\n" %text)


def print_messages(printer_object, text):
    printer_object.set(font=0, smooth=True, double_height=True, double_width=True)
    text = text.strip()
    if len(text) > 2:
        printer_object.textln(text)


def print_username(printer_object, text):
    printer_object.set(font=0, smooth=True, align="right")
    printer_object.textln("\n %s" %text)


def cleanup():
    global printer_object
    print_info("Closing..")
    printer_object.close()


atexit.register(cleanup)
print_info("Printer script started")
raw_data = ""
set_printer()

while True:
    line = sys.stdin.readline().strip()

    if line != "@@END@@" and line != "terminate":
        raw_data += line
    else:
        if raw_data == "terminate":
            print_info('I got a terminate request from electron (js)...terminating')
            exit(0)
        else:
            try:
                data = json.loads(raw_data)
                print_info(raw_data)

                if printer_object:
                    print_header(printer_object, data['delivery_address'])
                    for index, message in enumerate(data['messages'], 1):
                        print_messages(printer_object, ("%s) %s" %(index, unidecode(message.upper()))))
                    print_username(printer_object, data['username'])
                    printer_object.cut()

            except Exception as e:
                print_info('Error: ' + str(e))
            finally:
                raw_data = ""
