/**
 * Strapi Exporter Plugin for Tyme
 * Exports selected projects with their tasks to JSON and sends to a Strapi CMS.
 */

const SCHEDULE_FILE = 'schedule.json';

class StrapiExporter {
    constructor() {
        this.strapiUrl = formValue.strapiUrl;
        this.apiKey = formValue.apiKey;
        this.collectionName = formValue.collectionName || 'tyme-exports';
        this.headers = {
            'Authorization': 'Bearer ' + this.apiKey,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Get the API endpoint URL for the collection
     * @returns {string} The full API URL
     */
    getApiUrl() {
        let baseUrl = this.strapiUrl.trim();
        // Remove trailing slash if present
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }
        return baseUrl + '/api/' + this.collectionName;
    }

    /**
     * Toggle schedule options visibility based on enable checkbox
     */
    toggleScheduleOptions() {
        const enabled = formValue.enableSchedule;
        if (formElement.scheduleType) {
            formElement.scheduleType.isHidden = !enabled;
        }
        if (formElement.intervalDays) {
            formElement.intervalDays.isHidden = !enabled;
        }
        if (formElement.startDate) {
            formElement.startDate.isHidden = !enabled;
        }
        if (formElement.scheduleHint) {
            formElement.scheduleHint.isHidden = !enabled;
        }
        this.updateScheduleUI();
    }

    /**
     * Update schedule UI based on selected schedule type
     */
    updateScheduleUI() {
        if (!formValue.enableSchedule) {
            return;
        }
        
        const scheduleType = formValue.scheduleType;
        
        if (formElement.intervalDays) {
            formElement.intervalDays.isHidden = scheduleType !== 'everyNDays';
        }
        if (formElement.startDate) {
            formElement.startDate.isHidden = scheduleType === 'lastOfMonth';
        }
    }

    /**
     * Test the connection to Strapi
     */
    testConnection() {
        if (!this.validateConfig()) {
            return;
        }

        const url = this.getApiUrl();
        const response = utils.request(url, 'GET', this.headers, null);
        const statusCode = response['statusCode'];

        if (statusCode === 200) {
            tyme.showAlert(
                utils.localize('test.success.title'),
                utils.localize('test.success.message')
            );
        } else if (statusCode === 401 || statusCode === 403) {
            tyme.showAlert(
                utils.localize('test.error.title'),
                utils.localize('export.error.permission')
            );
        } else if (statusCode === 404) {
            tyme.showAlert(
                utils.localize('test.error.title'),
                utils.localize('export.error.collection')
            );
        } else {
            tyme.showAlert(
                utils.localize('test.error.title'),
                utils.localize('test.error.message')
            );
        }
    }

    /**
     * Validate plugin configuration
     * @returns {boolean} True if config is valid
     */
    validateConfig() {
        if (!this.strapiUrl || this.strapiUrl.trim() === '') {
            tyme.showAlert(
                utils.localize('export.error.title'),
                utils.localize('export.error.connection')
            );
            return false;
        }
        if (!this.apiKey || this.apiKey.trim() === '') {
            tyme.showAlert(
                utils.localize('export.error.title'),
                utils.localize('export.error.connection')
            );
            return false;
        }
        return true;
    }

    /**
     * Get time entries based on form values
     * @returns {Array} Array of time entries
     */
    getTimeEntries() {
        return tyme.timeEntries(
            formValue.dateRange[0],
            formValue.dateRange[1],
            formValue.taskIDs,
            null,
            formValue.onlyUnbilled ? 0 : null,
            formValue.includeNonBillable ? null : true,
            formValue.teamMemberID
        );
    }

    /**
     * Transform time entries into flat export format (one row per time entry)
     * Each row contains the time entry data with embedded project information
     * @param {Array} timeEntries - Raw time entries from Tyme
     * @returns {Array} Array of flattened time entry objects
     */
    transformData(timeEntries) {
        const flatEntries = timeEntries.map((entry) => {
            const flatEntry = {
                // Time entry identification
                id: entry.id,
                
                // Project information (flattened)
                project_id: entry.project_id,
                project_name: entry.project,
                category: entry.category || '',
                category_id: entry.category_id || '',
                
                // Task information
                task_id: entry.task_id,
                task_name: entry.task,
                subtask: entry.subtask || '',
                subtask_id: entry.subtask_id || '',
                
                // Time entry details
                start: entry.start,
                end: entry.end,
                duration: parseFloat(entry.duration),
                duration_unit: entry.duration_unit,
                
                // Billing information
                billing: entry.billing,
                rate: parseFloat(entry.rate),
                rate_unit: entry.rate_unit,
                sum: parseFloat(entry.sum),
                sum_unit: entry.sum_unit,
                
                // Entry type and user
                type: entry.type,
                user: entry.user || '',
                user_id: entry.user_id || ''
            };
            
            // Include notes if enabled
            if (formValue.includeNotes && entry.note) {
                flatEntry.note = entry.note;
            }
            
            return flatEntry;
        });
        
        return flatEntries;
    }

    /**
     * Generate preview HTML
     * @returns {string} HTML preview
     */
    generatePreview() {
        const timeEntries = this.getTimeEntries();
        
        if (timeEntries.length === 0) {
            return utils.markdownToHTML('## ' + utils.localize('export.error.empty'));
        }
        
        const data = this.transformData(timeEntries);
        let str = '';
        
        str += '## ' + utils.localize('export.preview.header') + '\n\n';
        str += '|' + utils.localize('export.preview.project');
        str += '|' + utils.localize('export.preview.task');
        str += '|' + utils.localize('export.preview.duration');
        str += '|\n';
        str += '|-|-|-:|\n';
        
        let totalDuration = 0;
        
        // Group entries by project and task for preview display
        const projectTaskMap = {};
        data.forEach((entry) => {
            const key = entry.project_id + '_' + entry.task_id;
            if (!projectTaskMap[key]) {
                projectTaskMap[key] = {
                    projectName: entry.project_name,
                    taskName: entry.task_name,
                    subtask: entry.subtask,
                    totalDuration: 0
                };
            }
            projectTaskMap[key].totalDuration += entry.duration;
        });
        
        // Count unique projects
        const uniqueProjects = new Set(data.map((entry) => entry.project_id));
        
        Object.values(projectTaskMap).forEach((item) => {
            const durationHours = (item.totalDuration / 60).toFixed(2);
            totalDuration += item.totalDuration;
            
            str += '|**' + item.projectName + '**';
            str += '|' + item.taskName;
            if (item.subtask) {
                str += ': ' + item.subtask;
            }
            str += '|' + durationHours + ' ' + utils.localize('unit.hours');
            str += '|\n';
        });
        
        const totalHours = (totalDuration / 60).toFixed(2);
        str += '|||**' + utils.localize('export.preview.total') + ': ' + totalHours + ' ' + utils.localize('unit.hours') + '**|\n';
        
        str += '\n---\n\n';
        str += '**' + uniqueProjects.size + '** ' + utils.localize('export.preview.project') + '(s)\n\n';
        str += '**' + data.length + '** ' + utils.localize('export.preview.task') + ' entries\n';
        
        return utils.markdownToHTML(str);
    }

    /**
     * Export data to Strapi
     * Posts each time entry as a separate row to the Strapi collection
     */
    exportData() {
        if (!this.validateConfig()) {
            return;
        }
        
        const timeEntries = this.getTimeEntries();
        
        if (timeEntries.length === 0) {
            tyme.showAlert(
                utils.localize('export.error.title'),
                utils.localize('export.error.empty')
            );
            return;
        }
        
        const exportData = this.transformData(timeEntries);
        const url = this.getApiUrl();
        
        let successCount = 0;
        let failCount = 0;
        let lastError = '';
        
        // Post each time entry as a separate row
        for (let i = 0; i < exportData.length; i++) {
            const entry = exportData[i];
            const payload = {
                data: entry
            };
            
            const response = utils.request(url, 'POST', this.headers, payload);
            const statusCode = response['statusCode'];
            
            if (statusCode === 200 || statusCode === 201) {
                successCount++;
            } else {
                failCount++;
                if (statusCode === 401 || statusCode === 403) {
                    lastError = utils.localize('export.error.permission');
                } else if (statusCode === 404) {
                    lastError = utils.localize('export.error.collection');
                } else {
                    lastError = utils.localize('export.error.connection') + ' (Status: ' + statusCode + ')';
                }
            }
        }
        
        // Show result
        if (failCount === 0) {
            // Save schedule if enabled
            if (formValue.enableSchedule) {
                this.saveSchedule();
            }
            
            const message = utils.localize('export.success.message').replace('{count}', successCount.toString());
            tyme.showAlert(
                utils.localize('export.success.title'),
                message
            );
        } else if (successCount > 0) {
            // Partial success
            tyme.showAlert(
                utils.localize('export.error.title'),
                successCount + ' entries exported, ' + failCount + ' failed.\n\n' + lastError
            );
        } else {
            // All failed
            tyme.showAlert(
                utils.localize('export.error.title'),
                lastError
            );
        }
    }

    /**
     * Calculate next scheduled export date
     * @returns {Date} Next export date
     */
    calculateNextExportDate() {
        const scheduleType = formValue.scheduleType;
        const now = new Date();
        let nextDate;
        
        switch (scheduleType) {
            case 'lastOfMonth':
                // Get last day of current month
                nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                // If today is past the last day, get last day of next month
                if (now > nextDate) {
                    nextDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                }
                break;
                
            case 'everyNDays':
                const intervalDays = parseInt(formValue.intervalDays, 10) || 30;
                const startDate = formValue.startDate ? new Date(formValue.startDate) : now;
                
                if (startDate > now) {
                    nextDate = startDate;
                } else {
                    // Calculate days since start
                    const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
                    // Ensure at least 1 day to prevent immediate re-execution
                    const daysTillNext = intervalDays - (daysSinceStart % intervalDays) || intervalDays;
                    nextDate = new Date(now);
                    nextDate.setDate(nextDate.getDate() + daysTillNext);
                }
                break;
                
            case 'specificDate':
                nextDate = formValue.startDate ? new Date(formValue.startDate) : now;
                const interval = parseInt(formValue.intervalDays, 10) || 30;
                
                while (nextDate <= now) {
                    nextDate.setDate(nextDate.getDate() + interval);
                }
                break;
                
            default:
                nextDate = now;
        }
        
        return nextDate;
    }

    /**
     * Save schedule configuration
     */
    saveSchedule() {
        const scheduleConfig = {
            enabled: formValue.enableSchedule,
            type: formValue.scheduleType,
            intervalDays: parseInt(formValue.intervalDays, 10) || 30,
            startDate: formValue.startDate ? formValue.startDate.toISOString() : null,
            nextExport: this.calculateNextExportDate().toISOString(),
            lastExport: new Date().toISOString(),
            strapiUrl: formValue.strapiUrl,
            collectionName: formValue.collectionName
        };
        
        utils.writeToFile(SCHEDULE_FILE, JSON.stringify(scheduleConfig, null, 2));
        
        tyme.showAlert(
            utils.localize('schedule.saved.title'),
            utils.localize('schedule.saved.message') + '\n\nNext export: ' + this.calculateNextExportDate().toLocaleDateString()
        );
    }

    /**
     * Load saved schedule configuration
     * @returns {Object|null} Schedule config or null
     */
    loadSchedule() {
        if (!utils.fileExists(SCHEDULE_FILE)) {
            return null;
        }
        
        try {
            const content = utils.contentsOfFile(SCHEDULE_FILE);
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    }

    /**
     * Check if a scheduled export is due
     * @returns {boolean} True if export is due
     */
    isExportDue() {
        const schedule = this.loadSchedule();
        
        if (!schedule || !schedule.enabled) {
            return false;
        }
        
        const nextExport = new Date(schedule.nextExport);
        const now = new Date();
        
        return now >= nextExport;
    }
}

// Initialize the exporter
const strapiExporter = new StrapiExporter();

// Check and update schedule UI on load
if (typeof formElement !== 'undefined') {
    strapiExporter.toggleScheduleOptions();
}
