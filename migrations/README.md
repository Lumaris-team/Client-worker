# Database Migrations

This directory contains database migration files for the Lumaris platform, managing schema changes and database versioning using Cloudflare D1.

## 📋 Table of Contents

- [Overview](#-overview)
- [Migration Architecture](#-migration-architecture)
- [Available Migrations](#-available-migrations)
- [Migration Process](#-migration-process)
- [Schema Management](#-schema-management)
- [Development Guidelines](#-development-guidelines)

---

## 🎯 Overview

Database migrations provide a structured approach to managing database schema changes over time:

- **Version Control**: Track all database schema changes
- **Rollback Support**: Ability to revert schema changes
- **Team Collaboration**: Consistent database across environments
- **Automated Deployment**: Apply migrations automatically during deployment
- **Change Documentation**: Clear history of database modifications

### Migration Philosophy

- **Incremental Changes**: Each migration makes a single, logical change
- **Idempotent**: Migrations can be run multiple times safely
- **Reversible**: Migrations should be reversible when possible
- **Tested**: Migrations are tested before production deployment
- **Documented**: Each migration includes clear documentation

---

## 🏗️ Migration Architecture

### Migration Structure

```
migrations/
├── 0001_create_customization_table.sql
├── 0002_create_users_table.sql (planned)
├── 0003_create_pomodoro_table.sql (planned)
└── 0004_create_websites_table.sql (planned)
```

### Naming Convention

**Format**: `NNNN_description.sql`

- **NNNN**: Sequential 4-digit number (0001, 0002, etc.)
- **description**: Snake_case description of the migration
- **.sql**: SQL file extension

**Examples**:
- `0001_create_customization_table.sql`
- `0002_add_user_preferences.sql`
- `0003_create_pomodoro_sessions.sql`

---

## 📦 Available Migrations

### 0001: Create Customization Table

**File**: `0001_create_customization_table.sql`

**Purpose**: Create the user customization settings table

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS customization (
  user_id TEXT PRIMARY KEY,
  background_type TEXT NOT NULL DEFAULT 'gradient',
  background_gradient_style TEXT NOT NULL DEFAULT 'linear',
  background_gradient_orientation TEXT NOT NULL DEFAULT '135deg',
  background_color_1 TEXT NOT NULL DEFAULT '#0b3f91',
  background_color_2 TEXT NOT NULL DEFAULT '#1c8cff',
  background_solid_color TEXT NOT NULL DEFAULT '#08100f',
  background_font_family TEXT NOT NULL DEFAULT 'Inter, ui-sans-serif, system-ui, sans-serif',
  background_font_weight TEXT NOT NULL DEFAULT '500',
  background_font_size INTEGER NOT NULL DEFAULT 16,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customization_user_id ON customization(user_id);
```

**Columns**:
- `user_id`: Primary key, references user ID
- `background_type`: Background type (gradient/solid)
- `background_gradient_style`: Gradient style (linear/radial)
- `background_gradient_orientation`: Gradient angle
- `background_color_1`: Primary color
- `background_color_2`: Secondary color
- `background_solid_color`: Solid background color
- `background_font_family`: Font family
- `background_font_weight`: Font weight
- `background_font_size`: Font size in pixels
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp

**Indexes**:
- `idx_customization_user_id`: Primary key index

---

## 🚀 Migration Process

### Running Migrations

**Local Development**:
```bash
# Apply migration to local D1 database
wrangler d1 execute customization --local --file=./migrations/0001_create_customization_table.sql
```

**Development Environment**:
```bash
# Apply migration to development database
wrangler d1 execute customization --file=./migrations/0001_create_customization_table.sql
```

**Production Environment**:
```bash
# Apply migration to production database
wrangler d1 execute customization --env production --file=./migrations/0001_create_customization_table.sql
```

### Batch Migration

**Apply All Migrations**:
```bash
# Create a script to apply all migrations
for file in migrations/*.sql; do
  echo "Applying $file..."
  wrangler d1 execute customization --file="$file"
done
```

### Migration Status Check

**Check Current Schema**:
```bash
# View current database schema
wrangler d1 execute customization --command="SELECT sql FROM sqlite_master WHERE type='table'"
```

**Check Tables**:
```bash
# List all tables
wrangler d1 execute customization --command="SELECT name FROM sqlite_master WHERE type='table'"
```

---

## 🗄️ Schema Management

### Database Schema Overview

**Current Tables**:
- `customization`: User customization settings

**Planned Tables**:
- `users`: User accounts and profiles
- `pomodoro_sessions`: Pomodoro timer sessions
- `websites`: Website blocking rules
- `study_notes`: Study notes and content
- `files`: File metadata and organization

### Schema Design Principles

**Naming Conventions**:
- Table names: snake_case, plural (e.g., `users`, `settings`)
- Column names: snake_case (e.g., `user_id`, `created_at`)
- Index names: `idx_table_name` (e.g., `idx_users_email`)
- Foreign keys: `table_id` (e.g., `user_id`)

**Data Types**:
- `TEXT`: Strings and text data
- `INTEGER`: Whole numbers
- `REAL`: Decimal numbers
- `TIMESTAMP`: Date and time values
- `BOOLEAN`: True/false values (stored as INTEGER)

**Constraints**:
- `PRIMARY KEY`: Unique identifier
- `FOREIGN KEY`: Reference to other tables
- `UNIQUE`: Ensure column uniqueness
- `NOT NULL`: Require values
- `DEFAULT`: Default values

---

## 🛠️ Development Guidelines

### Creating New Migrations

1. **Create migration file** with proper naming
2. **Write SQL statements** for schema changes
3. **Test locally** before deployment
4. **Document changes** in migration file
5. **Review with team** before committing
6. **Apply to development** environment
7. **Test thoroughly** in development
8. **Apply to production** during maintenance window

**Migration Template**:
```sql
-- Migration: NNNN_migration_description
-- Description: Detailed description of what this migration does
-- Author: Your Name
-- Date: YYYY-MM-DD

-- UP: Apply this migration
CREATE TABLE IF NOT EXISTS table_name (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  column_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);

-- DOWN: Rollback this migration (if applicable)
-- DROP TABLE IF EXISTS table_name;
```

### Best Practices

**Migration Design**:
- **One Change Per File**: Each migration should make one logical change
- **Test in Isolation**: Ensure migration works independently
- **Backwards Compatible**: Prefer changes that don't break existing code
- **Use Transactions**: Wrap complex changes in transactions
- **Add Comments**: Document the purpose of each change

**SQL Best Practices**:
```sql
-- Use IF NOT EXISTS for safe re-runs
CREATE TABLE IF NOT EXISTS table_name (...);

-- Use IF EXISTS for safe deletions
DROP TABLE IF EXISTS table_name;

-- Add descriptive comments
-- This index improves query performance for user lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Use proper data types
-- Avoid using TEXT for numeric values
column_name INTEGER NOT NULL DEFAULT 0;
```

### Testing Migrations

**Local Testing**:
```bash
# Test migration on local database
wrangler d1 execute customization --local --file=./migrations/0001_new_migration.sql

# Verify the migration
wrangler d1 execute customization --local --command="SELECT * FROM table_name LIMIT 5"
```

**Data Validation**:
```sql
-- Check data integrity after migration
SELECT COUNT(*) FROM table_name;

-- Verify constraints
PRAGMA integrity_check;

-- Check indexes
PRAGMA index_list(table_name);
```

### Rollback Strategy

**Manual Rollback**:
```sql
-- Create rollback migration
-- NNNN_rollback_migration_description.sql

DROP TABLE IF EXISTS table_name;
DROP INDEX IF EXISTS idx_table_column;
```

**Rollback Process**:
```bash
# Apply rollback migration
wrangler d1 execute customization --file=./migrations/NNNN_rollback_migration.sql
```

---

## 🔧 Troubleshooting

### Common Issues

**Migration Fails**:
- Check SQL syntax errors
- Verify database connection
- Check for existing schema conflicts
- Review error messages carefully

**Data Loss**:
- Always backup before migrations
- Test migrations on copy of production data
- Use transactions for complex changes
- Have rollback plan ready

**Performance Issues**:
- Large migrations may timeout
- Consider batching large changes
- Add indexes after data migration
- Monitor performance during migration

### Debugging

**Migration Logging**:
```bash
# Enable verbose logging
wrangler d1 execute customization --file=./migrations/0001_migration.sql --verbose
```

**Schema Inspection**:
```bash
# View table schema
wrangler d1 execute customization --command="PRAGMA table_info(table_name)"

# View indexes
wrangler d1 execute customization --command="PRAGMA index_list(table_name)"

# View foreign keys
wrangler d1 execute customization --command="PRAGMA foreign_key_list(table_name)"
```

---

## 📚 Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Database Migration Best Practices](https://www.brendangregg.com/blog/evolutionary-database-design.html)
- [SQL Style Guide](https://www.sqlstyle.guide/)

---

## 🚀 Future Migrations

Planned database schema additions:

- **Users Table**: User accounts and authentication
- **Pomodoro Sessions Table**: Timer session tracking
- **Websites Table**: Website blocking rules
- **Study Notes Table**: Note storage and organization
- **Files Table**: File metadata and management
- **Notifications Table**: Notification history
- **Analytics Table**: Usage analytics and metrics

---

## 📝 Notes

- Migrations are applied sequentially
- Always test migrations before production
- Use proper SQL syntax and conventions
- Document changes thoroughly
- Plan rollback strategies
- Monitor performance after migrations
- Keep migrations simple and focused
- Use transactions for complex changes

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>