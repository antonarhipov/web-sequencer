# Project Guidelines

## Working with the Task Checklist

The project uses a spec-driven development approach with planning artifacts in the `docs/` directory:

- **`docs/requirements.md`** — Requirements with user stories and acceptance criteria
- **`docs/plan.md`** — Implementation plan with priorities and requirement links
- **`docs/tasks.md`** — Detailed task checklist organized by development phases

### Marking Tasks Complete

When completing a task, update its checkbox in `docs/tasks.md`:

```markdown
# Before
- [ ] 1.1.1 Initialize new Vite project with TypeScript template

# After
- [x] 1.1.1 Initialize new Vite project with TypeScript template
```

### Task Management Rules

1. **Complete tasks in order** — Work through phases sequentially (Phase 1 before Phase 2, etc.) unless dependencies allow parallel work.

2. **Keep phases intact** — Do not remove or rename phase headers. The phase structure reflects the implementation plan.

3. **Adding new tasks** — If you need to add a task:
   - Insert it in the appropriate phase section
   - Use the next available number in the sequence (e.g., if 2.1.8 exists, add 2.1.9)
   - Link to the relevant plan item and requirement:
     ```markdown
     - [ ] 2.1.9 New task description
     ```
   - Update the phase header's plan/requirements reference if needed

4. **Splitting tasks** — If a task is too large, split it into sub-tasks:
   ```markdown
   - [ ] 5.2.5 Implement ADSR envelope on GainNode:
     - [ ] 5.2.5.1 Attack: ramp to peak in ~0.005s
     - [ ] 5.2.5.2 Decay: ramp to sustain level
   ```

5. **Linking requirements** — Every task should trace back to:
   - A plan item in `docs/plan.md` (e.g., P1.1, P2.3)
   - One or more requirements in `docs/requirements.md` (e.g., Req 6, Req 8)

### Formatting Guidelines

- Use `- [ ]` for incomplete tasks
- Use `- [x]` for completed tasks
- Maintain consistent indentation (2 spaces for sub-tasks)
- Keep task descriptions concise but specific
- Preserve the `> Plan: P#.# | Requirements: Req #, Req #` reference lines

### Before Committing

1. Ensure all completed work has corresponding tasks marked `[x]`
2. Verify any new tasks are properly numbered and linked
3. Run tests for completed features before marking tasks done
4. Update `docs/plan.md` if implementation approach changes significantly

## Code Organization

Follow this directory structure:

```
src/
├── dsl/           # DSL tokenizer, parser, compiler
│   ├── __tests__/ # Unit tests for DSL modules
│   ├── pitch.ts
│   ├── duration.ts
│   ├── tokenizer.ts
│   ├── parser.ts
│   └── compiler.ts
├── audio/         # Web Audio engine
│   ├── engine.ts
│   └── scheduler.ts
└── ui/            # UI components
    └── app.ts
```

## Testing

- Write unit tests alongside implementation
- Place tests in `__tests__/` directories adjacent to source files
- Run tests in non-interactive mode with `npm test -- --run` before marking tasks complete
- Test coverage should include:
  - Happy path scenarios
  - Edge cases
  - Error conditions
