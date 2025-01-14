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
from typing import List, Dict, Any
from logger import logging

class ParamsParser:
    """Parser for handling download parameters"""
    
    PARAM_TYPES = {
        'argument': 'argument',
        'option': 'option'
    }
    
    @staticmethod
    def parse_params(params: List[Dict[str, Any]]) -> List[str]:
        """Convert params array to command line arguments"""
        args = []
        
        for param in params:
            param_type = param.get('type')
            value = param.get('value', '')
            
            if not value:  # Skip empty values
                continue
                
            if param_type == ParamsParser.PARAM_TYPES['argument']:
                args.append(value)
                logging.debug(f"Added argument: {value}")
                
            elif param_type == ParamsParser.PARAM_TYPES['option']:
                name = param.get('name', '')
                if not name:  # Skip options without names
                    continue
                    
                prefix = '-' if param.get('isShortOption', True) else '--'
                option = f"{prefix}{name}"
                
                args.append(option)
                if value:  # Add value only if not empty
                    args.append(value)
                    
                logging.debug(f"Added option: {option} {value}")
                
        logging.info(f"Final arguments: {args}")
        return args
