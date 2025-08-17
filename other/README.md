# Claude AI Instructions

This directory contains Markdown instruction files specifically designed for Claude AI to work on this codebase systematically and securely.

## Files

### `security-audit-instructions.md`
Comprehensive instructions for conducting security audits focused on mnemonic protection and cryptographic implementations.

**Purpose**: Guide Claude through systematic security analysis and vulnerability assessment of the wallet application.

**Output**: Generates detailed security audit reports in `./docs/mnemonic_security_audit_{date}.md`

**Key Features**:
- Step-by-step code review process
- Attack vector analysis and threat modeling
- Vulnerability assessment with severity ratings
- Mitigation recommendations with implementation details
- Specific file targets and quality requirements

### `development-instructions.md`
Instructions for implementing security improvements and development tasks identified in documentation.

**Purpose**: Guide Claude in systematically implementing security fixes and feature improvements while maintaining backward compatibility.

**Key Features**:
- Documentation scanning for actionable items
- Task prioritization (security-first approach)
- Systematic implementation planning with dependency analysis
- Automated changelog generation
- Comprehensive testing and validation requirements

## Usage Guidelines

### For Security Audits
1. Provide Claude with the `security-audit-instructions.md` file
2. Claude will systematically review the codebase and generate a security audit report
3. Review the generated report in `./docs/mnemonic_security_audit_{date}.md`
4. Prioritize critical and high-severity findings
5. Use the development instructions to implement fixes

### For Development Tasks
1. Ensure all documentation contains clear, actionable items
2. Provide Claude with the `development-instructions.md` file
3. Claude will scan documentation, prioritize tasks, and implement changes
4. Review generated changelog entries
5. Verify that completed tasks are properly marked

## Best Practices

- **Security First**: Always prioritize security fixes over feature additions
- **Backward Compatibility**: Maintain compatibility and provide migration paths
- **Documentation**: Keep all changes well-documented with clear reasoning
- **Testing**: Implement comprehensive tests for security-critical changes
- **Audit Trail**: Maintain clear records of what was changed and why

## File Format

All instruction files use Markdown format optimized for Claude AI with the following structure:
- **Objective**: Clear goal and purpose
- **Background**: Context and scope
- **Step-by-Step Instructions**: Detailed workflow with specific actions
- **Output Format**: Expected deliverables and templates
- **Quality Requirements**: Validation criteria and standards
- **Important Guidelines**: Key considerations and best practices

## Integration

These instruction files are designed to work together with Claude AI:
1. Security audit instructions guide Claude to identify vulnerabilities and recommendations
2. Development instructions help Claude implement the recommended fixes systematically
3. Documentation is automatically updated to reflect completed work
4. Changelog maintains a clear history of security improvements

This approach ensures systematic, security-focused development with comprehensive documentation and traceability, all guided by clear instructions that Claude can follow autonomously.
