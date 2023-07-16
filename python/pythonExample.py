import sys
from whatstk import WhatsAppChat
from escpos.printer import Usb
from unidecode import unidecode


def print_info(str):
    print('Python    : "' + str + '"', flush=True)  # Add flush=True here

def set_printer():
    printer = Usb(0x0fe6, 0x811e, 0)
    printer.set(bold=True, double_height=2, double_width=2)

    return printer

def parse_whatsapp_chat():
    chat    = WhatsAppChat.from_source(filepath="chat.txt", hformat='[%H:%M, %d/%m/%y] %name:')
    columns = set(chat.df.columns.tolist()) - set(['Id'])
    chat_grouped = chat.df.groupby('username')
    DELIVERY_ADDRESS = "  MIGROS\n\n"

    output = {}
    for key, grouped in chat_grouped:
        output[key] = grouped["message"].tolist()

    formatted = {}
    for username in output:
        formatted[username] = {
            'DELIVERY_ADDRESS': DELIVERY_ADDRESS,
            "messages": []
        }
        # printer.textln(DELIVERY_ADDRESS)
        for index, message in enumerate(output[username], 1):
            # print(index, "-", unidecode(message.upper()))
            # printer.textln("%s-%s" %(index, unidecode(message.upper())))
            formatted[username]["messages"].append("%s-%s" %(index, unidecode(message.upper())))

    return formatted

while True:
    line = sys.stdin.readline().strip()
    print_info("kmlkmlkmlk")

    if line == "terminate":
        print_info('I got a terminate request from electron (js)...terminating')
        exit(0)
    else:
        print_info('I got string: "' + line + '", from electron (js)')
        formatted = parse_whatsapp_chat(line)
        print_info('I parsed chat: "' + formatted + '", from electron (js)')
