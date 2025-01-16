/*
 *             M""""""""`M            dP
 *             Mmmmmm   .M            88
 *             MMMMP  .MMM  dP    dP  88  .dP   .d8888b.
 *             MMP  .MMMMM  88    88  88888"    88'  `88
 *             M' .MMMMMMM  88.  .88  88  `8b.  88.  .88
 *             M         M  `88888P'  dP   `YP  `88888P'
 *             MMMMMMMMMMM    -*-  Created by Zuko  -*-
 *
 *             * * * * * * * * * * * * * * * * * * * * *
 *             * -    - -   F.R.E.E.M.I.N.D   - -    - *
 *             * -  Copyright © 2025 (Z) Programing  - *
 *             *    -  -  All Rights Reserved  -  -    *
 *             * * * * * * * * * * * * * * * * * * * * *
 */

class ParamsManager {
    static PARAM_TYPES = {
        ARGUMENT: 'argument',
        OPTION: 'option'
    };
    static REQUIRED_PARAMS = ['f', 'P', 'N', 'o'];
    static OMIT_WHEN_EMPTY = ['o'];

    static getPresetOptions(preset, options = {}) {
        const presetParams = [];
        
        // Basic preset params
        if (preset && preset.params) {
            preset.params.forEach(param => {
                if (!param.startsWith('-')) return;
                const isShort = !param.startsWith('--');
                const name = param.replace(/^-+/, '');
                presetParams.push({ name, isShort });
            });
        }

        // Additional options based on config
        if (options.embedThumbnail) {
            presetParams.push({ name: 'embed-thumbnail', isShort: false });
        }
        if (options.writeAllThumbnails) {
            presetParams.push({ name: 'write-all-thumbnails', isShort: false });
        }
        if (options.addMetadata) {
            presetParams.push({ name: 'add-metadata', isShort: false });
        }

        // Filter out params that should be omitted when empty
        return presetParams.filter(param => {
            if (ParamsManager.OMIT_WHEN_EMPTY.includes(param.name)) {
                return options[param.name] !== undefined && options[param.name] !== '';
            }
            return true;
        });
    }

    constructor() {
        this.params = [];
    }

    addArgument(value) {
        this.params.push({
            name: '',
            value: value,
            type: ParamsManager.PARAM_TYPES.ARGUMENT
        });
        return this;
    }

    addOption(name, value, isShort = true, hint = '') {
        this.params.push({
            name: name,
            value: value,
            type: ParamsManager.PARAM_TYPES.OPTION,
            isShortOption: isShort,
            ...(hint && { hint })
        });
        return this;
    }

    fromPreset(preset, options = {}) {
        if (!preset) return this;

        // Get all valid options for this preset
        const presetOptions = ParamsManager.getPresetOptions(preset, options);

        // Add non-option parameters (arguments)
        if (preset.params) {
            preset.params.forEach(param => {
                if (!param.startsWith('-')) {
                    this.addArgument(param);
                }
            });
        }

        // Add all options
        presetOptions.forEach(opt => {
            this.addOption(opt.name, '', opt.isShort);
        });

        return this;
    }

    fromConfig(config) {
        // Handle speed limit
        if (config.speedLimit) {
            const speedValue = `${config.speedLimit}${config.speedUnit || 'M'}`;
            this.addOption('r', speedValue, true, 'speed limit');
        }

        // Handle connections
        if (config.connections) {
            this.addOption('N', config.connections.toString(), true, 'max connections');
        }

        // Handle output pattern
        if (config.outputPattern) {
            this.addOption('o', config.outputPattern, true, 'output template');
        }

        // Handle output directory
        if (config.outputDir) {
            this.addOption('P', config.outputDir, true, 'output path');
        }

        // Handle additional parameters
        if (Array.isArray(config.additionalParams)) {
            config.additionalParams.forEach(param => {
                if (param.key) {
                    this.addOption(param.key, param.value || '', true);
                }
            });
        }

        return this;
    }

    toArray() {
        return this.params;
    }

    toCommandArgs() {
        return this.params.map(param => {
            if (param.type === ParamsManager.PARAM_TYPES.ARGUMENT) {
                return param.value;
            }
            
            const prefix = param.isShortOption ? '-' : '--';
            const option = `${prefix}${param.name}`;
            return param.value ? [option, param.value] : [option];
        }).flat();
    }

    static fromJson(jsonStr) {
        const manager = new ParamsManager();
        try {
            const params = JSON.parse(jsonStr);
            if (Array.isArray(params)) {
                manager.params = params;
            }
        } catch (e) {
            console.error('Failed to parse params JSON:', e);
        }
        return manager;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParamsManager;
} else {
    window.ParamsManager = ParamsManager;
} 
