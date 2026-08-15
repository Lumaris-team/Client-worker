# Workflows Directory

This directory contains Cloudflare Workers Workflows that handle background tasks, scheduled operations, and complex multi-step processes for the Lumaris platform.

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Available Workflows](#-available-workflows)
- [Workflow Configuration](#-workflow-configuration)
- [Development Guidelines](#-development-guidelines)
- [Testing](#-testing)
- [Monitoring](#-monitoring)

---

## 🎯 Overview

Cloudflare Workers Workflows provide durable execution for background tasks that need to run reliably even in the face of failures. Workflows are ideal for:

- **Scheduled Tasks**: Periodic operations like grade checking
- **Multi-step Processes**: Complex operations that need to track progress
- **Retry Logic**: Automatic retry with exponential backoff
- **Long-running Operations**: Tasks that exceed normal request timeouts

### Key Benefits

- **Durability**: Workflows survive worker restarts and failures
- **Observability**: Built-in tracking of workflow execution
- **Scalability**: Automatic scaling based on workload
- **Reliability**: Built-in retry mechanisms and error handling

---

## 🏗️ Architecture

### Workflow Structure

Each workflow extends the `WorkflowEntrypoint` class:

```javascript
import { WorkflowEntrypoint } from "cloudflare:workers";

export class MyWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    // Workflow logic here
    const result = await step.do("step-name", async () => {
      // Step logic
      return result;
    });
    return result;
  }
}
```

### Step Execution

Workflows are composed of steps that:

- **Execute sequentially**: Each step runs after the previous one completes
- **Automatically retry**: Failed steps are retried with exponential backoff
- **Track progress**: Each step's execution is logged and monitored
- **Pass data**: Results from one step can be used in subsequent steps

### Error Handling

Workflows implement comprehensive error handling:

```javascript
try {
  const result = await step.do("operation", async () => {
    return await performOperation();
  });
  return { success: true, data: result };
} catch (error) {
  console.error("Workflow error:", error);
  return { success: false, error: error.message };
}
```

---

## 📋 Available Workflows

### CheckGradesWorkflow

**Purpose**: Automatically check for new grades from ÉcoleDirecte and send notifications

**File**: `check_grades.js`

**Schedule**: Every 4 hours (configured in `wrangler.toml`)

**Functionality**:
1. Fetches new grades from ÉcoleDirecte API
2. Compares with previous grades to identify new entries
3. Sends notifications for new grades
4. Handles errors gracefully with logging

**Workflow Steps**:

#### Step 1: Fetch New Grades
```javascript
const newGrades = await step.do("fetch-new-grades", async () => {
  return await EDfunction(env, "new-grades", "GET", headers, null);
});
```

**Process**:
- Calls ÉcoleDirecte API with filter for new grades only
- Uses cached authentication token
- Returns structured grade data by period and subject

#### Step 2: Send Notifications
```javascript
await step.do("send-notifications", async () => {
  for (const [periode, matieres] of Object.entries(newGrades)) {
    for (const [matiere, notes] of Object.entries(matieres)) {
      if (Array.isArray(notes) && notes.length > 0) {
        await sendNotifierMessage(env, {
          title: `${gradeBrief} in ${matiere}`,
          message: `${gradeBrief}: ${gradeTexts} in ${matiere} (Period: ${periode})`
        });
      }
    }
  }
});
```

**Process**:
- Iterates through periods and subjects
- Formats grade information for notifications
- Sends individual notifications for each subject with new grades
- Handles multiple grades in the same subject

**Dependencies**:
- `EDfunction`: ÉcoleDirecte API integration
- `sendNotifierMessage`: Notification service

**Error Handling**:
- Logs errors to console
- Returns success/failure status
- Continues processing even if some notifications fail

**Configuration**:
```toml
[[workflows]]
name = "check_grades"
binding = "CHECK_GRADES"
class_name = "CheckGradesWorkflow"

[triggers]
crons = ["0 */4 * * *"]  # Every 4 hours
```

---

## ⚙️ Workflow Configuration

### Wrangler Configuration

Workflows are configured in `wrangler.toml`:

```toml
[[workflows]]
name = "workflow_name"
binding = "WORKFLOW_BINDING"
class_name = "WorkflowClassName"

[triggers]
crons = ["cron_expression"]  # Optional: for scheduled workflows
```

### Binding Names

The binding name is used to trigger workflows:

```javascript
// In main index.js
export default {
  async scheduled(event, env, ctx) {
    await env.CHECK_GRADES.create();
  }
}
```

### Cron Expressions

Schedule workflows using standard cron syntax:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-6, 0 = Sunday)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

**Examples**:
- `0 */4 * * *`: Every 4 hours
- `0 0 * * *`: Every day at midnight
- `0 9 * * 1`: Every Monday at 9 AM
- `*/30 * * * *`: Every 30 minutes

---

## 🛠️ Development Guidelines

### Creating a New Workflow

1. **Create workflow file**:
```javascript
import { WorkflowEntrypoint } from "cloudflare:workers";

export class NewWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    // Implement workflow logic
    const result = await step.do("step-1", async () => {
      // Step 1 logic
      return step1Result;
    });
    
    const finalResult = await step.do("step-2", async () => {
      // Step 2 logic using step1Result
      return processResult(result);
    });
    
    return { success: true, data: finalResult };
  }
}
```

2. **Add to wrangler.toml**:
```toml
[[workflows]]
name = "new_workflow"
binding = "NEW_WORKFLOW"
class_name = "NewWorkflow"
```

3. **Export from main index.js**:
```javascript
export { NewWorkflow };
```

4. **Add trigger if needed**:
```javascript
export default {
  async scheduled(event, env, ctx) {
    await env.NEW_WORKFLOW.create();
  }
}
```

### Best Practices

**Step Design**:
- Keep steps focused and single-purpose
- Use descriptive step names for debugging
- Handle errors within steps when possible
- Return structured data for subsequent steps

**Error Handling**:
- Implement comprehensive error handling
- Log errors with context
- Return meaningful error messages
- Use retry logic for transient failures

**Performance**:
- Minimize external API calls
- Use caching when appropriate
- Batch operations when possible
- Avoid long-running steps

**Monitoring**:
- Log key events and metrics
- Track workflow execution time
- Monitor failure rates
- Set up alerts for critical failures

### Workflow Patterns

**Sequential Processing**:
```javascript
const step1 = await step.do("step-1", async () => {
  return await process1();
});

const step2 = await step.do("step-2", async () => {
  return await process2(step1);
});
```

**Parallel Processing** (when applicable):
```javascript
const [result1, result2] = await Promise.all([
  step.do("step-1", async () => await process1()),
  step.do("step-2", async () => await process2())
]);
```

**Conditional Execution**:
```javascript
if (condition) {
  await step.do("conditional-step", async () => {
    return await conditionalProcess();
  });
}
```

**Loop Processing**:
```javascript
for (const item of items) {
  await step.do(`process-${item.id}`, async () => {
    return await processItem(item);
  });
}
```

---

## 🧪 Testing

### Local Testing

Test workflows locally using Wrangler:

```bash
# Start local development
wrangler dev

# Trigger workflow manually
wrangler workflows trigger check_grades
```

### Unit Testing

Test individual workflow steps:

```javascript
test("CheckGradesWorkflow fetches new grades", async () => {
  const workflow = new CheckGradesWorkflow();
  const result = await workflow.run(event, step);
  expect(result.success).toBe(true);
});
```

### Integration Testing

Test complete workflow execution:

```javascript
test("CheckGradesWorkflow sends notifications for new grades", async () => {
  // Mock EDfunction to return new grades
  // Mock sendNotifierMessage
  // Execute workflow
  // Verify notifications were sent
});
```

### Manual Testing

Test workflow execution in development:

```bash
# Deploy to development
wrangler deploy

# Trigger workflow manually via API
curl -X POST https://your-worker.workers.dev/workflows/check_grades
```

---

## 📊 Monitoring

### Observability

Enable workflow observability in `wrangler.toml`:

```toml
[observability]
enabled = true
head_sampling_rate = 1

[observability.logs]
enabled = true
head_sampling_rate = 1
invocation_logs = true

[observability.traces]
enabled = true
head_sampling_rate = 1
```

### Monitoring Metrics

Track these metrics for workflows:

- **Execution Time**: How long workflows take to complete
- **Success Rate**: Percentage of successful executions
- **Failure Rate**: Percentage of failed executions
- **Retry Count**: Number of retries per step
- **Step Duration**: Time taken for individual steps

### Logging

Implement comprehensive logging:

```javascript
console.log("Workflow started:", { workflowName, timestamp });
console.log("Step completed:", { stepName, duration, result });
console.error("Workflow error:", { error, step, context });
```

### Alerts

Set up alerts for:

- Workflow failures
- High retry counts
- Long execution times
- External API failures

---

## 🔧 Troubleshooting

### Common Issues

**Workflow Not Triggering**:
- Check cron expression in `wrangler.toml`
- Verify workflow binding configuration
- Check scheduled event handler in main index.js

**Step Failing Repeatedly**:
- Review step error logs
- Check external API availability
- Verify input data validity
- Implement better error handling

**Long Execution Times**:
- Profile step performance
- Optimize external API calls
- Implement caching
- Break into smaller steps

**Memory Issues**:
- Reduce data passed between steps
- Process data in batches
- Clear unused variables
- Monitor memory usage

### Debugging

Enable debug logging:

```bash
wrangler dev --log-level debug
```

Check workflow status:

```bash
wrangler workflows status
```

View workflow execution history in Cloudflare Dashboard.

---

## 📚 Additional Resources

- [Cloudflare Workers Workflows Documentation](https://developers.cloudflare.com/workers/configuration/workflows/)
- [Workflow Best Practices](https://developers.cloudflare.com/workers/configuration/workflows/best-practices/)
- [Workflow Observability](https://developers.cloudflare.com/workers/configuration/workflows/observability/)

---

## 🚀 Deployment

Deploy workflows with the main worker:

```bash
# Deploy to development
wrangler dev

# Deploy to production
wrangler deploy --env production
```

Workflows are automatically registered and configured during deployment.

---

## 📝 Notes

- Workflows are durable and survive worker restarts
- Steps are automatically retried on failure
- Workflow state is persisted between steps
- Scheduled workflows trigger based on cron expression
- Manual workflow triggering is supported
- Workflow execution is observable and monitorable

---

## 🎯 Future Enhancements

Planned workflow additions:

- **Homework Reminder Workflow**: Send reminders for upcoming homework
- **Study Schedule Workflow**: Generate personalized study schedules
- **Performance Analytics Workflow**: Analyze academic performance trends
- **Storage Cleanup Workflow**: Clean up temporary files and old data
- **Backup Workflow**: Regular data backup operations

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>