# AI Agent Instructions

This directory contains YAML configuration files that provide structured instructions for AI agents working on this codebase.

## Files

### `security-audit.yaml`
Comprehensive instructions for conducting security audits focused on mnemonic protection and cryptographic implementations.

**Purpose**: Guide AI agents through systematic security analysis and vulnerability assessment.

**Output**: Generates detailed security audit reports in `./docs/mnemonic_security_audit_{date}.md`

**Key Features**:
- Attack vector analysis
- Threat modeling
- Vulnerability assessment with severity ratings
- Mitigation recommendations
- Code-level implementation guidance

### `development.yaml`
Instructions for implementing security improvements and development tasks identified in documentation.

**Purpose**: Automate the implementation of security fixes and feature improvements.

**Key Features**:
- Documentation scanning for actionable items
- Task prioritization (security-first approach)
- Systematic implementation planning
- Automated changelog generation
- Task completion tracking

## Usage Guidelines

### For Security Audits
1. Run the security audit agent using `security-audit.yaml`
2. Review the generated report in `./docs/`
3. Prioritize critical and high-severity findings
4. Use the development agent to implement fixes

### For Development Tasks
1. Ensure all documentation contains clear, actionable items
2. Run the development agent using `development.yaml`
3. Review generated changelog entries
4. Verify that completed tasks are properly marked

## Best Practices

- **Security First**: Always prioritize security fixes over feature additions
- **Backward Compatibility**: Maintain compatibility and provide migration paths
- **Documentation**: Keep all changes well-documented with clear reasoning
- **Testing**: Implement comprehensive tests for security-critical changes
- **Audit Trail**: Maintain clear records of what was changed and why

## File Format

All instruction files use YAML format with the following structure:
- `name`: Human-readable name of the workflow
- `description`: Purpose and scope
- `workflow`: Step-by-step instructions
- `output`: Expected deliverables
- `validation`: Quality assurance requirements
- `execution_notes`: Important considerations for implementation

## Integration

These files are designed to work together:
1. Security audit identifies vulnerabilities and recommendations
2. Development workflow implements the recommended fixes
3. Documentation is automatically updated to reflect completed work
4. Changelog maintains a clear history of security improvements

This approach ensures systematic, security-focused development with comprehensive documentation and traceability.
