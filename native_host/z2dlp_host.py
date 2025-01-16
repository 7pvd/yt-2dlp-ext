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
#
#
#
import sys
import json
import struct
import os
from pathlib import Path
import subprocess

from logger import logging

class ParamsParser:
    """Parser for converting download parameters to yt-dlp arguments."""
    
    @staticmethod
    def parse_params(params):
        """Convert parameters to yt-dlp command arguments."""
        args = []
        for param in params:
            if not isinstance(param, dict):
                continue
                
            param_type = param.get('type')
            value = param.get('value')
            
            if param_type == 'url':
                args.append(value)
            elif param_type == 'format':
                args.extend(['-f', value])
            elif param_type == 'output':
                args.extend(['-o', value])
            # Add other parameter types as needed
                
        return args

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

def handle_browse_directory():
    """Show directory picker dialog and return selected path."""
    try:
        cmd = ['powershell.exe', '-Command',
               "Add-Type -AssemblyName System.Windows.Forms; " +
               "$f = New-Object System.Windows.Forms.FolderBrowserDialog; " +
               "$f.ShowDialog(); $f.SelectedPath"]
        logging.info(f"Executing command: {cmd}")
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode == 0 and result.stdout.strip():
            # Clean up PowerShell output by removing 'OK' line and empty lines
            selected_path = result.stdout.strip().split('\n')[-1].strip()
            if selected_path:
                return {
                    'status': 'ok',
                    'path': selected_path
                }
            
        return {
            'status': 'cancelled',
            'message': 'No directory selected'
        }
            
    except Exception as e:
        logging.error(f"Error showing directory picker: {str(e)}")
        return {
            'status': 'error',
            'message': str(e)
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
            elif action == 'browse_directory':
                response = handle_browse_directory()
            elif action == 'download':
                response = handle_download(message)
            else:
                response = {'status': 'error', 'message': f'Unknown action: {action}'}
            
            logging.debug(f"Sending response: {response}")
            send_message(response)
            
        except Exception as e:
            logging.error(f"Error processing message: {str(e)}")
            error_response = {'status': 'error', 'message': str(e)}
            send_message(error_response)

if __name__ == '__main__':
    main() 
