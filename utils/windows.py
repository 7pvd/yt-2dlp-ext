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

import os
from dataclasses import dataclass
from typing import Optional

from rich.prompt import Confirm, Prompt


def replace_path_in_reg_file():
    # Define file paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.join(script_dir, '..')
    project_dir = os.path.abspath(project_dir)
    host_dir = os.path.join(project_dir, "native_host")
    reg_file = os.path.join(host_dir, "native_messaging.reg")
    temp_reg_file = os.path.join(host_dir, "native_messaging_temp.reg")
    
    # Hardcoded path to be replaced
    hardcoded_path = r"D:\\Z-Data\\git\\qt-apps\\yt-2dlp-ext"
    replacement_path = project_dir
    
    # Normalize the replacement path for .reg files
    replacement_path = replacement_path.replace("\\", "\\\\")  # Escape backslashes
    
    # Read, replace, and write
    try:
        print("Replacing paths in registry file...")
        with open(reg_file, "r", encoding="utf-8") as infile, open(temp_reg_file, "w", encoding="utf-8") as outfile:
            for line in infile:
                updated_line = line.replace(hardcoded_path, replacement_path)
                outfile.write(updated_line)
        print(f"Registry file updated successfully: {temp_reg_file}")
        return True
    except Exception as e:
        print(f"Error: {e}")


@dataclass
class CommandConfig:
    interactive: bool = True
    force: bool = False


config = CommandConfig()


def ask_if_missing(value: Optional[str], prompt: str, default: Optional[str] = None) -> str:
    """
    Ask the user if the value is missing and interactive mode is enabled
    """
    if value is None and config.interactive:
        return Prompt.ask(prompt, default=default)
    return value or default


def confirm_if_exists(path: str) -> bool:
    """
    Check and ask the user if the file exists
    """
    if os.path.exists(path) and config.interactive and not config.force:
        return Confirm.ask(f"File {path} already exists. Overwrite?")
    return True


def main():
    if Confirm.ask(f"Replace paths in registry file?"):
        replace_path_in_reg_file()
    pass


if __name__ == '__main__':
    import typer
    
    typer.run(main)
