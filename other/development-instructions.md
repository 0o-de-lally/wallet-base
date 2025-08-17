# Claude Instructions: Development Task Implementation

## Objective
Systematically implement security improvements and development tasks identified in project documentation, prioritizing security fixes and maintaining backward compatibility.

## Background
This workflow is designed to scan project documentation for actionable items, prioritize them by security impact, and implement fixes following established patterns and conventions.

## Step-by-Step Instructions

### 1. Documentation Review and Task Discovery

**Scan these locations for actionable items:**
- `./docs/*.md` - All documentation files
- `./README.md` - Main project documentation  
- `./.ai/*.md` - AI instruction files
- Security audit reports

**Look for these task indicators:**
- `TODO:` - Direct action items
- `FIXME:` - Code that needs fixing
- `[ ]` - Unchecked checkboxes in task lists
- `Recommendation:` - Suggested improvements
- `Action:` - Required actions
- `Short Term` / `Medium Term` / `Long Term` - Prioritized tasks
- `High priority` / `Critical` - Urgent items

### 2. Task Prioritization

Categorize discovered tasks by priority:

**Security (CRITICAL PRIORITY):**
- Items containing: security, vulnerability, attack, exploit, PIN, encryption, mnemonic
- These MUST be implemented first

**Functionality (HIGH PRIORITY):**
- Items containing: feature, implement, add, missing
- Important but secondary to security

**Performance (MEDIUM PRIORITY):**
- Items containing: performance, optimization, slow, memory
- Optimize after core functionality is secure

**Maintenance (LOW PRIORITY):**
- Items containing: refactor, cleanup, documentation, comment
- Address after higher priority items

### 3. Implementation Planning

Before implementing any changes:

**Dependency Analysis:**
- Check for breaking changes and backward compatibility requirements
- Identify migration requirements for existing data
- Assess testing implications
- Verify third-party library requirements

**Impact Assessment:**
- Evaluate user experience changes
- Consider performance implications
- Review security model changes
- Check API compatibility

### 4. Implementation Execution

**Security Fixes (implement in this order):**
1. Rate limiting and PIN attempt controls
2. Salt randomization and per-record salts  
3. Remove static integrity tokens
4. Increase key derivation strength
5. Implement proper logging controls
6. Memory protection improvements

**Implementation Guidelines:**
- Always maintain backward compatibility where possible
- Implement migration logic for data format changes
- Add comprehensive error handling
- Include unit tests for new security features
- Document security model changes

**Code Implementation Targets:**

*Crypto Improvements:*
- Files: `util/crypto.ts`, `util/pin-security.ts`
- Changes: Replace static salt with per-record random salt, remove custom integrity token, increase PBKDF2 iterations, add ciphertext versioning

*Rate Limiting:*
- Files: `util/pin-security.ts`, `hooks/use-secure-storage.ts`, `hooks/use-transaction-pin.ts`
- Changes: Add PIN attempt tracking, implement exponential backoff, add lockout mechanisms

*Storage Security:*
- Files: `util/secure-store.ts`
- Changes: Obfuscate storage key names, add metadata encryption

*Logging Cleanup:*
- Files: `**/*.ts` (all TypeScript files)
- Changes: Remove or gate sensitive logging statements, add production build log stripping

### 5. Testing Implementation
Add comprehensive tests for security features:
- Unit tests for cryptographic functions
- Integration tests for PIN rate limiting
- Migration tests for data format changes
- Security regression tests

### 6. Documentation Updates

**Generate Changelog Entry:**
Create/update `./CHANGELOG.md` with this format:
```markdown
## [version] - {current_date}

### Security
{security_changes}

### Added
{new_features}

### Changed
{modifications}

### Fixed
{bug_fixes}

### Migration Notes
{migration_notes}
```

**Mark Completed Tasks:**
- Convert `[ ]` to `[x]` for completed checkboxes
- Add completion timestamps to implemented recommendations
- Update status indicators from 'TODO' to 'DONE'
- Add references to changelog entries

**Update Security Documentation:**
- Mark implemented recommendations as complete
- Update risk assessments for fixed vulnerabilities
- Add implementation notes and migration details
- Update residual risk analysis

## Validation Requirements

**Pre-Implementation:**
- Verify all dependencies are compatible
- Ensure no breaking changes without migration path
- Validate security improvements don't introduce new vulnerabilities
- Check that all changes have corresponding tests

**Post-Implementation:**
- Run `bun lint` to check for lint errors
- Run `bun format` to check for format errors  
- Validate that all documentation is updated
- Test functionality in development environment

## Error Handling
- If implementation fails, document the failure reason in changelog
- Partial implementations should be clearly marked as incomplete
- Rollback procedures should be documented for breaking changes
- Failed security fixes should be escalated as critical issues

## Important Guidelines
- **Security First**: Always prioritize security fixes over feature additions
- **Audit Trail**: Maintain clear records of what was changed and why
- **Thorough Testing**: Test thoroughly in development environment before committing
- **Phased Rollout**: Consider phased rollout for major security changes
- **Document Deviations**: Document any deviations from planned implementation
- **Follow Conventions**: Mimic existing code style and patterns
- **No Breaking Changes**: Avoid breaking changes without proper migration paths