#              M""""""""`M            dP
#              Mmmmmm   .M            88
#              MMMMP  .MMM  dP    dP  88  .dP   .d8888b.
#              MMP  .MMMMM  88    88  88888"    88'  `88
#              M' .MMMMMMM  88.  .88  88  `8b.  88.  .88
#              M         M  `88888P'  dP   `YP  `88888P'
#              MMMMMMMMMMM    -*-  Created by Zuko  -*-
#
#              * * * * * * * * * * * * * * * * * * * * *
#              * -    - -   F.R.E.E.M.I.N.D   - -    - *
#              * -  Copyright © 2025 (Z) Programing  - *
#              *    -  -  All Rights Reserved  -  -    *
#              * * * * * * * * * * * * * * * * * * * * *

#
import sys
import json
import struct
import subprocess
from logger import logging

def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        return None
    message_length = struct.unpack('=I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length)
    return json.loads(message)

def send_message(message):
    encoded_message = json.dumps(message).encode('utf-8')
    encoded_length = struct.pack('=I', len(encoded_message))
    sys.stdout.buffer.write(encoded_length)
    sys.stdout.buffer.write(encoded_message)
    sys.stdout.buffer.flush()

def main():
    logging.info("Native host started")
    
    while True:
        message = get_message()
        if message is None:
            break
            
        logging.info(f"Received message: {message}")
        
        if 'url' in message:
            try:
                cmd = ['python', 'parser.py', message['url']]
                result = subprocess.run(cmd, capture_output=True, text=True)
                logging.info(f"Command output: {result.stdout}")
                if result.stderr:
                    logging.error(f"Command error: {result.stderr}")
                send_message({"status": "success"})
            except Exception as e:
                logging.error(f"Error: {str(e)}")
                send_message({"status": "error", "message": str(e)})

if __name__ == '__main__':
    main() 
