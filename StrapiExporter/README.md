# Strapi Exporter

This plugin lets you export your selected projects with their tasks to JSON and send them to a [Strapi CMS](https://strapi.io).

## Features

- **Export to Strapi CMS**: Send your time tracking data directly to any Strapi instance
- **Configurable Connection**: Set your Strapi URL, API token, and collection name
- **Flexible Data Selection**: Choose specific projects, tasks, date ranges, and team members
- **Schedule Exports**: Configure recurring exports with multiple scheduling options:
  - Last day of the month
  - Every N days (e.g., every 30 days)
  - Starting from a specific date with recurring interval
- **Preview Before Export**: View a summary of data before sending to Strapi
- **Test Connection**: Verify your Strapi connection before exporting

## Setup

### In Strapi

1. Create a collection type in your Strapi instance to store the export data (default name: `tyme-exports`)
2. The collection should accept a JSON/text field for the export data
3. Generate an API Token in Settings > API Tokens
4. Make sure the token has write permissions for the collection

### In Tyme

1. Enter your Strapi instance URL (e.g., `https://your-strapi.com`)
2. Enter your API Token
3. Specify the collection name (default: `tyme-exports`)
4. Select the date range, projects, and tasks to export
5. Optionally enable and configure the export schedule
6. Click "Test Connection" to verify your setup
7. Export your data!

## Exported Data Structure

The plugin exports data in the following JSON structure:

```json
{
  "exportDate": "2025-01-15T10:30:00.000Z",
  "dateRange": {
    "start": "2025-01-01T00:00:00.000Z",
    "end": "2025-01-15T23:59:59.000Z"
  },
  "currency": "EUR",
  "projects": [
    {
      "id": "project_id",
      "name": "Project Name",
      "category": "Category Name",
      "tasks": [
        {
          "id": "task_id",
          "name": "Task Name",
          "entries": [...],
          "totalDuration": 120,
          "totalSum": 200.00
        }
      ],
      "totalDuration": 480,
      "totalSum": 800.00
    }
  ],
  "summary": {
    "projectCount": 2,
    "totalDuration": 960,
    "totalSum": 1600.00
  }
}
```

## Schedule Options

- **Last day of month**: Automatically set the next export for the last day of each month
- **Every N days**: Set a recurring interval (e.g., every 30 days)
- **Starting from date**: Start from a specific date with a recurring interval

Note: Automatic scheduling requires Tyme to be running at the scheduled time.

## Requirements

- Tyme 2025.12 or later
- A Strapi CMS instance with API access
- An API Token with write permissions for the target collection
