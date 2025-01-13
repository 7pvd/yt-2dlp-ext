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
import sys
import urllib.parse
import subprocess
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../ytdlp_parser.log'),
        logging.StreamHandler()
    ]
)

def parse_url_to_args(url):
    logging.info(f"Received URL: {url}")
    
    # Remove the scheme part
    url = url.replace('ext+ytdlp://', '')
    logging.debug(f"URL after removing scheme: {url}")
    
    # Parse the query string
    parsed = urllib.parse.urlparse(url)
    params = urllib.parse.parse_qs(parsed.query)
    logging.debug(f"Parsed parameters: {params}")
    
    # Convert params to command line arguments
    args = []
    for key, values in params.items():
        if key == 'url':
            args.extend(values)
            logging.debug(f"Added argument: {values}")
            continue
        for value in values:
            args.extend([f'--{key}', value])
            logging.debug(f"Added argument: --{key} {value}")
    
    logging.info(f"Final arguments: {args}")
    return args

def main():
    logging.info("Parser started")
    logging.info(f"Command line arguments: {sys.argv}")
    
    if len(sys.argv) < 2:
        logging.error("No URL provided")
        sys.exit(1)
    
    url = sys.argv[1]
    args = parse_url_to_args(url)
    logging.info(args)

    
    # Construct the command
    cmd = ['yt-dlp'] + args
    logging.info(f"Executing command: {cmd}")
    
    try:
        # Execute the command
        result = subprocess.run(cmd, capture_output=True, text=True)
        logging.info(f"Command output: {result.stdout}")
        if result.stderr:
            logging.error(f"Command errors: {result.stderr}")
    except Exception as e:
        logging.error(f"Error executing command: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
