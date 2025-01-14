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
from parser import ParamsParser

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
    if isinstance(encoded_message, dict) and 'length' in encoded_message and 'content' in encoded_message:
        # Already encoded message
        sys.stdout.buffer.write(encoded_message['length'])
        sys.stdout.buffer.write(encoded_message['content'])
    else:
        # Raw message that needs encoding
        encoded = encode_message(encoded_message)
        sys.stdout.buffer.write(encoded['length'])
        sys.stdout.buffer.write(encoded['content'])
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

def handle_download(data):
    """Handle download request with params."""
    try:
        params = data.get('params', [])
        if not params:
            return {'status': 'error', 'message': 'No params provided'}
            
        # Convert params to command args
        args = ParamsParser.parse_params(params)
        if not args:
            return {'status': 'error', 'message': 'Failed to parse params'}
            
        # Execute yt-dlp command
        cmd = ['yt-dlp'] + args
        logging.info(f"Executing command: {cmd}")
        
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        
        response = {
            'status': 'ok' if result.returncode == 0 else 'error',
            'stdout': result.stdout,
            'stderr': result.stderr,
            'code': result.returncode
        }
        
        if result.stderr:
            logging.error(f"Command errors: {result.stderr}")
        else:
            logging.info(f"Command output: {result.stdout}")
            
        return response
        
    except Exception as e:
        logging.error(f"Error handling download: {str(e)}")
        return {
            'status': 'error',
            'message': str(e),
            'code': -1
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
            
            # Handle message based on action
            action = message.get('action')
            if action == 'ping':
                response = handle_ping()
            elif action == 'resolve_path':
                response = handle_resolve_path(message)
            elif action == 'download':
                response = handle_download(message)
            else:
                response = {'status': 'error', 'message': f'Unknown action: {action}'}
            
            logging.debug(f"Sending response: {response}")
            send_message(response)  # Send raw response, let send_message handle encoding
            
        except Exception as e:
            logging.error(f"Error processing message: {str(e)}")
            error_response = {'status': 'error', 'message': str(e)}
            send_message(error_response)  # Send raw error response

if __name__ == '__main__':
    main() 
