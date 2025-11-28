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

1. Create a collection type in your Strapi instance to store the time entries (default name: `tyme-exports`)
2. The collection should have fields matching the exported data structure (see below)
3. Each time entry will be stored as a separate row in the collection
4. Generate an API Token in Settings > API Tokens
5. Make sure the token has write permissions for the collection

### In Tyme

1. Enter your Strapi instance URL (e.g., `https://your-strapi.com`)
2. Enter your API Token
3. Specify the collection name (default: `tyme-exports`)
4. Select the date range, projects, and tasks to export
5. Optionally enable and configure the export schedule
6. Click "Test Connection" to verify your setup
7. Export your data!

## Exported Data Structure

The plugin exports each time entry as a separate row in your Strapi collection. Each entry contains the time entry data along with embedded project and task information:

```json
{
  "id": "entry_id",
  "project_id": "project_id",
  "project_name": "Project Name",
  "category": "Category Name",
  "category_id": "category_id",
  "task_id": "task_id",
  "task_name": "Task Name",
  "subtask": "Subtask Name",
  "subtask_id": "subtask_id",
  "start": "2025-01-15T09:00:00+01:00",
  "end": "2025-01-15T10:30:00+01:00",
  "duration": 90,
  "duration_unit": "m",
  "billing": "UNBILLED",
  "rate": 100.00,
  "rate_unit": "EUR",
  "sum": 150.00,
  "sum_unit": "EUR",
  "type": "timed",
  "user": "User Name",
  "user_id": "user_id",
  "note": "Optional note text"
}
```

This flat structure allows you to use a single Strapi table/collection where each row represents one time entry with all related project information embedded directly.

## Schedule Options

- **Last day of month**: Automatically set the next export for the last day of each month
- **Every N days**: Set a recurring interval (e.g., every 30 days)
- **Starting from date**: Start from a specific date with a recurring interval

Note: Automatic scheduling requires Tyme to be running at the scheduled time.

## Requirements

- Tyme 2025.12 or later
- A Strapi CMS instance with API access
- An API Token with write permissions for the target collection
