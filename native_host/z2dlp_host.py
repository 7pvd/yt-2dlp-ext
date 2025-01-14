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
import os
from pathlib import Path

import subprocess
from logger import logging


def get_message():
    """Read a message from stdin and decode it."""
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        return None
    message_length = struct.unpack('=I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length)
    return json.loads(message.decode('utf-8'))

def encode_message(message_content):
    """Encode a message for transmission, given its content."""
    encoded_content = json.dumps(message_content).encode('utf-8')
    encoded_length = struct.pack('=I', len(encoded_content))
    return {'length': encoded_length, 'content': encoded_content}

def send_message(encoded_message):
    """Send an encoded message to stdout."""
    sys.stdout.buffer.write(encoded_message['length'])
    sys.stdout.buffer.write(encoded_message['content'])
    sys.stdout.buffer.flush()

def handle_ping():
    """Handle ping request to test connection."""
    return {'status': 'ok', 'message': 'Native host is running'}

def handle_resolve_path(data):
    """Resolve relative path to absolute path."""
    try:
        path = data.get('path')
        if not path:
            return {'status': 'error', 'message': 'No path provided'}
        
        # Try different methods to resolve the path
        abs_path = None
        
        # Method 1: Direct absolute path resolution
        test_path = os.path.abspath(path)
        if os.path.exists(test_path):
            abs_path = test_path
        
        # Method 2: Try from current working directory
        if not abs_path:
            test_path = os.path.abspath(os.path.join(os.getcwd(), path))
            if os.path.exists(test_path):
                abs_path = test_path
        
        # Method 3: Try from user's home directory
        if not abs_path:
            test_path = os.path.expanduser(os.path.join('~', path))
            if os.path.exists(test_path):
                abs_path = test_path
        
        if abs_path:
            return {
                'status': 'ok',
                'path': path,
                'fullPath': abs_path
            }
        else:
            return {
                'status': 'error',
                'message': f'Could not resolve path: {path}',
                'path': path
            }
            
    except Exception as e:
        logging.error(f"Error resolving path: {str(e)}")
        return {
            'status': 'error',
            'message': str(e),
            'path': path if 'path' in locals() else None
        }

def main():
    logging.info("Native host started")
    
    while True:
        try:
            message = get_message()
            if message is None:
                logging.info("No more messages, exiting")
                break
                
            logging.debug(f"Received message: {message}")
            
            action = message.get('action')
            if not action:
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
                else:
                    response = {'status': 'error', 'message': 'No action specified'}
            elif action == 'ping':
                response = handle_ping()
            elif action == 'resolve_path':
                response = handle_resolve_path(message)
            else:
                response = {'status': 'error', 'message': f'Unknown action: {action}'}
            
            logging.debug(f"Sending response: {response}")
            send_message(encode_message(response))
            
        except Exception as e:
            logging.error(f"Error processing message: {str(e)}")
            error_response = {'status': 'error', 'message': str(e)}
            send_message(encode_message(error_response))

if __name__ == '__main__':
    main() 
